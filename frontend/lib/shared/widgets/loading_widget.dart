import 'package:flutter/material.dart';

class LoadingWidget extends StatelessWidget {
  final Color? color;
  final double strokeWidth;

  const LoadingWidget({
    super.key,
    this.color,
    this.strokeWidth = 4.0,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: CircularProgressIndicator(
        valueColor: AlwaysStoppedAnimation<Color>(color ?? Theme.of(context).primaryColor),
        strokeWidth: strokeWidth,
      ),
    );
  }
}
