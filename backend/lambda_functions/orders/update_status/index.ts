import { APIGatewayProxyHandler } from 'aws-lambda';
import { z } from 'zod';
import { supabase } from '../../shared/services/supabase_client';
import { logger } from '../../shared/utils/logger';
import { ApiResponse } from '../../shared/utils/api_response';
import { authMiddleware } from '../../shared/middleware/auth_middleware';
import { rbacMiddleware } from '../../shared/middleware/rbac_middleware';
// import { sqs } from '../../shared/services/sqs_client'; // For sending notifications on status change

const orderStatusSchema = z.enum(['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled']);

const updateStatusSchema = z.object({
  orderId: z.string().uuid(),
  newStatus: orderStatusSchema,
  // otp: z.string().optional(), // For pickup/delivery OTP verification
});

const updateStatusHandler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub; // Cognito Sub for the user
    const userRole = event.requestContext.authorizer?.claims?.['custom:role'] || 'customer';

    if (!userId) {
      return ApiResponse.unauthorized('User ID not found in token.');
    }

    const body = JSON.parse(event.body || '{}');
    const { orderId, newStatus } = updateStatusSchema.parse(body);

    // 1. Fetch current order status and details
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('id, customer_id, driver_id, status, pickup_otp, delivery_otp')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      logger.warn('Order not found or access denied', { orderId, userId, userRole, fetchError });
      return ApiResponse.notFound('Order not found.');
    }

    // Authorization checks based on role and order ownership
    const isCustomer = userRole === 'customer' && order.customer_id === userId;
    const isDriver = userRole === 'driver' && order.driver_id === userId;
    const isAdmin = userRole === 'admin';

    if (!isCustomer && !isDriver && !isAdmin) {
      return ApiResponse.forbidden('You do not have permission to update this order.');
    }

    // Status transition validation and role-based permissions
    let updateFields: { status: string, picked_up_at?: string, delivered_at?: string } = { status: newStatus };

    switch (order.status) {
      case 'pending':
        if (newStatus === 'cancelled' && isCustomer) {
          // Customer can cancel a pending order
        } else if (newStatus === 'assigned' && (isAdmin || (isDriver && order.driver_id === userId))) {
          // Admin can assign, Driver can accept (implicitly change to assigned when accepting)
          // This path might be less used if 'assign_driver' handles the 'assigned' status.
        } else {
          return ApiResponse.badRequest(`Cannot change status from ${order.status} to ${newStatus}.`);
        }
        break;
      case 'assigned':
        if (newStatus === 'cancelled' && isCustomer) {
          // Customer can cancel an assigned order
        } else if (newStatus === 'picked_up' && isDriver) {
          // Driver picks up order
          // TODO: Implement OTP verification here using event.body.otp
          updateFields.picked_up_at = new Date().toISOString();
        } else {
          return ApiResponse.badRequest(`Cannot change status from ${order.status} to ${newStatus}.`);
        }
        break;
      case 'picked_up':
        if (newStatus === 'in_transit' && isDriver) {
          // Driver is in transit
        } else if (newStatus === 'delivered' && isDriver) {
          // Driver delivers, requires delivery OTP
          // TODO: Implement OTP verification here using event.body.otp
          updateFields.delivered_at = new Date().toISOString();
        } else {
          return ApiResponse.badRequest(`Cannot change status from ${order.status} to ${newStatus}.`);
        }
        break;
      case 'in_transit':
        if (newStatus === 'delivered' && isDriver) {
          // Driver delivers, requires delivery OTP
          // TODO: Implement OTP verification here using event.body.otp
          updateFields.delivered_at = new Date().toISOString();
        } else {
          return ApiResponse.badRequest(`Cannot change status from ${order.status} to ${newStatus}.`);
        }
        break;
      case 'delivered':
      case 'cancelled':
        // No further status changes allowed for delivered or cancelled orders, except by admin for correction.
        if (!isAdmin) {
          return ApiResponse.badRequest(`Order is already ${order.status}. No further updates allowed.`);
        }
        break;
      default:
        return ApiResponse.badRequest('Invalid current order status.');
    }

    // Admin can override most status restrictions, but still check for final states.
    if (isAdmin && (order.status === 'delivered' || order.status === 'cancelled') && newStatus !== order.status) {
        // Allow admin to change status of delivered/cancelled orders for correction purposes, but be cautious
        logger.warn('Admin changing status of a final order', { orderId, oldStatus: order.status, newStatus });
    }

    // 2. Update the order status in Supabase
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updateFields)
      .eq('id', orderId)
      .select('id, status, customer_id, driver_id')
      .single();

    if (updateError || !updatedOrder) {
      logger.error('Failed to update order status', updateError);
      return ApiResponse.internalServerError('Failed to update order status.');
    }

    logger.info('Order status updated', { orderId: updatedOrder.id, oldStatus: order.status, newStatus: updatedOrder.status });

    // 3. Potentially trigger notifications based on status change
    // (e.g., notify customer when picked up, notify customer/driver when delivered)

    return ApiResponse.success({
      orderId: updatedOrder.id,
      status: updatedOrder.status,
      message: `Order status updated to ${updatedOrder.status}.`,
    });
  } catch (error: any) {
    logger.error('Update order status error', error);

    if (error instanceof z.ZodError) {
      return ApiResponse.badRequest('Validation Error', error.errors);
    }

    return ApiResponse.internalServerError('Failed to update order status.');
  }
};

export const handler = authMiddleware(rbacMiddleware(['customer', 'driver', 'admin'])(updateStatusHandler));
