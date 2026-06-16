import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/network/api_client.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/chat/providers/chat_provider.dart';
import 'core/services/sync_service.dart';
import 'core/services/notification_service.dart';
import 'package:firebase_core/firebase_core.dart';
import 'app.dart';

void main() async {
  // Ensure engine is fully initialized for path_provider / storage
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize network API client and persistent session jar
  final apiClient = ApiClient();
  await apiClient.init();

  // Initialize Firebase
  await Firebase.initializeApp();

  // Initialize Notifications
  await NotificationService().initialize();

  // Initialize Offline Sync Service
  SyncService().initialize();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider<AuthProvider>(
          create: (_) => AuthProvider(),
        ),
        ChangeNotifierProvider<ChatProvider>(
          create: (_) => ChatProvider(),
        ),
      ],
      child: const AdaptiveCBCApp(),
    ),
  );
}
