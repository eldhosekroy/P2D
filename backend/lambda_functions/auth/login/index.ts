import { APIGatewayProxyHandler } from 'aws-lambda';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { LocalStorage } from '../../../shared/services/local_storage';
import { logger } from '../../../shared/utils/logger';
import { ApiResponse } from '../../../shared/utils/api_response';

const loginSchema = z.object({
  username: z.string(), // Can be email or phone
  password: z.string(),
});

const JWT_SECRET = process.env.JWT_SECRET || 'local_secret_key_for_development';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { username, password } = loginSchema.parse(body);

    // 1. Find user by email or phone
    const user = await LocalStorage.findOne('users.json', u => u.email === username || u.phone === username);
    if (!user) {
      return ApiResponse.unauthorized('Invalid username or password.');
    }

    // 2. Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return ApiResponse.unauthorized('Invalid username or password.');
    }

    // 3. Generate local JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    logger.info('User logged in locally', { userId: user.id });

    return ApiResponse.success({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      token,
    });
  } catch (error: any) {
    logger.error('Login error', error);
    if (error instanceof z.ZodError) {
      return ApiResponse.badRequest('Validation Error', error.errors);
    }
    return ApiResponse.internalServerError('Failed to login.');
  }
};
