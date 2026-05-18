import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { logger } from '../utils/logger';

export const ses = new SESClient({ region: process.env.AWS_REGION || 'ap-south-1' });

export const sendEmail = async (to: string, subject: string, body: string, htmlBody?: string) => {
  const fromEmail = process.env.SES_FROM_EMAIL || 'noreply@p2d.com';

  const command = new SendEmailCommand({
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Body: {
        Text: { Data: body },
        ...(htmlBody ? { Html: { Data: htmlBody } } : {}),
      },
      Subject: { Data: subject },
    },
    Source: fromEmail,
  });

  try {
    const response = await ses.send(command);
    logger.info('Email sent successfully', { to, messageId: response.MessageId });
    return response;
  } catch (error: any) {
    logger.error('Failed to send email via SES', error, { to, subject });
    throw new Error(`SES error: ${error.message}`);
  }
};
