class ApiEndpoints {
  // Auth
  static const String register = '/auth/register';
  static const String login = '/auth/login';
  static const String logout = '/auth/logout';
  static const String refreshToken = '/auth/refresh-token';
  static const String forgotPassword = '/auth/forgot-password';
  static const String verifyOtp = '/auth/verify-otp';

  // Users
  static const String userProfile = '/users/profile';
  static const String userKycUpload = '/users/kyc-upload';

  // Orders
  static const String createOrder = '/orders/create';\  static const String getOrder = '/orders/{orderId}';
  static const String updateOrderStatus = '/orders/{orderId}/status';
  static const String cancelOrder = '/orders/{orderId}/cancel';
  static const String orderHistory = '/orders/history';
  static const String activeOrders = '/orders/active';

  // Drivers
  static const String availableOrders = '/drivers/available-orders';
  static const String acceptOrder = '/drivers/accept-order';
  static const String updateDriverAvailability = '/drivers/availability';
  static const String driverEarnings = '/drivers/earnings';
  static const String updateDriverLocation = '/drivers/location';

  // Tracking
  static const String updateLocation = '/tracking/update-location';
  static const String getLiveLocation = '/tracking/live-location/{orderId}';
  static const String generateQr = '/tracking/generate-qr/{orderId}/{type}';
  static const String verifyQr = '/tracking/verify-qr';

  // Payments
  static const String initiatePayment = '/payments/initiate';
  static const String verifyPayment = '/payments/verify';
  static const String paymentWebhook = '/payments/webhook';
  static const String refundPayment = '/payments/refund/{orderId}';
  static const String getInvoice = '/payments/invoice/{orderId}';

  // Notifications
  static const String sendPushNotification = '/notifications/send-push';
  static const String sendSms = '/notifications/send-sms';

  // Admin
  static const String adminAnalytics = '/admin/analytics';
  static const String adminUsers = '/admin/users';
  static const String adminOrders = '/admin/orders';
  static const String adminBroadcast = '/admin/broadcast';
}
