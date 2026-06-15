import 'package:flutter/foundation.dart';

class AppConstants {
  // Use 10.0.2.2 for Android Emulator, localhost for iOS simulator and Web
  static String get baseHttpUrl => kIsWeb ? 'http://localhost:3002' : 'http://10.0.2.2:3002';
  static String get baseWsUrl => kIsWeb ? 'http://localhost:3002' : 'http://10.0.2.2:3002';
  
  static const String apiPrefix = '/api/v1';
  
  // Endpoints
  static const String login = '$apiPrefix/auth/login';
  static const String verifyOtp = '$apiPrefix/auth/verify-otp';
  static const String profile = '$apiPrefix/users/profile';
  static const String subjects = '$apiPrefix/subjects';
  static const String courses = '$apiPrefix/courses';
  static const String practice = '$apiPrefix/practice';
  static const String classes = '$apiPrefix/classes';
  static const String tutors = '$apiPrefix/tutors';
  static const String liveToken = '$apiPrefix/live-sessions/token';
  static const String aiChat = '$apiPrefix/ai/chat';
  
  // Analytics
  static const String dashboard = '$apiPrefix/analytics/dashboard';
  static const String stats = '$apiPrefix/analytics/stats';
  static const String performance = '$apiPrefix/analytics/performance';
  static const String weakAreas = '$apiPrefix/analytics/weak-areas';
  static const String insights = '$apiPrefix/analytics/insights';
  static const String parentReports = '$apiPrefix/analytics/parent/reports';
  static const String generateParentReport = '$apiPrefix/analytics/parent/report/generate';

  // Chat
  static const String conversations = '$apiPrefix/chat/conversations';
  static const String messages = '$apiPrefix/chat/messages';
}

