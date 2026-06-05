import { APIGatewayProxyHandler } from 'aws-lambda';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDB } from '../../shared/services/dynamodb_client';
import { logger } from '../../shared/utils/logger';

const WEBSOCKET_CONNECTIONS_TABLE = 'RealtimeEvents';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const { orderId, locationData } = JSON.parse(event.body || '{}');

    if (!orderId || !locationData) {
      logger.warn('Missing orderId or locationData in tracking broadcast');
      return { statusCode: 400, body: 'Missing required fields.' };
    }

    // 1. Find all connection IDs watching this orderId
    // In a production app, use a Global Secondary Index (GSI) on order_id to avoid Scan
    const scanConnectionsCommand = new ScanCommand({
      TableName: WEBSOCKET_CONNECTIONS_TABLE,
      FilterExpression: 'order_id = :oid',
      ExpressionAttributeValues: { ':oid': orderId },
    });
    const { Items: connections } = await dynamoDB.send(scanConnectionsCommand);

    if (!connections || connections.length === 0) {
      logger.info('No active WebSocket connections found for order', { orderId });
      return { statusCode: 200, body: 'No connections to broadcast to.' };
    }

    // 2. Initialize API Gateway Management Client to send messages
    const domainName = event.requestContext.domainName;
    const stage = event.requestContext.stage;
    const callbackUrl = `https://${domainName}/${stage}`;
    const apigwClient = new ApiGatewayManagementApiClient({ endpoint: callbackUrl });

    const broadcastMessage = JSON.stringify({
      type: 'tracking_update',
      orderId,
      ...locationData,
    });

    // 3. Broadcast to all found connections
    const broadcastPromises = connections.map(async (conn) => {
      try {
        const postToConnectionCommand = new PostToConnectionCommand({
          ConnectionId: conn.connection_id,
          Data: Buffer.from(broadcastMessage),
        });
        await apigwClient.send(postToConnectionCommand);
      } catch (err: any) {
        if (err.name === 'GoneException') {
          logger.info('Stale connection found, removing', { connectionId: conn.connection_id });
          // Cleanup stale connection would go here
        } else {
          logger.error('Failed to send WebSocket message', err, { connectionId: conn.connection_id });
        }
      }
    });

    await Promise.all(broadcastPromises);

    logger.info('Tracking update broadcasted', { orderId, connectionCount: connections.length });

    return { statusCode: 200, body: 'Broadcast complete.' };

  } catch (error: any) {
    logger.error('WebSocket tracking broadcast error', error);
    return { statusCode: 500, body: 'Failed to broadcast tracking update.' };
  }
};
