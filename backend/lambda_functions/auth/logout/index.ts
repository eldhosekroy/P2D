import { APIGatewayProxyHandler } from 'aws-lambda';
import { CognitoIdentityProviderClient, GlobalSignOutCommand } from '@aws-sdk/client-cognito-identity-provider';
import { logger } from '../../../shared/utils/logger';
import { ApiResponse } from '../../../shared/utils/api_response';

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const accessToken = event.headers.Authorization?.split(' ')[1];

    if (!accessToken) {
      return ApiResponse.unauthorized('Access token is required for logout.');
    }

    // Invalidate the access token globally (revokes all sessions for the user)
    const signOutCommand = new GlobalSignOutCommand({
      AccessToken: accessToken,
    });
    await cognitoClient.send(signOutCommand);

    logger.info('User logged out successfully', { accessTokenHash: accessToken.substring(0, 10) });

    return ApiResponse.success({ message: 'Successfully logged out.' });
  } catch (error: any) {
    logger.error('Logout error', error);

    if (error.name === 'NotAuthorizedException') {
      return ApiResponse.unauthorized('Invalid or expired access token.');
    }

    return ApiResponse.internalServerError('Failed to logout user.');
  }
};
