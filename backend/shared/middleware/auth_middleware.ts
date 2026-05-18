import { APIGatewayProxyHandler } from 'aws-lambda';
import { ApiResponse } from '../utils/api_response';
import { logger } from '../utils/logger';

export const authMiddleware = (handler: APIGatewayProxyHandler): APIGatewayProxyHandler => async (event, context, callback) => {
  try {
    // Placeholder for JWT verification logic
    // Extract Bearer token from Authorization header
    // Verify with Cognito JWKS endpoint
    // Decode claims: sub (userId), custom:role, exp
    // Attach to event.requestContext for downstream use
    // For now, simply pass through
    // event.requestContext.authorizer = { userId: 'mock-user-id', role: 'customer' };
    logger.info('Auth middleware placeholder executed');
    return handler(event, context, callback);
  } catch (error: any) {
    logger.error('Auth middleware error', error);
    return ApiResponse.unauthorized('Authentication failed.');
  }
};
