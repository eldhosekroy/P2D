import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:p2d_flutter/core/utils/helpers.dart';
import 'package:p2d_flutter/core/utils/validators.dart';
import 'package:p2d_flutter/features/auth/providers/auth_provider.dart';
import 'package:p2d_flutter/shared/widgets/custom_button.dart';
import 'package:p2d_flutter/shared/widgets/custom_text_field.dart';
import 'package:p2d_flutter/shared/widgets/loading_widget.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmPasswordController = TextEditingController();

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    if (_formKey.currentState!.validate()) {
      final authNotifier = ref.read(authProvider.notifier);
      await authNotifier.register(
        name: _nameController.text,
        phone: _phoneController.text,
        email: _emailController.text.isEmpty ? null : _emailController.text,
        password: _passwordController.text,
        // role: 'customer', // Default role for registration
      );

      final authState = ref.read(authProvider);
      authState.when(
        data: (user) {
          if (user != null) {
            // Successfully registered, navigate to OTP verification or login
            context.go('/otp', extra: {'username': user.email ?? user.phone, 'type': 'signup'});
            Helpers.showSnackBar(context, 'Registration successful. Please verify your account.');
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
      appBar: AppBar(title: const Text('Register')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: ListView(
            children: [
              Text(
                'Create your P2D Account',
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: 40),
              CustomTextField(
                controller: _nameController,
                labelText: 'Full Name',
                hintText: 'Enter your full name',
                validator: Validators.validateName,
                keyboardType: TextInputType.name,
              ),
              const SizedBox(height: 20),
              CustomTextField(
                controller: _phoneController,
                labelText: 'Phone Number',
                hintText: 'e.g., +919876543210',
                validator: Validators.validatePhone,
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 20),
              CustomTextField(
                controller: _emailController,
                labelText: 'Email (Optional)',
                hintText: 'Enter your email address',
                validator: (value) => value!.isEmpty ? null : Validators.validateEmail(value),
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
              const SizedBox(height: 20),
              CustomTextField(
                controller: _confirmPasswordController,
                labelText: 'Confirm Password',
                hintText: 'Re-enter your password',
                obscureText: true,
                validator: (value) {
                  if (value != _passwordController.text) {
                    return 'Passwords do not match';
                  }
                  return Validators.validatePassword(value);
                },
              ),
              const SizedBox(height: 30),
              isLoading
                  ? const LoadingWidget()
                  : CustomButton(
                      onPressed: _register,
                      text: 'Register',
                    ),
              const SizedBox(height: 20),
              TextButton(
                onPressed: () {
                  context.go('/'); // Navigate back to login
                },
                child: const Text('Already have an account? Login'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
