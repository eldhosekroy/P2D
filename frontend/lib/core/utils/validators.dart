class Validators {
  static String? validateEmail(String? value) {
    if (value == null || value.isEmpty) {
      return 'Email is required';
    }
    final emailRegex = RegExp(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$');
    if (!emailRegex.hasMatch(value)) {
      return 'Enter a valid email address';
    }
    return null;
  }

  static String? validatePassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'Password is required';
    }
    if (value.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    // Add more password strength rules if needed (e.g., uppercase, lowercase, digit, special character)
    return null;
  }

  static String? validateName(String? value) {
    if (value == null || value.isEmpty) {
      return 'Name is required';
    }
    if (value.length < 3) {
      return 'Name must be at least 3 characters long';
    }
    return null;
  }

  static String? validatePhone(String? value) {
    if (value == null || value.isEmpty) {
      return 'Phone number is required';
    }
    final phoneRegex = RegExp(r'^\+?[1-9]\d{9,14}$'); // E.164 format, 10-15 digits
    if (!phoneRegex.hasMatch(value)) {
      return 'Enter a valid phone number (e.g., +919876543210)';
    }
    return null;
  }

  static String? validateOtp(String? value, {int length = 6}) {
    if (value == null || value.isEmpty) {
      return 'OTP is required';
    }
    if (value.length != length || !RegExp(r'^\d+$').hasMatch(value)) {
      return 'Enter a valid $length-digit OTP';
    }
    return null;
  }

  static String? validateRequired(String? value, String fieldName) {
    if (value == null || value.isEmpty) {
      return '$fieldName is required';
    }
    return null;
  }

  static String? validateCoordinates(double? value, String fieldName) {
    if (value == null) {
      return '$fieldName is required';
    }
    if (value < -180 || value > 180) { // Latitude: -90 to 90, Longitude: -180 to 180
      return '$fieldName must be between -180 and 180';
    }
    return null;
  }
}
