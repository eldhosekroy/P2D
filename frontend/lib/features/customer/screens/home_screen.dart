import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:p2d_flutter/core/utils/helpers.dart';
import 'package:p2d_flutter/features/auth/providers/auth_provider.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('P2D - Home'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await ref.read(authProvider.notifier).logout();
              // After logout, navigate to login and show a message
              // The router should handle redirection based on auth state changes.
              // For now, we explicitly navigate.
              context.go('/');
              Helpers.showSnackBar(context, 'You have been logged out.');
            },
          )
        ],
      ),
      body: authState.when(
        data: (user) {
          if (user == null) {
            // If user data is null after loading, it means logged out, redirect to login
            // This should ideally be handled by a GoRouter redirect, but as a fallback:
            WidgetsBinding.instance.addPostFrameCallback((_) {
              context.go('/');
            });
            return const SizedBox(); // Return empty widget while redirecting
          }

          // Display user-specific content based on role
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'Welcome, \${user.name}!',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const SizedBox(height: 8),
                Text('Role: ${user.role}'),
                const SizedBox(height: 32),
                // TODO: Add role-based navigation or dashboard elements here
                if (user.role == 'customer')
                  ElevatedButton(
                    onPressed: () => context.go('/customer/book-pickup'), // Placeholder route
                    child: const Text('Book a Delivery'),
                  )
                else if (user.role == 'driver')
                  ElevatedButton(
                    onPressed: () => context.go('/driver/available-orders'), // Placeholder route
                    child: const Text('View Available Orders'),
                  )
                else if (user.role == 'admin')
                  ElevatedButton(
                    onPressed: () => context.go('/admin/dashboard'), // Placeholder route
                    child: const Text('Go to Admin Dashboard'),
                  ),
              ],
            ),
          );
        },
        loading: () => const LoadingWidget(),
        error: (err, stack) => ErrorWidget(
          message: 'Failed to load user data: $err',
          onRetry: () => ref.read(authProvider.notifier)._loadCurrentUser(), // Attempt to reload user data
        ),
      ),
    );
  }
}
