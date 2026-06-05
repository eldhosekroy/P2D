import { APIGatewayProxyHandler } from 'aws-lambda';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { LocalStorage } from '../../../shared/services/local_storage';
import { logger } from '../../../shared/utils/logger';
import { ApiResponse } from '../../../shared/utils/api_response';

const registerSchema = z.object({
  name: z.string().min(3),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/), // E.164 format
  email: z.string().email().optional(),
  password: z.string().min(8),
  role: z.enum(['customer', 'driver', 'admin']).default('customer'),
});

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { name, phone, email, password, role } = registerSchema.parse(body);

    // 1. Check if user already exists
    const existingUser = await LocalStorage.findOne('users.json', u => !!(u.phone === phone || (email && u.email === email)));
    if (existingUser) {
      return ApiResponse.badRequest('User with this email or phone already exists.');
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Save to local storage
    const newUser = await LocalStorage.insert('users.json', {
      name,
      phone,
      email,
      password: hashedPassword,
      role,
      kyc_status: 'pending'
    });

    logger.info('User registered locally', { userId: newUser.id, role: newUser.role });

    return ApiResponse.success({
      userId: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      kyc_status: newUser.kyc_status,
      message: 'User registered successfully. Please proceed to login.',
    });
  } catch (error: any) {
    logger.error('Registration error', error);
    if (error instanceof z.ZodError) {
      return ApiResponse.badRequest('Validation Error', error.errors);
    }
    return ApiResponse.internalServerError(`Registration failed: \${error.message}`);
  }
};
