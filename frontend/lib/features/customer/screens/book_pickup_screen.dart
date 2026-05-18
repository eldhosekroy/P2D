import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:p2d_flutter/core/constants/colors.dart';
import 'package:p2d_flutter/core/utils/helpers.dart';
import 'package:p2d_flutter/core/utils/validators.dart';
import 'package:p2d_flutter/features/orders/providers/order_provider.dart';
import 'package:p2d_flutter/shared/widgets/custom_button.dart';
import 'package:p2d_flutter/shared/widgets/custom_text_field.dart';
import 'package:p2d_flutter/shared/widgets/loading_widget.dart';

class BookPickupScreen extends ConsumerStatefulWidget {
  const BookPickupScreen({super.key});

  @override
  ConsumerState<BookPickupScreen> createState() => _BookPickupScreenState();
}

class _BookPickupScreenState extends ConsumerState<BookPickupScreen> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _pickupAddressController = TextEditingController();
  final TextEditingController _pickupLatController = TextEditingController();
  final TextEditingController _pickupLngController = TextEditingController();
  final TextEditingController _dropAddressController = TextEditingController();
  final TextEditingController _dropLatController = TextEditingController();
  final TextEditingController _dropLngController = TextEditingController();
  final TextEditingController _itemDescriptionController = TextEditingController();
  final TextEditingController _itemWeightController = TextEditingController();
  bool _insuranceEnabled = false;
  final TextEditingController _insuranceAmountController = TextEditingController();

  @override
  void dispose() {
    _pickupAddressController.dispose();
    _pickupLatController.dispose();
    _pickupLngController.dispose();
    _dropAddressController.dispose();
    _dropLatController.dispose();
    _dropLngController.dispose();
    _itemDescriptionController.dispose();
    _itemWeightController.dispose();
    _insuranceAmountController.dispose();
    super.dispose();
  }

  Future<void> _createOrder() async {
    if (_formKey.currentState!.validate()) {
      final orderNotifier = ref.read(orderProvider.notifier);

      // Attempt to parse latitude and longitude values
      final pickupLat = double.tryParse(_pickupLatController.text);
      final pickupLng = double.tryParse(_pickupLngController.text);
      final dropLat = double.tryParse(_dropLatController.text);
      final dropLng = double.tryParse(_dropLngController.text);
      final itemWeight = double.tryParse(_itemWeightController.text);
      final insuranceAmount = _insuranceEnabled ? double.tryParse(_insuranceAmountController.text) : null;

      // Basic validation for coordinates if they are required
      if (pickupLat == null || pickupLng == null || dropLat == null || dropLng == null) {
        Helpers.showSnackBar(context, 'Invalid coordinates. Please enter valid numbers.', isError: true);
        return;
      }

      final createdOrder = await orderNotifier.createOrder(
        pickupAddress: _pickupAddressController.text,
        pickupLat: pickupLat,
        pickupLng: pickupLng,
        dropAddress: _dropAddressController.text,
        dropLat: dropLat,
        dropLng: dropLng,
        itemDescription: _itemDescriptionController.text,
        itemWeight: itemWeight,
        insuranceEnabled: _insuranceEnabled,
        insuranceAmount: insuranceAmount,
      );

      if (createdOrder != null) {
        // Navigate to a screen to show order details or confirmation, maybe including OTP
        // For now, navigating to home screen after successful creation
        Helpers.showSnackBar(context, 'Order placed successfully! Pickup OTP: ${createdOrder.pickupOtp}');
        context.go('/home'); 
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final orderState = ref.watch(orderProvider);
    final isLoading = orderState.isLoading;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Book a Delivery'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: ListView(
            children: [
              Text(
                'Pickup Details',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 16),
              CustomTextField(
                controller: _pickupAddressController,
                labelText: 'Pickup Address',
                hintText: 'Enter pickup address',
                validator: (value) => Validators.validateRequired(value, 'Pickup Address'),
                maxLines: 2,
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: CustomTextField(
                      controller: _pickupLatController,
                      labelText: 'Latitude',
                      hintText: 'e.g., 17.44',
                      validator: (value) => Validators.validateCoordinates(double.tryParse(value ?? ''), 'Pickup Latitude'),
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: CustomTextField(
                      controller: _pickupLngController,
                      labelText: 'Longitude',
                      hintText: 'e.g., 78.34',
                      validator: (value) => Validators.validateCoordinates(double.tryParse(value ?? ''), 'Pickup Longitude'),
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 32),
              Text(
                'Drop-off Details',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 16),
              CustomTextField(
                controller: _dropAddressController,
                labelText: 'Drop-off Address',
                hintText: 'Enter drop-off address',
                validator: (value) => Validators.validateRequired(value, 'Drop-off Address'),
                maxLines: 2,
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: CustomTextField(
                      controller: _dropLatController,
                      labelText: 'Latitude',
                      hintText: 'e.g., 17.45',
                      validator: (value) => Validators.validateCoordinates(double.tryParse(value ?? ''), 'Drop-off Latitude'),
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: CustomTextField(
                      controller: _dropLngController,
                      labelText: 'Longitude',
                      hintText: 'e.g., 78.35',
                      validator: (value) => Validators.validateCoordinates(double.tryParse(value ?? ''), 'Drop-off Longitude'),
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 32),
              Text(
                'Package Details (Optional)',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 16),
              CustomTextField(
                controller: _itemDescriptionController,
                labelText: 'Item Description',
                hintText: 'e.g., Documents, Small Parcel',
                maxLines: 2,
              ),
              const SizedBox(height: 12),
              CustomTextField(
                controller: _itemWeightController,
                labelText: 'Item Weight (kg)',
                hintText: 'e.g., 0.5',
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Checkbox(
                    value: _insuranceEnabled,
                    onChanged: (value) {
                      setState(() {
                        _insuranceEnabled = value ?? false;
                        if (!_insuranceEnabled) {
                          _insuranceAmountController.clear(); // Clear amount if insurance is disabled
                        }
                      });
                    },
                  ),
                  const Text('Add Insurance'),
                  const SizedBox(width: 12),
                  if (_insuranceEnabled)
                    Expanded(
                      child: CustomTextField(
                        controller: _insuranceAmountController,
                        labelText: 'Insurance Amount (₹)',
                        hintText: 'e.g., 50.00',
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        validator: (value) {
                          if (_insuranceEnabled && (value == null || value.isEmpty)) {
                            return 'Insurance amount is required';
                          }
                          // Optional: Add numeric validation for insurance amount if needed
                          return null;
                        },
                      ),
                    )
                ],
              ),
              const SizedBox(height: 30),
              isLoading
                  ? const LoadingWidget()
                  : CustomButton(
                      onPressed: _createOrder,
                      text: 'Book Delivery',
                    ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}
