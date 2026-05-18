import { APIGatewayProxyHandler } from 'aws-lambda';
import { z } from 'zod';
import crypto from 'crypto';
import { supabase } from '../../shared/services/supabase_client';
import { logger } from '../../shared/utils/logger';
import { ApiResponse } from '../../shared/utils/api_response';
// import { sendPushNotification } from '../../shared/services/fcm_client'; // To send notifications
// import { sendEmail } from '../../shared/services/ses_client'; // To send payment receipts

const webhookEventSchema = z.object({
  entity: z.string(),
  account_id: z.string(),
  event: z.string(), // e.g., 'payment.captured', 'order.paid', 'refund.processed'
  contains: z.array(z.string()),
  payload: z.any(), // Structure depends on the event type
  created_at: z.number(),
});

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // Razorpay webhook events do not go through Cognito Authorizer, so no userId from token
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || '';
    const razorpaySignature = event.headers['x-razorpay-signature'] || '';

    if (!event.body) {
      logger.warn('Razorpay webhook received with empty body');
      return ApiResponse.badRequest('Empty webhook body.');
    }

    // 1. Verify Razorpay webhook signature
    const generatedSignature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(event.body)
      .digest('hex');

    if (generatedSignature !== razorpaySignature) {
      logger.error('Razorpay webhook signature mismatch', { providedSignature: razorpaySignature, generatedSignature });
      return ApiResponse.unauthorized('Invalid webhook signature.');
    }

    const webhookEvent = webhookEventSchema.parse(JSON.parse(event.body));

    logger.info('Razorpay webhook received', { eventType: webhookEvent.event, payloadId: webhookEvent.payload?.payment?.entity?.id || webhookEvent.payload?.order?.entity?.id });

    // 2. Process event based on type
    switch (webhookEvent.event) {
      case 'payment.captured':
      case 'order.paid': {
        const paymentEntity = webhookEvent.payload.payment.entity;
        const orderEntity = webhookEvent.payload.order?.entity; // order.paid events include order entity

        const razorpayPaymentId = paymentEntity.id;
        const razorpayOrderId = paymentEntity.order_id || orderEntity?.id; // Use order.id for order.paid webhook
        const paymentStatus = paymentEntity.status; // e.g., 'captured'
        const amount = paymentEntity.amount / 100; // Convert paise to INR

        if (!razorpayPaymentId || !razorpayOrderId) {
            logger.error('Missing payment or order ID in webhook payload', { webhookEvent });
            return ApiResponse.badRequest('Invalid payload for payment capture.');
        }

        // Update payment and order status in Supabase
        const { data: order, error: fetchOrderError } = await supabase
            .from('orders')
            .select('id, customer_id')
            .eq('razorpay_order_id', razorpayOrderId)
            .single();
        
        if (fetchOrderError || !order) {
            logger.error('Order not found for Razorpay order ID in webhook', { razorpayOrderId, fetchOrderError });
            return ApiResponse.notFound('Order not found for webhook processing.');
        }

        await supabase
          .from('payments')
          .upsert({
            razorpay_payment_id: razorpayPaymentId,
            order_id: order.id,
            customer_id: order.customer_id,
            amount: amount,
            currency: paymentEntity.currency,
            method: paymentEntity.method,
            status: paymentStatus,
            razorpay_signature: razorpaySignature, // Store webhook signature
          }, { onConflict: 'razorpay_payment_id' });

        await supabase
          .from('orders')
          .update({ payment_status: 'paid' })
          .eq('id', order.id);

        logger.info('Payment captured and order updated', { orderId: order.id, razorpayPaymentId });

        // TODO: Send payment receipt email via SES
        // TODO: Push confirmation notification via FCM to customer
        break;
      }
      case 'refund.processed': {
        // Handle refund processing, update payment status to 'refunded'
        const refundEntity = webhookEvent.payload.refund.entity;
        const paymentId = refundEntity.payment_id;
        const refundStatus = refundEntity.status; // e.g., 'processed'

        await supabase
          .from('payments')
          .update({ status: refundStatus })
          .eq('razorpay_payment_id', paymentId);

        logger.info('Refund processed and payment updated', { paymentId, refundStatus });
        break;
      }
      // Add more cases for other event types as needed
      default:
        logger.warn('Unhandled Razorpay webhook event', { eventType: webhookEvent.event });
        break;
    }

    return ApiResponse.success({ received: true });
  } catch (error: any) {
    logger.error('Razorpay webhook processing error', error, { body: event.body });

    if (error instanceof z.ZodError) {
      return ApiResponse.badRequest('Validation Error', error.errors);
    }

    return ApiResponse.internalServerError('Failed to process webhook.');
  }
};
