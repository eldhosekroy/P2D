import { APIGatewayProxyHandler } from 'aws-lambda';
import { z } from 'zod';
import crypto from 'crypto';
import { supabase } from '../../shared/services/supabase_client';
import { logger } from '../../shared/utils/logger';
import { ApiResponse } from '../../shared/utils/api_response';
import { authMiddleware } from '../../shared/middleware/auth_middleware';
import { rbacMiddleware } from '../../shared/middleware/rbac_middleware';

const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

const verifyPaymentHandler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) {
      return ApiResponse.unauthorized('User ID not found in token.');
    }

    const body = JSON.parse(event.body || '{}');
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = verifyPaymentSchema.parse(body);

    // 1. Verify signature: HMAC-SHA256(order_id + "|" + payment_id, secret)
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || '';
    const generatedSignature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      logger.warn('Invalid Razorpay signature', { razorpay_order_id, razorpay_payment_id });
      return ApiResponse.badRequest('Invalid payment signature.');
    }

    // 2. Fetch the order associated with this razorpay_order_id
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('id, customer_id, estimated_price')
      .eq('razorpay_order_id', razorpay_order_id)
      .single();

    if (fetchError || !order) {
      logger.error('Order not found for verified payment', { razorpay_order_id, fetchError });
      return ApiResponse.notFound('Order associated with this payment not found.');
    }

    // 3. Update order payment_status to 'paid' and insert into payments table
    const { error: updateError } = await supabase
      .from('orders')
      .update({ payment_status: 'paid' })
      .eq('id', order.id);

    if (updateError) {
      logger.error('Failed to update order payment status', updateError);
      return ApiResponse.internalServerError('Payment verified but failed to update order status.');
    }

    const { error: insertPaymentError } = await supabase
      .from('payments')
      .insert({
        order_id: order.id,
        customer_id: userId,
        amount: order.estimated_price,
        razorpay_payment_id,
        razorpay_signature,
        status: 'captured',
      });

    if (insertPaymentError) {
      logger.error('Failed to insert record into payments table', insertPaymentError);
      // Not returning error here as order status is already updated.
    }

    logger.info('Payment verified successfully', { orderId: order.id, razorpay_payment_id });

    // 4. Return success status
    return ApiResponse.success({
      message: 'Payment verified successfully.',
      orderId: order.id,
    });

  } catch (error: any) {
    logger.error('Verify payment error', error);

    if (error instanceof z.ZodError) {
      return ApiResponse.badRequest('Validation Error', error.errors);
    }

    return ApiResponse.internalServerError('Failed to verify payment.');
  }
};

export const handler = authMiddleware(rbacMiddleware(['customer'])(verifyPaymentHandler));
