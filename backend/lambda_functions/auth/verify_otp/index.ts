import { APIGatewayProxyHandler } from 'aws-lambda';
import { z } from 'zod';
import { CognitoIdentityProviderClient, ConfirmSignUpCommand, ConfirmForgotPasswordCommand } from '@aws-sdk/client-cognito-identity-provider';
import { logger } from '../../../shared/utils/logger';
import { ApiResponse } from '../../../shared/utils/api_response';

const verifyOtpSchema = z.object({
  username: z.string().min(1), // Email or phone
  code: z.string().min(1),
  type: z.enum(['signup', 'forgot_password']), // Type of OTP verification
  newPassword: z.string().min(8).optional(), // Required for forgot_password type
});

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { username, code, type, newPassword } = verifyOtpSchema.parse(body);

    if (type === 'signup') {
      const confirmSignUpCommand = new ConfirmSignUpCommand({
        ClientId: process.env.AWS_COGNITO_CLIENT_ID || '',
        Username: username,
        ConfirmationCode: code,
      });
      await cognitoClient.send(confirmSignUpCommand);
      logger.info('User signup confirmed', { username });
      return ApiResponse.success({ message: 'Account confirmed successfully.' });
    } else if (type === 'forgot_password') {
      if (!newPassword) {
        return ApiResponse.badRequest('newPassword is required for forgot_password type.');
      }
      const confirmForgotPasswordCommand = new ConfirmForgotPasswordCommand({
        ClientId: process.env.AWS_COGNITO_CLIENT_ID || '',
        Username: username,
        ConfirmationCode: code,
        Password: newPassword,
      });
      await cognitoClient.send(confirmForgotPasswordCommand);
      logger.info('Password reset confirmed', { username });
      return ApiResponse.success({ message: 'Password reset successfully.' });
    }

    return ApiResponse.badRequest('Invalid verification type.');
  } catch (error: any) {
    logger.error('OTP verification error', error);

    if (error instanceof z.ZodError) {
      return ApiResponse.badRequest('Validation Error', error.errors);
    }

    if (error.name === 'CodeMismatchException' || error.name === 'ExpiredCodeException') {
      return ApiResponse.badRequest('Invalid or expired verification code.');
    }
    if (error.name === 'UserNotFoundException') {
        return ApiResponse.notFound('User not found.');
    }

    return ApiResponse.internalServerError('Failed to verify OTP.');
  }
};
