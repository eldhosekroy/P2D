import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:p2d_flutter/features/auth/providers/auth_provider.dart';
import 'package:p2d_flutter/features/auth/screens/login_screen.dart';
import 'package:p2d_flutter/features/auth/screens/register_screen.dart';
import 'package:p2d_flutter/features/auth/screens/otp_screen.dart';
import 'package:p2d_flutter/features/customer/screens/home_screen.dart';
import 'package:p2d_flutter/features/customer/screens/book_pickup_screen.dart';
import 'package:p2d_flutter/features/customer/screens/tracking_screen.dart';
import 'package:p2d_flutter/features/customer/screens/order_history_screen.dart';

final goRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/otp',
        builder: (context, state) {
          final username = state.extra as Map<String, dynamic>?;
          if (username == null || !username.containsKey('username') || !username.containsKey('type')) {
            return const LoginScreen(); // Redirect to login if params are missing
          }
          return OtpScreen(
            username: username['username'] as String,
            type: username['type'] as String,
          );
        },
      ),
      GoRoute(
        path: '/home',
        builder: (context, state) => const HomeScreen(),
      ),
      // Customer Routes
      GoRoute(
        path: '/customer/book-pickup',
        builder: (context, state) => const BookPickupScreen(),
      ),
      GoRoute(
        path: '/customer/tracking/:orderId',
        builder: (context, state) => TrackingScreen(
          orderId: state.pathParameters['orderId']!,
        ),
      ),
      GoRoute(
        path: '/customer/order-history',
        builder: (context, state) => const OrderHistoryScreen(),
      ),
      GoRoute(
        path: '/customer/orders/:orderId',
        builder: (context, state) => Text('Order Details for ${state.pathParameters['orderId']!}'), // Placeholder for order detail screen
      ),
      // TODO: Add Driver and Admin routes
    ],
    redirect: (context, state) {
      final loggedIn = authState.value != null;
      final loggingIn = state.fullPath == '/' || state.fullPath == '/register' || state.fullPath == '/otp';

      if (!loggedIn && !loggingIn) {
        return '/'; // Redirect unauthenticated users to login
      }
      if (loggedIn && loggingIn) {
        return '/home'; // Redirect authenticated users away from login/register
      }
      return null;
    },
  );
});
