import { APIGatewayProxyHandler } from 'aws-lambda';
import { z } from 'zod';
import { CognitoIdentityProviderClient, ForgotPasswordCommand } from '@aws-sdk/client-cognito-identity-provider';
import { logger } from '../../../shared/utils/logger';
import { ApiResponse } from '../../../shared/utils/api_response';

const forgotPasswordSchema = z.object({
  username: z.string().min(1), // Can be email or phone
});

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { username } = forgotPasswordSchema.parse(body);

    const forgotPasswordCommand = new ForgotPasswordCommand({
      ClientId: process.env.AWS_COGNITO_CLIENT_ID || '',
      Username: username,
    });

    await cognitoClient.send(forgotPasswordCommand);

    logger.info('Forgot password initiated', { username });

    return ApiResponse.success({ message: 'Password reset code sent to your registered email or phone.' });
  } catch (error: any) {
    logger.error('Forgot password error', error);

    if (error instanceof z.ZodError) {
      return ApiResponse.badRequest('Validation Error', error.errors);
    }

    if (error.name === 'UserNotFoundException') {
      // For security reasons, don't disclose if user exists or not.
      return ApiResponse.success({ message: 'If your account exists, a password reset code has been sent.' });
    }

    return ApiResponse.internalServerError('Failed to initiate password reset.');
  }
};
