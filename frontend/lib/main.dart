import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:sentry_flutter/sentry_flutter.dart';
import 'package:p2d_flutter/core/routes/app_router.dart';
import 'package:p2d_flutter/core/themes/app_theme.dart';
import 'package:p2d_flutter/core/services/storage_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Hive
  await Hive.initFlutter();
  // Initialize StorageService (opens boxes)
  final storageService = StorageService();
  await storageService.init();

  // Initialize Firebase
  // Note: FirebaseOptions should be provided for production (generated via flutterfire configure)
  try {
    await Firebase.initializeApp(
      // options: DefaultFirebaseOptions.currentPlatform,
    );
  } catch (e) {
    debugPrint('Firebase initialization skipped or failed: $e');
  }

  // Run app with Sentry monitoring
  await SentryFlutter.init(
    (options) {
      options.dsn = 'https://xxxxx@sentry.io/xxxxxx'; // Replace with actual DSN from .env
      options.tracesSampleRate = 1.0;
    },
    appRunner: () => runApp(
      ProviderScope(
        overrides: [
          // You could override a storageServiceProvider here if you had one
        ],
        child: const MyApp(),
      ),
    ),
  );
}

class MyApp extends ConsumerWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final GoRouter router = ref.watch(goRouterProvider);

    return MaterialApp.router(
      title: 'P2D - Pick to Drop',
      theme: AppTheme.lightTheme,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
    );
  }
}
