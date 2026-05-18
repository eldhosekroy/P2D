import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:p2d_flutter/core/services/api_service.dart';
import 'package:p2d_flutter/features/orders/models/order_model.dart';
import 'package:p2d_flutter/core/utils/helpers.dart';

class OrderNotifier extends StateNotifier<AsyncValue<List<OrderModel>>> {
  final ApiService _apiService;

  OrderNotifier(this._apiService) : super(const AsyncValue.data([])) {
    fetchOrders();
  }

  Future<void> fetchOrders() async {
    state = const AsyncValue.loading();
    try {
      // TODO: Implement API call for fetching orders (e.g., order history)
      // For now, returning a dummy list
      final dummyOrders = [
        OrderModel(
          id: 'dummy-order-1',
          customerId: 'dummy-cust-1',
          driverId: null,
          pickupAddress: '123 Main St, Anytown',
          pickupLat: 17.44,
          pickupLng: 78.34,
          dropAddress: '456 Oak Ave, Othertown',
          dropLat: 17.45,
          dropLng: 78.35,
          status: 'pending',
          estimatedPrice: 150.0,
          insuranceEnabled: false,
          paymentStatus: 'pending',
          createdAt: DateTime.now().subtract(const Duration(hours: 2)),
        ),
        OrderModel(
          id: 'dummy-order-2',
          customerId: 'dummy-cust-2',
          driverId: 'dummy-driver-1',
          pickupAddress: '789 Pine Ln, Sometown',
          pickupLat: 17.46,
          pickupLng: 78.36,
          dropAddress: '101 Maple Dr, Yourtown',
          dropLat: 17.47,
          dropLng: 78.37,
          status: 'assigned',
          estimatedPrice: 200.0,
          insuranceEnabled: true,
          insuranceAmount: 10.0,
          paymentStatus: 'paid',
          createdAt: DateTime.now().subtract(const Duration(hours: 5)),
          pickedUpAt: DateTime.now().subtract(const Duration(hours: 3)),
        ),
      ];
      state = AsyncValue.data(dummyOrders);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  // TODO: Implement createOrder, getOrder, updateOrderStatus, cancelOrder methods
  Future<OrderModel?> createOrder({
    required String pickupAddress,
    required double pickupLat,
    required double pickupLng,
    required String dropAddress,
    required double dropLat,
    required double dropLng,
    String? itemDescription,
    double? itemWeight,
    bool insuranceEnabled = false,
    double? insuranceAmount,
  }) async {
    try {
      final response = await _apiService.post(
        '/orders/create', // Use correct endpoint
        data: {
          'pickup_address': pickupAddress,
          'pickup_lat': pickupLat,
          'pickup_lng': pickupLng,
          'drop_address': dropAddress,
          'drop_lat': dropLat,
          'drop_lng': dropLng,
          'item_description': itemDescription,
          'item_weight': itemWeight,
          'insurance_enabled': insuranceEnabled,
          'insurance_amount': insuranceAmount,
        },
      );
      final orderData = response.data['data'];
      Helpers.showSnackBar(navigatorKey.currentContext!, 'Order created successfully! OTP: ${orderData['pickupOTP']}');
      return OrderModel.fromJson(orderData);
    } on DioException catch (e) {
      Helpers.showSnackBar(navigatorKey.currentContext!, 'Failed to create order: ${e.response?.data['message']}', isError: true);
      return null;
    }
  }
}

final orderProvider = StateNotifierProvider<OrderNotifier, AsyncValue<List<OrderModel>>>((ref) {
  return OrderNotifier(ref.watch(apiServiceProvider));
});

// Global navigator key for showing snackbars from non-widget contexts (like providers)
final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();
