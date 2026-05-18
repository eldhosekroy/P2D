import 'dart:async';
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:p2d_flutter/core/constants/app_constants.dart';
import 'package:p2d_flutter/core/services/auth_service.dart';
import 'package:flutter/foundation.dart';

class SocketService {
  WebSocketChannel? _channel;
  final AuthService _authService;
  final StreamController<Map<String, dynamic>> _messageController = StreamController.broadcast();
  Stream<Map<String, dynamic>> get messages => _messageController.stream;

  SocketService(this._authService);

  Future<void> connect({
    required String userId,
    required String role,
    String? orderId,
  }) async {
    final accessToken = await _authService.getAccessToken();
    if (accessToken == null) {
      debugPrint('WebSocket: No access token found. Cannot connect.');
      return;
    }

    final uri = Uri.parse(
        '${AppConstants.websocketBaseUrl}?userId=$userId&role=$role&orderId=$orderId');
    // You might pass the JWT token as a query parameter or use a custom authorizer
    // For simplicity, we are passing userId, role, and orderId as query parameters.
    // In a real application, you might use a more secure method like a WebSocket custom authorizer
    // which validates the JWT directly.

    try {
      _channel = WebSocketChannel.connect(uri);
      debugPrint('WebSocket: Connecting to $uri');

      _channel?.stream.listen(
        (message) {
          final decodedMessage = json.decode(message);
          _messageController.add(decodedMessage);
          debugPrint('WebSocket: Received message: $decodedMessage');
        },
        onDone: () {
          debugPrint('WebSocket: Connection closed.');
          _messageController.addError({'error': 'WebSocket disconnected'});
          _disconnect();
        },
        onError: (error) {
          debugPrint('WebSocket: Error: $error');
          _messageController.addError({'error': 'WebSocket error', 'details': error.toString()});
          _disconnect();
        },
        cancelOnError: true,
      );
    } catch (e) {
      debugPrint('WebSocket: Failed to connect: $e');
      _messageController.addError({'error': 'Failed to connect', 'details': e.toString()});
    }
  }

  void sendMessage(Map<String, dynamic> message) {
    if (_channel?.sink != null) {
      _channel!.sink.add(json.encode(message));
      debugPrint('WebSocket: Sent message: $message');
    } else {
      debugPrint('WebSocket: Cannot send message, channel is not connected.');
    }
  }

  void _disconnect() {
    _channel?.sink.close();
    _channel = null;
  }

  void dispose() {
    _disconnect();
    _messageController.close();
  }
}
