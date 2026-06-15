import 'package:flutter/material.dart';
import 'package:connectivity_plus/connectivity_plus.dart';

class OfflineIndicator extends StatelessWidget {
  const OfflineIndicator({super.key});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<ConnectivityResult>>(
      stream: Connectivity().onConnectivityChanged,
      builder: (context, snapshot) {
        final isOffline = snapshot.data?.contains(ConnectivityResult.none) ?? false;
        
        if (!isOffline) return const SizedBox.shrink();

        return Container(
          width: double.infinity,
          color: Colors.orange.shade800,
          padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 16),
          child: const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.cloud_off, color: Colors.white, size: 16),
              SizedBox(width: 8),
              Text(
                'Offline Mode - Browsing Cached Content',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
