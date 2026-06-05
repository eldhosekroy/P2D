import { APIGatewayProxyHandler } from 'aws-lambda';
import { z } from 'zod';
import { LocalStorage } from '../../../shared/services/local_storage';
import { logger } from '../../../shared/utils/logger';
import { ApiResponse } from '../../../shared/utils/api_response';

const createOrderSchema = z.object({
  pickupAddress: z.string().min(5),
  deliveryAddress: z.string().min(5),
  packageType: z.string().default('Standard'),
  notes: z.string().optional(),
});

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { pickupAddress, deliveryAddress, packageType, notes } = createOrderSchema.parse(body);

    // In a real app, we would get the userId from the auth middleware/context
    // For now, we'll extract it from headers or use a placeholder
    const userId = event.headers?.['user-id'] || 'local-user';

    const newOrder = await LocalStorage.insert('orders.json', {
      userId,
      pickupAddress,
      deliveryAddress,
      packageType,
      notes,
      status: 'pending',
    });

    logger.info('Order created locally', { orderId: newOrder.id });

    return ApiResponse.success(newOrder, 201);
  } catch (error: any) {
    logger.error('Order creation error', error);
    if (error instanceof z.ZodError) {
      return ApiResponse.badRequest('Validation Error', error.errors);
    }
    return ApiResponse.internalServerError('Failed to create order.');
  }
};
