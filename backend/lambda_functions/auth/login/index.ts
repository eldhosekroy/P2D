import { APIGatewayProxyHandler } from 'aws-lambda';
import { z } from 'zod';
import { CognitoIdentityProviderClient, InitiateAuthCommand, RespondToAuthChallengeCommand } from '@aws-sdk/client-cognito-identity-provider';
import { logger } from '../../shared/utils/logger';
import { ApiResponse } from '../../shared/utils/api_response';
import { supabase } from '../../shared/services/supabase_client';

const loginSchema = z.object({
  username: z.string().min(1), // Can be email or phone
  password: z.string().min(8),
});

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { username, password } = loginSchema.parse(body);

    let authResponse;
    try {
      const initiateAuthCommand = new InitiateAuthCommand({
        ClientId: process.env.AWS_COGNITO_CLIENT_ID || '',
        AuthFlow: 'USER_PASSWORD_AUTH',
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password,
        },
      });
      authResponse = await cognitoClient.send(initiateAuthCommand);
    } catch (error: any) {
      if (error.name === 'UserNotConfirmedException') {
        return ApiResponse.unauthorized('User not confirmed. Please verify your account.');
      } else if (error.name === 'NotAuthorizedException' || error.name === 'UserNotFoundException') {
        return ApiResponse.unauthorized('Invalid username or password.');
      } else {
        logger.error('Cognito InitiateAuth error', error);
        return ApiResponse.internalServerError('Authentication failed.');
      }
    }

    // Handle MFA or other challenges if necessary (not fully implemented in this example)
    if (authResponse.ChallengeName) {
      // For simplicity, we are not handling MFA challenges here. In a real app,
      // you would need to implement a separate flow for each challenge type.
      logger.warn('Cognito challenge encountered', { challenge: authResponse.ChallengeName });
      return ApiResponse.forbidden('MFA or other challenge required. Please use the appropriate flow.');
    }

    const accessToken = authResponse.AuthenticationResult?.AccessToken;
    const refreshToken = authResponse.AuthenticationResult?.RefreshToken;
    const idToken = authResponse.AuthenticationResult?.IdToken;

    if (!accessToken || !idToken) {
      return ApiResponse.unauthorized('Failed to get authentication tokens.');
    }

    // Decode ID token to get user details and role
    const decodedIdToken = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
    const userId = decodedIdToken.sub;
    const userRole = decodedIdToken['custom:role'] || 'customer';

    // Update last_login in Supabase (optional, for tracking)
    await supabase.from('users').update({ last_login_at: new Date().toISOString() }).eq('cognito_sub', userId);

    logger.info('User logged in successfully', { userId, userRole });

    return ApiResponse.success({
      userId,
      role: userRole,
      accessToken,
      refreshToken,
      idToken,
    });
  } catch (error: any) {
    logger.error('Login error', error);

    if (error instanceof z.ZodError) {
      return ApiResponse.badRequest('Validation Error', error.errors);
    }

    return ApiResponse.internalServerError('Failed to login user.');
  }
};
