import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants/app_constants.dart';

class ApiService {
  late Dio _dio;
  final _storage = const FlutterSecureStorage();
  
  // Callback for token refresh to avoid circular dependency with AuthService
  Future<String?> Function()? onRefreshToken;

  ApiService() {
    _dio = Dio(
      BaseOptions(
        baseUrl: AppConstants.apiBaseUrl,
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.read(key: 'access_token');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException e, handler) async {
          if (e.response?.statusCode == 401 && onRefreshToken != null) {
            try {
              final newAccessToken = await onRefreshToken!();
              if (newAccessToken != null) {
                // Retry the original request with the new token
                final options = e.requestOptions;
                options.headers['Authorization'] = 'Bearer $newAccessToken';
                final response = await _dio.fetch(options);
                return handler.resolve(response);
              }
            } catch (refreshError) {
              // Refresh failed, propagate the original error or handle logout
              return handler.next(e);
            }
          }
          return handler.next(e);
        },
      ),
    );
  }

  Dio get client => _dio;

  Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) async {
    return await _dio.get(path, queryParameters: queryParameters);
  }

  Future<Response> post(String path, {dynamic data, Options? options}) async {
    return await _dio.post(path, data: data, options: options);
  }

  Future<Response> put(String path, {dynamic data}) async {
    return await _dio.put(path, data: data);
  }

  Future<Response> delete(String path, {dynamic data}) async {
    return await _dio.delete(path, data: data);
  }
}
