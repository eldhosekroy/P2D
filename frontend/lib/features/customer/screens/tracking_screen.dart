import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_map/flutter_map.dart'; // For OSM maps
import 'package:latlong2/latlong.dart' as latlong;
import 'package:p2d_flutter/core/constants/colors.dart';
import 'package:p2d_flutter/core/constants/app_constants.dart';
import 'package:p2d_flutter/core/services/socket_service.dart';
import 'package:p2d_flutter/features/orders/models/order_model.dart';
import 'package:p2d_flutter/features/tracking/providers/tracking_provider.dart'; // Assuming this exists

class TrackingScreen extends ConsumerStatefulWidget {
  final String orderId;

  const TrackingScreen({super.key, required this.orderId});

  @override
  ConsumerState<TrackingScreen> createState() => _TrackingScreenState();
}

class _TrackingScreenState extends ConsumerState<TrackingScreen> {
  late final MapController _mapController;

  @override
  void initState() {
    super.initState({
      // Initializing the tracking provider to fetch and listen to order updates
      ref.read(trackingProvider(widget.orderId).notifier).startTracking();
    });
    _mapController = MapController();
    super.initState();
  }

  @override
  void dispose() {
    _mapController.dispose();
    // Stop listening to tracking updates when screen is disposed
    ref.read(trackingProvider(widget.orderId).notifier).stopTracking();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final trackingState = ref.watch(trackingProvider(widget.orderId));

    return Scaffold(
      appBar: AppBar(
        title: Text('Tracking Order #${widget.orderId.substring(0, 8)}'),
      ),
      body: trackingState.when(
        data: (trackingData) {
          final currentPos = trackingData?.currentLocation;
          final eta = trackingData?.eta;
          final driver = trackingData?.driver;

          return Column(
            children: [
              Expanded(
                flex: 3, // Map takes more space
                child: Stack(
                  children: [
                    FlutterMap(
                      mapController: _mapController,
                      options: MapOptions(
                        initialCenter: currentPos ?? const latlong.LatLng(17.44, 78.34), // Default to Hyderabad if no data
                        initialZoom: 13,
                        maxZoom: 18,
                        minZoom: 10,
                        // onMapReady: (controller) { _mapController = controller; },
                      ),
                      children: [
                        TileLayer(
                          urlTemplate: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
                          userAgentPackageName: 'com.example.p2d_flutter',
                        ),
                        MarkerLayer(markers: [
                          // Pickup Marker
                          Marker(
                            width: 40.0,
                            height: 40.0,
                            point: latlong.LatLng(17.44, 78.34), // Placeholder: Use order pickup lat/lng
                            builder: (ctx) => const Icon(Icons.location_pin, color: AppColors.pickupLocation, size: 40),
                          ),
                          // Drop Marker
                          Marker(
                            width: 40.0,
                            height: 40.0,
                            point: latlong.LatLng(17.45, 78.35), // Placeholder: Use order drop lat/lng
                            builder: (ctx) => const Icon(Icons.location_pin, color: AppColors.dropLocation, size: 40),
                          ),
                          // Driver Marker (if available)
                          if (currentPos != null)
                            Marker(
                              width: 40.0,
                              height: 40.0,
                              point: currentPos,
                              builder: (ctx) => const Icon(Icons.delivery_dining, color: AppColors.driverLocation, size: 40), // Custom driver icon
                            ),
                        ]),
                      ],
                    ),
                    // Overlay for loading or error states on map if needed
                  ],
                ),
              ),
              Expanded(
                flex: 1, // Info panel takes less space
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Delivery Details',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 8),
                      Text('Order ID: #${widget.orderId.substring(0, 8)}'),
                      const SizedBox(height: 8),
                      if (driver != null)
                        Text('Driver: ${driver.name} (${driver.vehicleNumber})'),
                      if (eta != null)
                        Text('Estimated Time of Arrival: ${eta} mins'),
                      const Spacer(),
                      // Action buttons if any (e.g., Call Driver, Cancel Order)
                    ],
                  ),
                ),
              ),
            ],
          );
        },
        loading: () => const Center(child: LoadingWidget()),
        error: (err, stack) => Center(child: Text('Error: $err')), // Add proper error widget later
      ),
    );
  }
}
