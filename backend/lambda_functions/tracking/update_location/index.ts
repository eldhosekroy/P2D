import { APIGatewayProxyHandler } from 'aws-lambda';
import { z } from 'zod';
import { UpdateCommand, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDB } from '../../../shared/services/dynamodb_client';
import { logger } from '../../../shared/utils/logger';
import { ApiResponse } from '../../../shared/utils/api_response';
import { validateGpsUpdate } from '../../../shared/utils/gps_validator';
import { authMiddleware } from '../../../shared/middleware/auth_middleware';
import { rbacMiddleware } from '../../../shared/middleware/rbac_middleware';
// import { sendWebSocketMessage } from '../../websocket/tracking/index'; // To be implemented for real-time broadcast

const updateLocationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  timestamp: z.number(), // Unix timestamp in milliseconds
});

const updateLocationHandler: APIGatewayProxyHandler = async (event) => {
  try {
    const driverId = event.requestContext.authorizer?.claims?.sub; // Cognito Sub for the driver
    if (!driverId) {
      return ApiResponse.unauthorized('Driver ID not found in token.');
    }

    const body = JSON.parse(event.body || '{}');
    const { lat, lng, timestamp } = updateLocationSchema.parse(body);

    // 1. Get last known location from DynamoDB DriverStatus
    const getLastLocationCommand = new GetCommand({
      TableName: 'DriverStatus',
      Key: { driver_id: driverId },
    });
    const { Item: lastDriverStatus } = await dynamoDB.send(getLastLocationCommand);

    const lastLocation = lastDriverStatus ? {
      lat: lastDriverStatus.current_lat,
      lng: lastDriverStatus.current_lng,
      timestamp: lastDriverStatus.last_seen, // Unix timestamp in milliseconds
    } : null;

    // 2. Perform GPS spoof detection
    const newLocation = { lat, lng, timestamp };
    const { isSpoof, speedKmH } = validateGpsUpdate(lastLocation, newLocation);

    if (isSpoof) {
      logger.error('GPS Spoofing Detected for driver', { driverId, speedKmH, newLocation, lastLocation });
      // Optionally, alert admin via SQS or another mechanism
      return ApiResponse.forbidden('GPS spoofing detected. Location update rejected.');
    }

    // 3. Write new location to DynamoDB LiveTracking (for historical tracking)
    // Find the current active order for this driver to link live tracking to it.
    // This would typically involve querying the 'orders' table in Supabase or a 'DriverActiveOrder' DynamoDB table.
    // For simplicity, let's assume we can get the active orderId if any. (Placeholder)
    // const activeOrderId = 'mock-order-id'; 

    // For now, we'll store without orderId link in LiveTracking for simplicity, assuming a separate process links it.
    // In a real scenario, the driver's active order ID would be stored in DriverStatus or retrieved from Supabase.
    const putLiveTrackingCommand = new PutCommand({
        TableName: 'LiveTracking',
        Item: {
            order_id: 'unknown', // Placeholder, needs actual order_id
            timestamp: timestamp,
            lat,
            lng,
            driver_id: driverId,
            speed: speedKmH || 0, // Store calculated speed
        }
    });
    await dynamoDB.send(putLiveTrackingCommand);

    // 4. Update DriverStatus table
    const updateDriverStatusCommand = new UpdateCommand({
      TableName: 'DriverStatus',
      Key: { driver_id: driverId },
      UpdateExpression: 'SET current_lat = :lat, current_lng = :lng, last_seen = :ts, #online = :online',
      ExpressionAttributeNames: { '#online': 'is_online' },
      ExpressionAttributeValues: {
        ':lat': lat,
        ':lng': lng,
        ':ts': timestamp,
        ':online': true, // Assume driver is online if updating location
      },
    });
    await dynamoDB.send(updateDriverStatusCommand);

    logger.info('Driver location updated', { driverId, lat, lng, speedKmH });

    // 5. Broadcast via WebSocket to connected customer (placeholder for now)
    // This would typically involve fetching the customer's active WebSocket connection ID
    // from a DynamoDB table (e.g., RealtimeEvents) using the order_id, and then sending the update.
    // await sendWebSocketMessage(customerId, { lat, lng, speedKmH, driverId });

    return ApiResponse.success({ message: 'Location updated successfully.', speedKmH });
  } catch (error: any) {
    logger.error('Update location error', error);

    if (error instanceof z.ZodError) {
      return ApiResponse.badRequest('Validation Error', error.errors);
    }

    return ApiResponse.internalServerError('Failed to update location.');
  }
};

export const handler = authMiddleware(rbacMiddleware(['driver'])(updateLocationHandler));
