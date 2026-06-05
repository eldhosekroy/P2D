import { APIGatewayProxyHandler } from 'aws-lambda';
import { z } from 'zod';
import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider';
import { logger } from '../../../shared/utils/logger';
import { ApiResponse } from '../../../shared/utils/api_response';

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { refreshToken } = refreshTokenSchema.parse(body);

    const initiateAuthCommand = new InitiateAuthCommand({
      ClientId: process.env.AWS_COGNITO_CLIENT_ID || '',
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
      },
    });

    const authResponse = await cognitoClient.send(initiateAuthCommand);

    const newAccessToken = authResponse.AuthenticationResult?.AccessToken;
    const newIdToken = authResponse.AuthenticationResult?.IdToken;

    if (!newAccessToken || !newIdToken) {
      return ApiResponse.unauthorized('Failed to refresh tokens.');
    }

    // Decode ID token to get user details and role (optional, could be done client-side)
    const decodedIdToken = JSON.parse(Buffer.from(newIdToken.split('.')[1], 'base64').toString());
    const userId = decodedIdToken.sub;
    const userRole = decodedIdToken['custom:role'] || 'customer';

    logger.info('Tokens refreshed successfully', { userId, userRole });

    return ApiResponse.success({
      accessToken: newAccessToken,
      idToken: newIdToken,
    });
  } catch (error: any) {
    logger.error('Refresh token error', error);

    if (error instanceof z.ZodError) {
      return ApiResponse.badRequest('Validation Error', error.errors);
    }

    if (error.name === 'NotAuthorizedException') {
      return ApiResponse.unauthorized('Invalid or expired refresh token.');
    }

    return ApiResponse.internalServerError('Failed to refresh token.');
  }
};
