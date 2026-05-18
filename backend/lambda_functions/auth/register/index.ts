import { APIGatewayProxyHandler } from 'aws-lambda';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { CognitoIdentityProviderClient, SignUpCommand } from '@aws-sdk/client-cognito-identity-provider';
import { supabase } from '../../shared/services/supabase_client';
// import { sendSms } from '../../shared/services/fast2sms_client'; // To be implemented
import { logger } from '../../shared/utils/logger'; // To be implemented
import { ApiResponse } from '../../shared/utils/api_response'; // To be implemented

const registerSchema = z.object({
  name: z.string().min(3),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/), // E.164 format
  email: z.string().email().optional(),
  password: z.string().min(8),
  role: z.enum(['customer', 'driver', 'admin']).default('customer'),
});

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { name, phone, email, password, role } = registerSchema.parse(body);

    // 1. Create Cognito user
    const signUpCommand = new SignUpCommand({
      ClientId: process.env.AWS_COGNITO_CLIENT_ID || '',
      Username: email || phone, // Use email if provided, otherwise phone
      Password: password,
      UserAttributes: [
        { Name: 'phone_number', Value: phone },
        { Name: 'name', Value: name },
        { Name: 'custom:role', Value: role },
        ...(email ? [{ Name: 'email', Value: email }] : []),
      ],
    });
    const cognitoResponse = await cognitoClient.send(signUpCommand);
    const cognitoSub = cognitoResponse.UserConfirmed ? cognitoResponse.UserSub : null;

    if (!cognitoSub) {
        // This case should ideally not happen with auto-verification off, or handle verification flow.
        // For now, assume UserConfirmed is true or handle post-confirmation flow separately.
        // If auto-verification is off, a confirmation code would be sent to the user.
        return ApiResponse.badRequest('User not confirmed in Cognito. Please verify your account.');
    }

    // 2. Insert into Supabase users table
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: cognitoSub, // Use cognito sub as the primary key for direct linkage
        name,
        phone,
        email,
        role,
        cognito_sub: cognitoSub,
      })
      .select('id, name, email, phone, role, kyc_status')
      .single();

    if (error) {
      logger.error('Supabase user insertion error', error);
      // If Supabase insertion fails, consider rolling back Cognito user creation
      // For simplicity, we're not implementing rollback here, but it's crucial in production.
      return ApiResponse.internalServerError('Failed to create user profile.');
    }

    // 3. Send welcome SMS via Fast2SMS (placeholder for now)
    // await sendSms(phone, `Welcome to P2D, ${name}! Your account has been created.`);

    logger.info('User registered successfully', { userId: data.id, role: data.role });

    // For now, we are not returning tokens directly from register. Login will handle token generation.
    return ApiResponse.success({
      userId: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      kyc_status: data.kyc_status,
      message: 'User registered successfully. Please proceed to login.',
    });
  } catch (error: any) {
    logger.error('Registration error', error);

    if (error instanceof z.ZodError) {
      return ApiResponse.badRequest('Validation Error', error.errors);
    }

    if (error.name === 'UsernameExistsException') {
      return ApiResponse.badRequest('User with this email or phone already exists.');
    }

    return ApiResponse.internalServerError('Failed to register user.');
  }
};
