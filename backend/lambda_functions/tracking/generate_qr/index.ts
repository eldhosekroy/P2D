import { APIGatewayProxyHandler } from 'aws-lambda';
import { z } from 'zod';
import crypto from 'crypto';
import { GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { supabase } from '../../shared/services/supabase_client';
import { logger } from '../../shared/utils/logger';
import { ApiResponse } from '../../shared/utils/api_response';
import { secretsManager } from '../../shared/services/secrets_client';
import { authMiddleware } from '../../shared/middleware/auth_middleware';
import { rbacMiddleware } from '../../shared/middleware/rbac_middleware';

const generateQrSchema = z.object({
  orderId: z.string().uuid(),
  type: z.enum(['pickup', 'delivery']),
});

const QR_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes expiry for QR codes

const generateQrHandler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) {
      return ApiResponse.unauthorized('User ID not found in token.');
    }

    const body = JSON.parse(event.body || '{}');
    const { orderId, type } = generateQrSchema.parse(body);

    // 1. Fetch order details to verify ownership and status
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('id, customer_id, driver_id, status, pickup_qr_token, delivery_qr_token')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      logger.warn('Order not found for QR generation', { orderId, userId, fetchError });
      return ApiResponse.notFound('Order not found.');
    }

    // Authorization: Customer can generate pickup QR for their order, Driver can generate pickup/delivery QR.
    // Admin could potentially also generate QR for verification purposes.
    const isCustomer = order.customer_id === userId && type === 'pickup';
    const isDriver = order.driver_id === userId;

    if (!isCustomer && !isDriver) {
      return ApiResponse.forbidden('You are not authorized to generate QR for this order.');
    }

    // Check if QR token already exists and is not expired
    const existingTokenField = type === 'pickup' ? 'pickup_qr_token' : 'delivery_qr_token';
    const existingToken = order[existingTokenField];

    if (existingToken) {
      try {
        const [payloadBase64, signature] = existingToken.split('.');
        const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
        if (payload.exp > Date.now()) { // Check if token is not expired
          logger.info('Using existing valid QR token', { orderId, type });
          return ApiResponse.success({ qrToken: existingToken });
        }
      } catch (parseError) {
        logger.warn('Failed to parse existing QR token, regenerating', { orderId, type, parseError });
      }
    }

    // 2. Retrieve QR HMAC secret from AWS Secrets Manager
    let qrHmacSecret: string;
    try {
      const secretCommand = new GetSecretValueCommand({
        SecretId: 'QR_HMAC_SECRET',
      });
      const secretData = await secretsManager.send(secretCommand);
      qrHmacSecret = secretData.SecretString as string;
      if (!qrHmacSecret) throw new Error('QR_HMAC_SECRET not found or empty');
    } catch (secretError) {
      logger.error('Failed to retrieve QR_HMAC_SECRET', secretError);
      return ApiResponse.internalServerError('Failed to retrieve security secret.');
    }

    // 3. Create payload for QR code
    const expiryTimestamp = Date.now() + QR_EXPIRY_MS;
    const payload = {
      orderId,
      type,
      exp: expiryTimestamp,
      // Include userId for additional verification if needed, especially for driver actions
      ...(isDriver && { userId }), 
    };
    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64');

    // 4. Sign the payload with HMAC-SHA256
    const hmac = crypto.createHmac('sha256', qrHmacSecret);
    hmac.update(payloadBase64);
    const signature = hmac.digest('hex');

    const qrToken = `${payloadBase64}.${signature}`;

    // 5. Update the order in Supabase with the new QR token
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        [existingTokenField]: qrToken,
      })
      .eq('id', orderId);

    if (updateError) {
      logger.error('Failed to update order with QR token', updateError);
      return ApiResponse.internalServerError('Failed to generate QR token.');
    }

    logger.info('QR token generated and updated', { orderId, type, qrTokenHash: qrToken.substring(0, 20) + '...' });

    return ApiResponse.success({ qrToken });
  } catch (error: any) {
    logger.error('Generate QR error', error);

    if (error instanceof z.ZodError) {
      return ApiResponse.badRequest('Validation Error', error.errors);
    }

    return ApiResponse.internalServerError('Failed to generate QR token.');
  }
};

// For QR generation, customers can only generate pickup, drivers can generate pickup/delivery
export const handler = authMiddleware(rbacMiddleware(['customer', 'driver'])(generateQrHandler));
