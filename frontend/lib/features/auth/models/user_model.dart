class User {
  final String id;
  final String name;
  final String phone;
  final String? email;
  final String role;
  final String kycStatus;
  final String? cognitoSub;
  final bool isActive;
  final DateTime createdAt;

  User({
    required this.id,
    required this.name,
    required this.phone,
    this.email,
    required this.role,
    required this.kycStatus,
    this.cognitoSub,
    required this.isActive,
    required this.createdAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      name: json['name'] as String,
      phone: json['phone'] as String,
      email: json['email'] as String?,
      role: json['role'] as String,
      kycStatus: json['kyc_status'] as String,
      cognitoSub: json['cognito_sub'] as String?,
      isActive: json['is_active'] as bool? ?? true, // Default to true if null
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'phone': phone,
      'email': email,
      'role': role,
      'kyc_status': kycStatus,
      'cognito_sub': cognitoSub,
      'is_active': isActive,
      'created_at': createdAt.toIso8601String(),
    };
  }

  // Optional: CopyWith method for immutability
  User copyWith({
    String? id,
    String? name,
    String? phone,
    ValueNotifier<String?>? email,
    String? role,
    String? kycStatus,
    ValueNotifier<String?>? cognitoSub,
    bool? isActive,
    DateTime? createdAt,
  }) {
    return User(
      id: id ?? this.id,
      name: name ?? this.name,
      phone: phone ?? this.phone,
      email: email == null ? this.email : email.value,
      role: role ?? this.role,
      kycStatus: kycStatus ?? this.kycStatus,
      cognitoSub: cognitoSub == null ? this.cognitoSub : cognitoSub.value,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
