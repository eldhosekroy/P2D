import { APIGatewayProxyHandler } from 'aws-lambda';
import { z } from 'zod';
import { supabase } from '../../shared/services/supabase_client';
import { sqs } from '../../shared/services/sqs_client';
import { logger } from '../../shared/utils/logger';
import { ApiResponse } from '../../shared/utils/api_response';
import { calculateDistance } from '../../shared/utils/haversine_calculator';
import { generateOtp } from '../../shared/utils/otp_generator';
import { authMiddleware } from '../../shared/middleware/auth_middleware';
import { rbacMiddleware } from '../../shared/middleware/rbac_middleware';
// import { sendSms } from '../../shared/services/fast2sms_client'; // For customer OTP confirmation (optional here, could be separate flow)

const createOrderSchema = z.object({
  pickup_address: z.string().min(5),
  pickup_lat: z.number(),
  pickup_lng: z.number(),
  drop_address: z.string().min(5),
  drop_lat: z.number(),
  drop_lng: z.number(),
  item_description: z.string().optional(),
  item_weight: z.number().optional(),
  insurance_enabled: z.boolean().default(false),
  insurance_amount: z.number().optional(),
});

const BASE_RATE_PER_KM = 15; // INR
const MIN_BASE_FARE = 50;   // INR

const createOrderHandler: APIGatewayProxyHandler = async (event) => {
  try {
    // Assuming authMiddleware has already run and populated event.requestContext.authorizer
    const customerId = event.requestContext.authorizer?.claims?.sub; // Cognito Sub for the user
    if (!customerId) {
      return ApiResponse.unauthorized('Customer ID not found in token.');
    }

    const body = JSON.parse(event.body || '{}');
    const orderDetails = createOrderSchema.parse(body);

    // 1. Calculate price using distance formula + base rate
    const distance = calculateDistance(
      { latitude: orderDetails.pickup_lat, longitude: orderDetails.pickup_lng },
      { latitude: orderDetails.drop_lat, longitude: orderDetails.drop_lng }
    );
    let estimatedPrice = Math.max(MIN_BASE_FARE, distance * BASE_RATE_PER_KM);
    if (orderDetails.insurance_enabled && orderDetails.insurance_amount) {
      estimatedPrice += orderDetails.insurance_amount;
    }
    estimatedPrice = parseFloat(estimatedPrice.toFixed(2));

    // 2. Generate pickup OTP (6-digit random)
    const pickupOtp = generateOtp();
    // For security, store hashed OTP in DB, send plain OTP to customer.
    // const hashedPickupOtp = await bcrypt.hash(pickupOtp, 10); // bcrypt not needed for simple OTPs, but good practice for sensitive data

    // 3. Create order in Supabase
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        customer_id: customerId,
        pickup_address: orderDetails.pickup_address,
        pickup_lat: orderDetails.pickup_lat,
        pickup_lng: orderDetails.pickup_lng,
        drop_address: orderDetails.drop_address,
        drop_lat: orderDetails.drop_lat,
        drop_lng: orderDetails.drop_lng,
        item_description: orderDetails.item_description,
        item_weight: orderDetails.item_weight,
        estimated_price: estimatedPrice,
        pickup_otp: pickupOtp, // Storing plain OTP for simplicity as per prompt, but would hash in production
        insurance_enabled: orderDetails.insurance_enabled,
        insurance_amount: orderDetails.insurance_amount,
        status: 'pending',
        payment_status: 'pending',
      })
      .select('id, estimated_price, pickup_otp')
      .single();

    if (error) {
      logger.error('Supabase order creation error', error);
      return ApiResponse.internalServerError('Failed to create order.');
    }

    // 4. Push to SQS for driver matching
    const sqsMessage = {
      orderId: order.id,
      pickupLocation: { lat: orderDetails.pickup_lat, lng: orderDetails.pickup_lng },
      // Add other relevant order details for driver matching
    };
    await sqs.send({ // Assuming sqs_client.ts exports an SQSClient instance
      MessageBody: JSON.stringify(sqsMessage),
      QueueUrl: process.env.AWS_SQS_QUEUE_URL || '',
    });
    logger.info('Order pushed to SQS for driver matching', { orderId: order.id });

    // 5. Return: orderId, estimatedPrice, pickupOTP
    // Optionally send pickup OTP via SMS to customer here if not handled by a separate notification service
    // const { data: customerUser } = await supabase.from('users').select('phone').eq('id', customerId).single();
    // if (customerUser?.phone) {
    //   await sendSms(customerUser.phone, `Your P2D pickup OTP is: ${order.pickup_otp}`);
    // }

    return ApiResponse.success({
      orderId: order.id,
      estimatedPrice: order.estimated_price,
      pickupOTP: order.pickup_otp,
      message: 'Order created and awaiting driver assignment.',
    });
  } catch (error: any) {
    logger.error('Create order error', error);

    if (error instanceof z.ZodError) {
      return ApiResponse.badRequest('Validation Error', error.errors);
    }

    return ApiResponse.internalServerError('Failed to create order.');
  }
};

export const handler = authMiddleware(rbacMiddleware(['customer'])(createOrderHandler));
