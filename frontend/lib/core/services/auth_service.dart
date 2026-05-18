import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:p2d_flutter/core/constants/api_endpoints.dart';
import 'package:p2d_flutter/core/services/api_service.dart';
import 'package:p2d_flutter/features/auth/models/user_model.dart';

class AuthService {
  final ApiService _apiService;
  final _storage = const FlutterSecureStorage();

  AuthService(this._apiService);

  Future<User> register({
    required String name,
    required String phone,
    String? email,
    required String password,
    String role = 'customer',
  }) async {
    try {
      final response = await _apiService.post(
        ApiEndpoints.register,
        data: {
          'name': name,
          'phone': phone,
          'email': email,
          'password': password,
          'role': role,
        },
      );
      return User.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Registration failed');
    }
  }

  Future<Map<String, dynamic>> login({
    required String username,
    required String password,
  }) async {
    try {
      final response = await _apiService.post(
        ApiEndpoints.login,
        data: {
          'username': username,
          'password': password,
        },
      );
      final data = response.data['data'];
      await _storage.write(key: 'access_token', value: data['accessToken']);
      await _storage.write(key: 'refresh_token', value: data['refreshToken']);
      await _storage.write(key: 'id_token', value: data['idToken']);
      return data;
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Login failed');
    }
  }

  Future<void> logout() async {
    try {
      final token = await _storage.read(key: 'access_token');
      if (token != null) {
        await _apiService.post(
          ApiEndpoints.logout,
          options: Options(headers: {'Authorization': 'Bearer $token'}),
        );
      }
    } on DioException catch (e) {
      // Log error but proceed with clearing local storage
      debugPrint('Logout API call failed: ${e.response?.data['message']}');
    } finally {
      await _storage.delete(key: 'access_token');
      await _storage.delete(key: 'refresh_token');
      await _storage.delete(key: 'id_token');
    }
  }

  Future<String?> refreshToken() async {
    try {
      final refreshToken = await _storage.read(key: 'refresh_token');
      if (refreshToken == null) {
        return null;
      }

      final response = await _apiService.post(
        ApiEndpoints.refreshToken,
        data: {'refreshToken': refreshToken},
      );
      final newAccessToken = response.data['data']['accessToken'];
      await _storage.write(key: 'access_token', value: newAccessToken);
      return newAccessToken;
    } on DioException catch (e) {
      debugPrint('Refresh token failed: ${e.response?.data['message']}');
      await logout(); // Force logout if refresh token fails
      return null;
    }
  }

  Future<void> forgotPassword(String username) async {
    try {
      await _apiService.post(
        ApiEndpoints.forgotPassword,
        data: {'username': username},
      );
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Forgot password failed');
    }
  }

  Future<void> verifyOtp({
    required String username,
    required String code,
    required String type,
    String? newPassword,
  }) async {
    try {
      await _apiService.post(
        ApiEndpoints.verifyOtp,
        data: {
          'username': username,
          'code': code,
          'type': type,
          if (newPassword != null) 'newPassword': newPassword,
        },
      );
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'OTP verification failed');
    }
  }

  Future<User?> getCurrentUser() async {
    final idToken = await _storage.read(key: 'id_token');
    if (idToken == null) {
      return null;
    }

    try {
      // Decode JWT to get user details
      final parts = idToken.split('.');
      if (parts.length != 3) {
        throw Exception('Invalid ID token format');
      }
      final payload = json.decode(utf8.decode(base64Url.decode(parts[1])));
      return User.fromJson({
        'id': payload['sub'],
        'name': payload['name'], // Assuming name is in ID token, adjust if needed
        'email': payload['email'],
        'phone': payload['phone_number'],
        'role': payload['custom:role'],
        // KYC status would need a separate API call or be part of login response
        'kyc_status': 'pending', 
      });
    } catch (e) {
      debugPrint('Error decoding ID token: $e');
      await logout();
      return null;
    }
  }

  Future<String?> getAccessToken() async {
    return await _storage.read(key: 'access_token');
  }
}
