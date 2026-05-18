import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class Helpers {
  static void showSnackBar(BuildContext context, String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? Colors.red.shade700 : Colors.green.shade700,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  static String formatCurrency(double amount) {
    final formatter = NumberFormat.currency(locale: 'en_IN', symbol: '₹ ', decimalDigits: 2);
    return formatter.format(amount);
  }

  static String formatDate(DateTime dateTime) {
    return DateFormat('dd MMM yyyy, hh:mm a').format(dateTime);
  }

  static String getRoleDisplayName(String role) {
    switch (role) {
      case 'customer':
        return 'Customer';
      case 'driver':
        return 'Driver';
      case 'admin':
        return 'Admin';
      default:
        return 'User';
    }
  }
}
