import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/network/api_client.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/chat/providers/chat_provider.dart';
import 'features/tutor/providers/tutor_provider.dart';
import 'core/services/sync_service.dart';
import 'core/services/notification_service.dart';
import 'package:firebase_core/firebase_core.dart';
import 'app.dart';

void main() async {
  // Ensure engine is fully initialized for path_provider / storage
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize network API client and persistent session jar
  try {
    final apiClient = ApiClient();
    await apiClient.init();
  } catch (e) {
    debugPrint('[Main] ApiClient init error: $e');
  }

  // Initialize Firebase & background services without blocking initial frame render
  try {
    await Firebase.initializeApp();
    NotificationService().initialize().catchError((e) {
      debugPrint('[Main] NotificationService init error: $e');
    });
  } catch (e) {
    debugPrint('[Main] Firebase init error: $e');
  }

  try {
    SyncService().initialize();
  } catch (e) {
    debugPrint('[Main] SyncService init error: $e');
  }

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider<AuthProvider>(
          create: (_) => AuthProvider(),
        ),
        ChangeNotifierProvider<ChatProvider>(
          create: (_) => ChatProvider(),
        ),
        ChangeNotifierProvider<TutorProvider>(
          create: (_) => TutorProvider(),
        ),
      ],
      child: const AdaptiveCBCApp(),
    ),
  );
}
