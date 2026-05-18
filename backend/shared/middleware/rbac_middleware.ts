import { APIGatewayProxyHandler } from 'aws-lambda';
import { ApiResponse } from '../utils/api_response';
import { logger } from '../utils/logger';

export const rbacMiddleware = (allowedRoles: string[]) => (handler: APIGatewayProxyHandler): APIGatewayProxyHandler => async (event, context, callback) => {
  try {
    // Placeholder for RBAC logic
    // Assume event.requestContext.authorizer has 'role' property from authMiddleware
    // const userRole = event.requestContext.authorizer?.role;

    // if (!userRole || !allowedRoles.includes(userRole)) {
    //   logger.warn('RBAC: Forbidden access', { userRole, allowedRoles });
    //   return ApiResponse.forbidden('Insufficient permissions.');
    // }

    logger.info('RBAC middleware placeholder executed', { allowedRoles });
    return handler(event, context, callback);
  } catch (error: any) {
    logger.error('RBAC middleware error', error);
    return ApiResponse.internalServerError('RBAC check failed.');
  }
};
