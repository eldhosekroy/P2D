import { APIGatewayProxyHandler } from 'aws-lambda';
import { supabase } from '../../shared/services/supabase_client';
import { logger } from '../../shared/utils/logger';
import { ApiResponse } from '../../shared/utils/api_response';
import { authMiddleware } from '../../shared/middleware/auth_middleware';
import { rbacMiddleware } from '../../shared/middleware/rbac_middleware';

const getOrderHandler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    const userRole = event.requestContext.authorizer?.claims?.['custom:role'] || 'customer';
    const orderId = event.pathParameters?.orderId;

    if (!orderId) {
      return ApiResponse.badRequest('Order ID is required.');
    }

    // Fetch order from Supabase
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, customer:customer_id(name, phone), driver:driver_id(name, phone, drivers(vehicle_type, vehicle_number))')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      logger.warn('Order not found', { orderId, userId, error });
      return ApiResponse.notFound('Order not found.');
    }

    // Authorization: Customer can only view their own orders, Driver can view their assigned orders or available orders.
    const isCustomer = userRole === 'customer' && order.customer_id === userId;
    const isDriver = userRole === 'driver' && (order.driver_id === userId || order.status === 'pending');
    const isAdmin = userRole === 'admin';

    if (!isCustomer && !isDriver && !isAdmin) {
      return ApiResponse.forbidden('You do not have permission to view this order.');
    }

    logger.info('Order retrieved', { orderId, userId });

    return ApiResponse.success(order);
  } catch (error: any) {
    logger.error('Get order error', error);
    return ApiResponse.internalServerError('Failed to retrieve order.');
  }
};

export const handler = authMiddleware(rbacMiddleware(['customer', 'driver', 'admin'])(getOrderHandler));
