import axios from 'axios';
import { logger } from '../utils/logger';

const FAST2SMS_API_URL = 'https://www.fast2sms.com/devUtility/sms';

export const sendSms = async (phoneNumber: string, message: string) => {
  if (!process.env.FAST2SMS_API_KEY) {
    logger.error('FAST2SMS_API_KEY is not set.');
    throw new Error('Fast2SMS API key not configured.');
  }

  try {
    const response = await axios.post(FAST2SMS_API_URL, {
      sender_id: 'FSTSMS', // This is a generic sender ID, might need a custom one for production
      message: message,
      language: 'english',
      route: 'p', // Promotional route (for free credits, generally)
      numbers: phoneNumber,
    }, {
      headers: {
        'authorization': process.env.FAST2SMS_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    logger.info('SMS sent successfully', { phoneNumber, responseData: response.data });
    return response.data;
  } catch (error: any) {
    logger.error('Failed to send SMS via Fast2SMS', error, { phoneNumber, message });
    throw new Error(`Fast2SMS error: ${error.response?.data?.message || error.message}`);
  }
};
