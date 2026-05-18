import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:p2d_flutter/core/services/api_service.dart';
import 'package:p2d_flutter/features/auth/models/user_model.dart';
import 'package:p2d_flutter/core/utils/helpers.dart';

// This provider will manage customer-specific data and interactions.
// For now, it will fetch and display the current user's profile details.
class CustomerNotifier extends StateNotifier<AsyncValue<User>> {
  final ApiService _apiService;

  CustomerNotifier(this._apiService) : super(const AsyncValue.loading()) {
    fetchCustomerProfile();
  }

  Future<void> fetchCustomerProfile() async {
    state = const AsyncValue.loading();
    try {
      // TODO: Replace with actual API call to fetch user profile details
      // Example: final response = await _apiService.get('/users/profile');
      // final user = User.fromJson(response.data['data']);
      
      // Using dummy data for now, as the backend GET /users/profile is not yet implemented.
      // Replace with actual data fetching once the API is available.
      final dummyUser = User(
        id: 'mock-user-id',
        name: 'Customer Name',
        phone: '+911234567890',
        email: 'customer@example.com',
        role: 'customer',
        kycStatus: 'verified',
        isActive: true,
        createdAt: DateTime.now().subtract(const Duration(days: 1)),
      );
      state = AsyncValue.data(dummyUser);
    } catch (e, st) {
      // Provide a more specific error message if possible
      String errorMessage = 'Failed to load customer profile.';
      if (e is Exception) {
        errorMessage = e.toString();
      }
      state = AsyncValue.error(errorMessage, st);
      // Show snackbar on error
      if (navigatorKey.currentContext != null) {
        Helpers.showSnackBar(navigatorKey.currentContext!, errorMessage, isError: true);
      }
    }
  }

  // TODO: Implement methods for customer-specific actions like updating profile, uploading KYC, etc.
  Future<void> updateProfile({
    required String name,
    required String phone,
    String? email,
  }) async {
    state = const AsyncValue.loading();
    try {
      // Simulate API call
      await Future.delayed(const Duration(seconds: 1));
      final updatedUser = state.value!.copyWith(
        name: name,
        phone: phone,
        email: email,
      );
      state = AsyncValue.data(updatedUser);
      if (navigatorKey.currentContext != null) {
        Helpers.showSnackBar(navigatorKey.currentContext!, 'Profile updated successfully!');
      }
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      if (navigatorKey.currentContext != null) {
        Helpers.showSnackBar(navigatorKey.currentContext!, 'Failed to update profile.', isError: true);
      }
    }
  }
}

// The provider for the CustomerNotifier. It takes the orderId as a parameter
// to potentially fetch customer data related to a specific order if needed,
// but here it's more generic for the current logged-in customer.
final customerProvider = StateNotifierProvider<CustomerNotifier, AsyncValue<User>>((ref) {
  return CustomerNotifier(ref.watch(apiServiceProvider));
});

// Global navigator key for showing snackbars from non-widget contexts (like providers)
// NOTE: This should be initialized in main.dart and passed to the provider if needed
// For now, assuming it's globally available.
final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();
