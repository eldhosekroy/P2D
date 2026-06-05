import { APIGatewayProxyHandler } from 'aws-lambda';
import { LocalStorage } from '../../../shared/services/local_storage';
import { ApiResponse } from '../../../shared/utils/api_response';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const orderId = event.pathParameters?.id;

    if (orderId) {
      const order = await LocalStorage.findOne('orders.json', o => o.id === orderId);
      if (!order) return ApiResponse.notFound('Order not found.');
      return ApiResponse.success(order);
    }

    // If no ID, return all orders (in a real app, filtered by userId)
    const orders = await LocalStorage.read('orders.json');
    return ApiResponse.success(orders);
  } catch (error: any) {
    return ApiResponse.internalServerError('Failed to fetch orders.');
  }
};
