import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:p2d_flutter/core/utils/helpers.dart';
import 'package:p2d_flutter/features/orders/models/order_model.dart';
import 'package:p2d_flutter/features/orders/providers/order_provider.dart';
import 'package:p2d_flutter/shared/widgets/loading_widget.dart';
import 'package:p2d_flutter/shared/widgets/error_widget.dart';

class OrderHistoryScreen extends ConsumerWidget {
  const OrderHistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final orderState = ref.watch(orderProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Order History'),
      ),
      body: orderState.when(
        loading: () => const LoadingWidget(),
        error: (err, stack) => ErrorWidget(
          message: 'Failed to load orders: $err',
          onRetry: () => ref.read(orderProvider.notifier).fetchOrders(),
        ),
        data: (orders) {
          if (orders.isEmpty) {
            return const Center(
              child: Text('No orders found. Start booking!'),
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.all(8.0),
            itemCount: orders.length,
            itemBuilder: (context, index) {
              final order = orders[index];
              return OrderListItem(order: order);
            },
          );
        },
      ),
    );
  }
}

class OrderListItem extends StatelessWidget {
  final OrderModel order;

  const OrderListItem({super.key, required this.order});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 8.0),
      child: InkWell(
        onTap: () {
          // Navigate to order details screen
          context.go('/customer/orders/${order.id}'); // Placeholder route
        },
        child: Padding(
          padding: const EdgeInsets.all(12.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Order #${order.id.substring(0, 8)}',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  Text(
                    Helpers.formatDate(order.createdAt),
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                '${order.pickupAddress.length > 40 ? order.pickupAddress.substring(0, 37) + '...' : order.pickupAddress} 
-> ${order.dropAddress.length > 40 ? order.dropAddress.substring(0, 37) + '...' : order.dropAddress}',
                style: Theme.of(context).textTheme.bodyMedium,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    Helpers.formatCurrency(order.estimatedPrice),
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(color: Theme.of(context).primaryColor),
                  ),
                  Chip(
                    label: Text(order.status),
                    backgroundColor: _getStatusColor(order.status, context),
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    labelStyle: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.white),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Color _getStatusColor(String status, BuildContext context) {
    switch (status) {
      case 'pending': return Colors.grey;
      case 'assigned': return Colors.blue;
      case 'picked_up': return Colors.orange;
      case 'in_transit': return Colors.deepPurpleAccent;
      case 'delivered': return Colors.green;
      case 'cancelled': return Colors.red;
      default: return Colors.grey;
    }
  }
}
