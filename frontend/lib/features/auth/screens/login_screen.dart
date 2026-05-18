import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:p2d_flutter/core/utils/helpers.dart';
import 'package:p2d_flutter/core/utils/validators.dart';
import 'package:p2d_flutter/features/auth/providers/auth_provider.dart';
import 'package:p2d_flutter/shared/widgets/custom_button.dart';
import 'package:p2d_flutter/shared/widgets/custom_text_field.dart';
import 'package:p2d_flutter/shared/widgets/loading_widget.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _usernameController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (_formKey.currentState!.validate()) {
      final authNotifier = ref.read(authProvider.notifier);
      await authNotifier.login(
        username: _usernameController.text,
        password: _passwordController.text,
      );

      final authState = ref.read(authProvider);
      authState.when(
        data: (user) {
          if (user != null) {
            // Successfully logged in, navigate to home
            context.go('/home');
            Helpers.showSnackBar(context, 'Welcome back, \${user.name}!');
          } else {
            // This case might happen if login is successful but getCurrentUser returns null (e.g., during verification flow)
            Helpers.showSnackBar(context, 'Login successful, please complete verification.', isError: false);
          }
        },
        loading: () {},
        error: (e, st) {
          Helpers.showSnackBar(context, e.toString(), isError: true);
        },
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final isLoading = authState.isLoading;

    return Scaffold(
      appBar: AppBar(title: const Text('Login')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                'Welcome to P2D',
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: 40),
              CustomTextField(
                controller: _usernameController,
                labelText: 'Email or Phone',
                hintText: 'Enter your email or phone number',
                validator: (value) => Validators.validateRequired(value, 'Username'),
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 20),
              CustomTextField(
                controller: _passwordController,
                labelText: 'Password',
                hintText: 'Enter your password',
                obscureText: true,
                validator: Validators.validatePassword,
              ),
              const SizedBox(height: 30),
              isLoading
                  ? const LoadingWidget()
                  : CustomButton(
                      onPressed: _login,
                      text: 'Login',
                    ),
              const SizedBox(height: 20),
              TextButton(
                onPressed: () {
                  context.go('/register');
                },
                child: const Text('Don't have an account? Register'),
              ),
              TextButton(
                onPressed: () {
                  // TODO: Navigate to Forgot Password screen
                  debugPrint('Forgot Password pressed');
                },
                child: const Text('Forgot Password?'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
