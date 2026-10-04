import 'package:flutter/foundation.dart';

class AppConstants {
  // Use 192.168.1.168 (Host LAN IP) for Physical Device/Emulator testing
  static String get baseHttpUrl => kIsWeb ? 'http://localhost:3002' : 'http://192.168.1.168:3002';
  static String get baseWsUrl => kIsWeb ? 'http://localhost:3002' : 'http://192.168.1.168:3002';
  
  static const String apiPrefix = '/api/v1';
  
  // Endpoints
  static const String login = '$apiPrefix/auth/login';
  static const String studentLogin = '$apiPrefix/students/login';
  static const String notifyParent = '$apiPrefix/students/notify-parent';
  static const String verifyOtp = '$apiPrefix/auth/verify-otp';
  static const String socialLogin = '$apiPrefix/auth/social-login';
  static const String profile = '$apiPrefix/users/profile';
  static const String fcmToken = '$apiPrefix/users/fcm-token';
  static const String subjects = '$apiPrefix/subjects';
  static const String questions = '$apiPrefix/questions';
  static const String assignments = '$apiPrefix/assignments';
  static const String courses = '$apiPrefix/courses/published';
  static const String courseDetail = '$apiPrefix/courses';
  static const String enrollments = '$apiPrefix/enrollment/my-enrollments';
  static const String enroll = '$apiPrefix/enrollment';
  static const String practice = '$apiPrefix/practice';
  static const String classes = '$apiPrefix/classes';
  static const String tutors = '$apiPrefix/tutors';
  static const String tutorProfile = '$apiPrefix/tutors/profile';
  static const String tutorApplication = '$apiPrefix/tutors/application';
  static const String tutorApply = '$apiPrefix/tutors/apply';
  static const String tutorAvailability = '$apiPrefix/tutors/availability';
  static const String tutorAvailabilitySlots = '$apiPrefix/tutors/availability/slots';
  static const String tutorBookings = '$apiPrefix/tutors/bookings';
  static const String tutorBookingConfirm = '$apiPrefix/tutors/bookings';
  static const String tutorBookingCancel = '$apiPrefix/tutors/bookings';
  static const String tutorSessions = '$apiPrefix/tutors/sessions';
  static const String tutorSessionStart = '$apiPrefix/tutors/sessions';
  static const String tutorSessionEnd = '$apiPrefix/tutors/sessions';
  static const String tutorSessionCancel = '$apiPrefix/tutors/sessions';
  static const String tutorSessionToken = '$apiPrefix/tutors/sessions';
  static const String tutorReviews = '$apiPrefix/tutors/reviews';
  static const String tutorStudents = '$apiPrefix/tutors/students';
  static const String tutorStats = '$apiPrefix/tutors/stats';
  static const String tutorBook = '$apiPrefix/tutors/book';
  static String get liveKitUrl => kIsWeb ? 'ws://localhost:7880' : 'ws://192.168.1.168:7880';
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

  // Gamification / Leaderboard
  static const String gamification = '$apiPrefix/gamification';
  static const String leaderboardGlobal = '$apiPrefix/gamification/leaderboard/global';
  static const String leaderboardGrade = '$apiPrefix/gamification/leaderboard/grade';
  static const String leaderboardSubject = '$apiPrefix/gamification/leaderboard/subject';
  static const String badges = '$apiPrefix/gamification/badges';
  static const String streak = '$apiPrefix/gamification/streak';

  // Store
  static const String store = '$apiPrefix/store';
  static const String storeProducts = '$apiPrefix/store/products';
  static const String storeCart = '$apiPrefix/store/cart';
  static const String storeOrders = '$apiPrefix/store/orders';

  // Digital Library
  static const String digitalLibrary = '$apiPrefix/digital-library';
  static const String libraryPapers = '$apiPrefix/digital-library/papers';

  // Lessons / Schedule
  static const String lessons = '$apiPrefix/lessons';
  static const String timetable = '$apiPrefix/lessons/timetable';

  // Learning Materials
  static const String materials = '$apiPrefix/materials';

  // Institutions / School
  static const String institutions = '$apiPrefix/institutions';
  static const String mySchool = '$apiPrefix/institutions/my-school';

  // Financial / Wallet
  static const String wallet = '$apiPrefix/financial/wallet';
  static const String walletDetails = '$apiPrefix/financial/wallet/details';
  static const String transactions = '$apiPrefix/financial/transactions';
  static const String withdrawals = '$apiPrefix/financial/withdrawals';
}

