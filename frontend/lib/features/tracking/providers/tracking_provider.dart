import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:latlong2/latlong.dart';
import 'package:p2d_flutter/core/services/socket_service.dart';
import 'package:p2d_flutter/features/auth/providers/auth_provider.dart';
import 'package:p2d_flutter/features/auth/models/user_model.dart';

class TrackingData {
  final LatLng currentLocation;
  final double speed;
  final int? eta; // in minutes
  final DriverInfo? driver;

  TrackingData({
    required this.currentLocation,
    required this.speed,
    this.eta,
    this.driver,
  });

  TrackingData copyWith({
    LatLng? currentLocation,
    double? speed,
    int? eta,
    DriverInfo? driver,
  }) {
    return TrackingData(
      currentLocation: currentLocation ?? this.currentLocation,
      speed: speed ?? this.speed,
      eta: eta ?? this.eta,
      driver: driver ?? this.driver,
    );
  }
}

class DriverInfo {
  final String name;
  final String vehicleNumber;
  final String phone;

  DriverInfo({required this.name, required this.vehicleNumber, required this.phone});
}

class TrackingNotifier extends StateNotifier<AsyncValue<TrackingData?>> {
  final SocketService _socketService;
  final User? _currentUser;
  final String _orderId;

  TrackingNotifier(this._socketService, this._currentUser, this._orderId)
      : super(const AsyncValue.data(null));

  void startTracking() async {
    if (_currentUser == null) return;

    state = const AsyncValue.loading();

    // Listen to WebSocket messages
    _socketService.messages.listen((message) {
      if (message['type'] == 'tracking_update' && message['orderId'] == _orderId) {
        final lat = message['lat'] as double;
        final lng = message['lng'] as double;
        final speed = (message['speed'] as num?)?.toDouble() ?? 0.0;
        final eta = message['eta'] as int?;

        final newData = TrackingData(
          currentLocation: LatLng(lat, lng),
          speed: speed,
          eta: eta,
          // Driver info would typically come from the initial order fetch or a specific message
        );

        state = AsyncValue.data(state.value?.copyWith(
          currentLocation: newData.currentLocation,
          speed: newData.speed,
          eta: newData.eta,
        ) ?? newData);
      }
    }, onError: (err) {
      state = AsyncValue.error(err, StackTrace.current);
    });

    // Connect to WebSocket
    await _socketService.connect(
      userId: _currentUser!.id,
      role: _currentUser!.role,
      orderId: _orderId,
    );
  }

  void stopTracking() {
    _socketService.dispose();
    state = const AsyncValue.data(null);
  }

  @override
  void dispose() {
    stopTracking();
    super.dispose();
  }
}

final socketServiceProvider = Provider((ref) => SocketService(ref.watch(authServiceProvider)));

final trackingProvider = StateNotifierProvider.family<TrackingNotifier, AsyncValue<TrackingData?>, String>((ref, orderId) {
  final socketService = ref.watch(socketServiceProvider);
  final currentUser = ref.watch(authProvider).value;
  return TrackingNotifier(socketService, currentUser, orderId);
});
