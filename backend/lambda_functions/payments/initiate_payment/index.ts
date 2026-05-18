import { APIGatewayProxyHandler } from 'aws-lambda';
import { z } from 'zod';
import { razorpay } from '../../shared/services/razorpay_client';
import { supabase } from '../../shared/services/supabase_client';
import { logger } from '../../shared/utils/logger';
import { ApiResponse } from '../../shared/utils/api_response';
import { authMiddleware } from '../../shared/middleware/auth_middleware';
import { rbacMiddleware } from '../../shared/middleware/rbac_middleware';

const initiatePaymentSchema = z.object({
  orderId: z.string().uuid(),
});

const initiatePaymentHandler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) {
      return ApiResponse.unauthorized('User ID not found in token.');
    }

    const body = JSON.parse(event.body || '{}');
    const { orderId } = initiatePaymentSchema.parse(body);

    // 1. Fetch order details to verify ownership and amount
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('id, customer_id, estimated_price, status, payment_status')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      logger.warn('Order not found for payment initiation', { orderId, userId, fetchError });
      return ApiResponse.notFound('Order not found.');
    }

    if (order.customer_id !== userId) {
      return ApiResponse.forbidden('You are not authorized to pay for this order.');
    }

    if (order.payment_status === 'paid') {
      return ApiResponse.badRequest('This order is already paid.');
    }

    // 2. Create Razorpay order via Razorpay API
    const amountInPaise = Math.round(order.estimated_price * 100);
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_order_${order.id}`,
      notes: {
        order_id: order.id,
        customer_id: userId,
      },
    });

    // 3. Store razorpay_order_id in Supabase
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        razorpay_order_id: razorpayOrder.id,
      })
      .eq('id', orderId);

    if (updateError) {
      logger.error('Failed to update order with Razorpay order ID', updateError);
      return ApiResponse.internalServerError('Failed to initiate payment.');
    }

    logger.info('Razorpay order created', { orderId, razorpayOrderId: razorpayOrder.id });

    // 4. Return: razorpayOrderId, amount, currency, keyId
    return ApiResponse.success({
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });

  } catch (error: any) {
    logger.error('Initiate payment error', error);

    if (error instanceof z.ZodError) {
      return ApiResponse.badRequest('Validation Error', error.errors);
    }

    return ApiResponse.internalServerError('Failed to initiate payment.');
  }
};

export const handler = authMiddleware(rbacMiddleware(['customer'])(initiatePaymentHandler));
