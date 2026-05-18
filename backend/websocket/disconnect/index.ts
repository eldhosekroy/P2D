import { APIGatewayProxyHandler } from 'aws-lambda';
import { DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDB } from '../../shared/services/dynamodb_client';
import { logger } from '../../shared/utils/logger';

const WEBSOCKET_CONNECTIONS_TABLE = 'RealtimeEvents';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const connectionId = event.requestContext.connectionId;

    if (!connectionId) {
      logger.error('Connection ID not found in WebSocket disconnect event');
      return { statusCode: 400, body: 'Connection ID missing' };
    }

    logger.info('WebSocket disconnected', { connectionId });

    // Remove connection details from DynamoDB
    const deleteConnectionCommand = new DeleteCommand({
      TableName: WEBSOCKET_CONNECTIONS_TABLE,
      Key: { connection_id: connectionId },
    });

    await dynamoDB.send(deleteConnectionCommand);

    return { statusCode: 200, body: 'Disconnected.' };

  } catch (error: any) {
    logger.error('WebSocket $disconnect error', error);
    return { statusCode: 500, body: 'Failed to disconnect.' };
  }
};
