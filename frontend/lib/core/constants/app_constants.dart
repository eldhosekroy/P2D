class AppConstants {
  static const String appName = 'P2D - Pick to Drop';
  static const String appVersion = '1.0.0';
  static const String apiBaseUrl = 'https://your-api-gateway-url.amazonaws.com/prod'; // TODO: Replace with actual API Gateway URL
  static const String websocketBaseUrl = 'wss://your-websocket-api-url.amazonaws.com/prod'; // TODO: Replace with actual WebSocket API URL
  static const String razorpayKeyId = 'rzp_test_xxxxxxxxxxxx'; // TODO: Replace with actual Razorpay Key ID
  static const int otpLength = 6;
  static const double maxSpeedKmhForSpoofing = 200; // Max speed allowed for GPS updates
}
