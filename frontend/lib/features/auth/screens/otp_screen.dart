import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:p2d_flutter/core/constants/app_constants.dart';
import 'package:p2d_flutter/core/utils/helpers.dart';
import 'package:p2d_flutter/core/utils/validators.dart';
import 'package:p2d_flutter/features/auth/providers/auth_provider.dart';
import 'package:p2d_flutter/shared/widgets/custom_button.dart';
import 'package:p2d_flutter/shared/widgets/custom_text_field.dart';
import 'package:p2d_flutter/shared/widgets/loading_widget.dart';

class OtpScreen extends ConsumerStatefulWidget {
  final String username;
  final String type; // 'signup' or 'forgot_password'

  const OtpScreen({super.key, required this.username, required this.type});

  @override
  ConsumerState<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends ConsumerState<OtpScreen> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _otpController = TextEditingController();
  final TextEditingController _newPasswordController = TextEditingController();
  final TextEditingController _confirmNewPasswordController = TextEditingController();

  bool _showNewPasswordFields = false;

  @override
  void initState() {
    super.initState();
    _showNewPasswordFields = widget.type == 'forgot_password';
  }

  @override
  void dispose() {
    _otpController.dispose();
    _newPasswordController.dispose();
    _confirmNewPasswordController.dispose();
    super.dispose();
  }

  Future<void> _verifyOtp() async {
    if (_formKey.currentState!.validate()) {
      final authNotifier = ref.read(authProvider.notifier);

      if (widget.type == 'forgot_password' && _newPasswordController.text.isEmpty) {
        // This case should ideally be caught by validator, but as a safeguard
        Helpers.showSnackBar(context, 'New password is required to reset password.', isError: true);
        return;
      }

      await authNotifier.verifyOtp(
        username: widget.username,
        code: _otpController.text,
        type: widget.type,
        newPassword: _showNewPasswordFields ? _newPasswordController.text : null,
      );

      final authState = ref.read(authProvider);
      authState.when(
        data: (user) {
          Helpers.showSnackBar(context, 'Verification successful!');
          if (widget.type == 'signup') {
            context.go('/'); // Go to login after signup verification
          } else if (widget.type == 'forgot_password') {
            context.go('/'); // Go to login after password reset
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
      appBar: AppBar(title: const Text('Verify OTP')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: ListView(
            children: [
              Text(
                widget.type == 'signup'
                    ? 'Verify your account'
                    : 'Reset your password',
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: 20),
              Text(
                'An OTP has been sent to ${widget.username}. Please enter it below.',
                style: Theme.of(context).textTheme.bodyLarge,
              ),
              const SizedBox(height: 30),
              CustomTextField(
                controller: _otpController,
                labelText: 'OTP',
                hintText: 'Enter the \${AppConstants.otpLength}-digit OTP',
                validator: (value) => Validators.validateOtp(value, length: AppConstants.otpLength),
                keyboardType: TextInputType.number,
              ),
              if (_showNewPasswordFields) ...[
                const SizedBox(height: 20),
                CustomTextField(
                  controller: _newPasswordController,
                  labelText: 'New Password',
                  hintText: 'Enter your new password',
                  obscureText: true,
                  validator: Validators.validatePassword,
                ),
                const SizedBox(height: 20),
                CustomTextField(
                  controller: _confirmNewPasswordController,
                  labelText: 'Confirm New Password',
                  hintText: 'Re-enter your new password',
                  obscureText: true,
                  validator: (value) {
                    if (value != _newPasswordController.text) {
                      return 'Passwords do not match';
                    }
                    return Validators.validatePassword(value);
                  },
                ),
              ],
              const SizedBox(height: 30),
              isLoading
                  ? const LoadingWidget()
                  : CustomButton(
                      onPressed: _verifyOtp,
                      text: 'Verify',
                    ),
              const SizedBox(height: 20),
              TextButton(
                onPressed: () {
                  // TODO: Implement resend OTP logic
                  debugPrint('Resend OTP pressed');
                  Helpers.showSnackBar(context, 'Resending OTP...');
                },
                child: const Text('Resend OTP'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
