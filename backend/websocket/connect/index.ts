import { APIGatewayProxyHandler } from 'aws-lambda';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDB } from '../../shared/services/dynamodb_client';
import { logger } from '../../shared/utils/logger';
import { ApiResponse } from '../../shared/utils/api_response';

// DynamoDB table for managing active WebSocket connections and their associations
// PK: connection_id, SK: N/A
// Attributes: user_id, role, order_id (if applicable), connection_time
const WEBSOCKET_CONNECTIONS_TABLE = 'RealtimeEvents';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const connectionId = event.requestContext.connectionId;
    const domainName = event.requestContext.domainName;
    const stage = event.requestContext.stage;

    if (!connectionId) {
      logger.error('Connection ID not found in WebSocket event');
      return ApiResponse.badRequest('Connection ID missing');
    }

    // Extract user info from query parameters or JWT (if using JWT authorizer for WebSocket)
    // For simplicity, we assume user info might be passed via query params or will be resolved later.
    // In a real-time scenario, authentication might happen via a custom authorizer or a JWT passed during connection.
    // For now, we'll log and assume these can be derived.
    const userId = event.queryStringParameters?.userId; // Placeholder: Derive from JWT or auth handshake
    const role = event.queryStringParameters?.role;     // Placeholder: Derive from JWT or auth handshake
    const orderId = event.queryStringParameters?.orderId; // Relevant for tracking updates

    logger.info('WebSocket connected', {
      connectionId,
      domainName,
      stage,
      userId,
      role,
      orderId,
    });

    // Store connection details in DynamoDB
    const putConnectionCommand = new PutCommand({
      TableName: WEBSOCKET_CONNECTIONS_TABLE,
      Item: {
        connection_id: connectionId,
        user_id: userId || 'anonymous',
        role: role || 'guest',
        order_id: orderId,
        connection_time: new Date().toISOString(),
        // Add other relevant metadata as needed
      },
    });

    await dynamoDB.send(putConnectionCommand);

    // Return a successful response for API Gateway WebSocket integration
    return { statusCode: 200, body: 'Connected.' };

  } catch (error: any) {
    logger.error('WebSocket $connect error', error);
    // Returning a 500 will cause the WebSocket connection to be closed by API Gateway
    return { statusCode: 500, body: 'Failed to connect.' };
  }
};
