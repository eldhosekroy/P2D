import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:p2d_flutter/core/services/api_service.dart';
import 'package:p2d_flutter/core/services/auth_service.dart';
import 'package:p2d_flutter/features/auth/models/user_model.dart';

// Providers for services
final apiServiceProvider = Provider((ref) {
  final apiService = ApiService();
  // We will set onRefreshToken later or use a proxy to avoid circular dependency
  return apiService;
});

final authServiceProvider = Provider((ref) {
  final apiService = ref.watch(apiServiceProvider);
  final authService = AuthService(apiService);
  
  // Link the refresh token logic
  apiService.onRefreshToken = () => authService.refreshToken();
  
  return authService;
});

// Auth State Notifier
class AuthNotifier extends StateNotifier<AsyncValue<User?>> {
  final AuthService _authService;

  AuthNotifier(this._authService) : super(const AsyncValue.data(null)) {
    _loadCurrentUser();
  }

  Future<void> _loadCurrentUser() async {
    state = const AsyncValue.loading();
    try {
      final user = await _authService.getCurrentUser();
      state = AsyncValue.data(user);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> register({
    required String name,
    required String phone,
    String? email,
    required String password,
    String role = 'customer',
  }) async {
    state = const AsyncValue.loading();
    try {
      final user = await _authService.register(name: name, phone: phone, email: email, password: password, role: role);
      state = AsyncValue.data(user); // User is not fully logged in yet, just registered
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> login({
    required String username,
    required String password,
  }) async {
    state = const AsyncValue.loading();
    try {
      await _authService.login(username: username, password: password);
      final user = await _authService.getCurrentUser(); // Re-fetch user after successful login
      state = AsyncValue.data(user);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> logout() async {
    state = const AsyncValue.loading();
    try {
      await _authService.logout();
      state = const AsyncValue.data(null);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> forgotPassword(String username) async {
    state = const AsyncValue.loading();
    try {
      await _authService.forgotPassword(username);
      state = const AsyncValue.data(null); // No user change, just success
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> verifyOtp({
    required String username,
    required String code,
    required String type,
    String? newPassword,
  }) async {
    state = const AsyncValue.loading();
    try {
      await _authService.verifyOtp(username: username, code: code, type: type, newPassword: newPassword);
      if (type == 'signup') {
        // After signup verification, user still needs to login
        state = const AsyncValue.data(null);
      } else if (type == 'forgot_password') {
        state = const AsyncValue.data(null);
      }
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AsyncValue<User?>>((ref) {
  return AuthNotifier(ref.watch(authServiceProvider));
});
