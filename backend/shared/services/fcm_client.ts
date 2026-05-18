import axios from 'axios';
import { logger } from '../utils/logger';

const FCM_API_URL = 'https://fcm.googleapis.com/fcm/send';

export const sendPushNotification = async (fcmToken: string, title: string, body: string, data?: object) => {
  const serverKey = process.env.FIREBASE_SERVER_KEY;

  if (!serverKey) {
    logger.error('FIREBASE_SERVER_KEY is not set.');
    throw new Error('Firebase server key not configured.');
  }

  try {
    const response = await axios.post(
      FCM_API_URL,
      {
        to: fcmToken,
        notification: {
          title,
          body,
          sound: 'default',
        },
        data: data || {},
      },
      {
        headers: {
          'Authorization': `key=${serverKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    logger.info('Push notification sent successfully', { fcmToken, responseData: response.data });
    return response.data;
  } catch (error: any) {
    logger.error('Failed to send push notification via FCM', error, { fcmToken, title });
    throw new Error(`FCM error: ${error.response?.data?.message || error.message}`);
  }
};
