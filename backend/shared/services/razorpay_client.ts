import Razorpay from 'razorpay';
import { logger } from '../utils/logger';

const razorpayKeyId = process.env.RAZORPAY_KEY_ID || '';
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || '';

if (!razorpayKeyId || !razorpayKeySecret) {
  logger.warn('Razorpay keys are missing from environment variables.');
}

export const razorpay = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret,
});
