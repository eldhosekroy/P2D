import { APIGatewayProxyHandler } from 'aws-lambda';
import { z } from 'zod';
import { supabase } from '../../../shared/services/supabase_client';
import { logger } from '../../../shared/utils/logger';
import { ApiResponse } from '../../../shared/utils/api_response';
import { authMiddleware } from '../../../shared/middleware/auth_middleware';
import { rbacMiddleware } from '../../../shared/middleware/rbac_middleware';
// import { sqs } from '../../../shared/services/sqs_client'; // To push notifications to driver/customer via SQS

const assignDriverSchema = z.object({
  orderId: z.string().uuid(),
  driverId: z.string().uuid(),
});

const assignDriverHandler: APIGatewayProxyHandler = async (event) => {
  try {
    // This lambda could be invoked by API Gateway (e.g., admin manually assigning) or SQS (automated system)
    // For API Gateway, we'll use RBAC.
    const body = JSON.parse(event.body || '{}');
    const { orderId, driverId } = assignDriverSchema.parse(body);

    // 1. Check if the order exists and is in a 'pending' state
    const { data: existingOrder, error: fetchError } = await supabase
      .from('orders')
      .select('id, status')
      .eq('id', orderId)
      .single();

    if (fetchError || !existingOrder) {
      logger.warn('Order not found or access denied', { orderId, fetchError });
      return ApiResponse.notFound('Order not found.');
    }

    if (existingOrder.status !== 'pending') {
      return ApiResponse.badRequest(`Order is already ${existingOrder.status}. Cannot assign driver.`);
    }

    // 2. Check if the driver exists and is available
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('driver_id, is_available')
      .eq('driver_id', driverId)
      .single();

    if (driverError || !driver) {
      logger.warn('Driver not found or access denied', { driverId, driverError });
      return ApiResponse.badRequest('Driver not found.');
    }

    if (!driver.is_available) {
      return ApiResponse.badRequest('Driver is not available.');
    }

    // 3. Update the order in Supabase
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        driver_id: driverId,
        status: 'assigned',
      })
      .eq('id', orderId)
      .select('id, customer_id, driver_id, status')
      .single();

    if (updateError || !updatedOrder) {
      logger.error('Failed to assign driver to order', updateError);
      return ApiResponse.internalServerError('Failed to assign driver.');
    }

    // 4. Notify the driver and customer (via SQS to notification lambda, or direct FCM)
    // For simplicity, this is a placeholder. A real implementation would push to SQS
    // or use FCM directly to notify both parties.
    logger.info('Driver assigned to order', { orderId: updatedOrder.id, driverId: updatedOrder.driver_id });

    return ApiResponse.success({
      orderId: updatedOrder.id,
      driverId: updatedOrder.driver_id,
      status: updatedOrder.status,
      message: 'Driver assigned to order successfully.',
    });
  } catch (error: any) {
    logger.error('Assign driver error', error);

    if (error instanceof z.ZodError) {
      return ApiResponse.badRequest('Validation Error', error.errors);
    }

    return ApiResponse.internalServerError('Failed to assign driver.');
  }
};

export const handler = authMiddleware(rbacMiddleware(['admin'])(assignDriverHandler));
