import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import WebSocket from 'ws';

// @ts-ignore
global.WebSocket = WebSocket;

dotenv.config();

import { handler as registerHandler } from './lambda_functions/auth/register/index';
import { handler as loginHandler } from './lambda_functions/auth/login/index';
import { handler as logoutHandler } from './lambda_functions/auth/logout/index';
import { handler as forgotPasswordHandler } from './lambda_functions/auth/forgot_password/index';
import { handler as refreshTokenHandler } from './lambda_functions/auth/refresh_token/index';
import { handler as verifyOtpHandler } from './lambda_functions/auth/verify_otp/index';
import { handler as createOrderHandler } from './lambda_functions/orders/create_order/index';
import { handler as getOrderHandler } from './lambda_functions/orders/get_order/index';
import { handler as updateStatusHandler } from './lambda_functions/orders/update_status/index';
import { handler as assignDriverHandler } from './lambda_functions/orders/assign_driver/index';

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

const lambdaToExpress = (handler: any) => async (req: express.Request, res: express.Response) => {
  const event = {
    body: JSON.stringify(req.body),
    pathParameters: req.params,
    queryStringParameters: req.query,
    headers: req.headers,
  };

  try {
    // @ts-ignore
    const result = await handler(event, {}, () => {});
    res.status(result.statusCode).set(result.headers).send(result.body);
  } catch (error) {
    console.error('Lambda local wrapper error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Auth
app.post('/auth/register', lambdaToExpress(registerHandler));
app.post('/auth/login', lambdaToExpress(loginHandler));
app.post('/auth/logout', lambdaToExpress(logoutHandler));
app.post('/auth/forgot-password', lambdaToExpress(forgotPasswordHandler));
app.post('/auth/refresh-token', lambdaToExpress(refreshTokenHandler));
app.post('/auth/verify-otp', lambdaToExpress(verifyOtpHandler));

// Orders
app.post('/orders', lambdaToExpress(createOrderHandler));
app.get('/orders', lambdaToExpress(getOrderHandler));
app.get('/orders/:id', lambdaToExpress(getOrderHandler));
app.patch('/orders/:id/status', lambdaToExpress(updateStatusHandler));
app.post('/orders/:id/assign-driver', lambdaToExpress(assignDriverHandler));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend local server running on http://localhost:${PORT}`);
});
