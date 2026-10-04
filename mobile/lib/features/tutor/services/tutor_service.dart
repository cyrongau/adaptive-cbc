import '../../../core/network/api_client.dart';
import '../../../core/constants.dart';

class TutorService {
  final ApiClient _apiClient = ApiClient();

  // ======================
  // APPLICATION
  // ======================

  Future<Map<String, dynamic>> getApplication() async {
    final res = await _apiClient.dio.get(AppConstants.tutorApplication);
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> apply(dynamic data) async {
    final res = await _apiClient.dio.post(AppConstants.tutorApply, data: data);
    return res.data as Map<String, dynamic>;
  }

  // ======================
  // PROFILE
  // ======================

  Future<Map<String, dynamic>> getProfile() async {
    final res = await _apiClient.dio.get(AppConstants.tutorProfile);
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> updateProfile(dynamic data) async {
    final res = await _apiClient.dio.post(AppConstants.tutorProfile, data: data);
    return res.data as Map<String, dynamic>;
  }

  // ======================
  // AVAILABILITY
  // ======================

  Future<Map<String, dynamic>> setAvailabilitySlots(List<Map<String, String>> slots) async {
    final res = await _apiClient.dio.post(AppConstants.tutorAvailabilitySlots, data: {'slots': slots});
    return res.data as Map<String, dynamic>;
  }

  Future<List<dynamic>> getAvailableSlots(String tutorId) async {
    final res = await _apiClient.dio.get(AppConstants.tutorAvailabilitySlots, queryParameters: {'tutorId': tutorId});
    final data = res.data;
    return (data is List) ? data : (data['data'] as List?) ?? [];
  }

  // ======================
  // BOOKINGS
  // ======================

  Future<Map<String, dynamic>> createBooking(dynamic data) async {
    final res = await _apiClient.dio.post(AppConstants.tutorBook, data: data);
    return res.data as Map<String, dynamic>;
  }

  Future<List<dynamic>> getBookings({String? status}) async {
    final params = <String, dynamic>{};
    if (status != null) params['status'] = status;
    final res = await _apiClient.dio.get(AppConstants.tutorBookings, queryParameters: params);
    final data = res.data;
    return (data is List) ? data : (data['data'] as List?) ?? [];
  }

  Future<Map<String, dynamic>> confirmBooking(String id, {String? responseMessage}) async {
    final res = await _apiClient.dio.patch(
      '${AppConstants.tutorBookingConfirm}/$id/confirm',
      data: {'responseMessage': responseMessage},
    );
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> cancelBooking(String id, String reason) async {
    final res = await _apiClient.dio.patch(
      '${AppConstants.tutorBookingCancel}/$id/cancel',
      data: {'reason': reason},
    );
    return res.data as Map<String, dynamic>;
  }

  // ======================
  // SESSIONS
  // ======================

  Future<List<dynamic>> getSessions({String? status}) async {
    final params = <String, dynamic>{};
    if (status != null) params['status'] = status;
    final res = await _apiClient.dio.get(AppConstants.tutorSessions, queryParameters: params);
    final data = res.data;
    return (data is List) ? data : (data['data'] as List?) ?? [];
  }

  Future<Map<String, dynamic>> getSession(String id) async {
    final res = await _apiClient.dio.get('${AppConstants.tutorSessions}/$id');
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> startSession(String id) async {
    final res = await _apiClient.dio.post('${AppConstants.tutorSessionStart}/$id/start');
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> endSession(String id, {String? notes}) async {
    final res = await _apiClient.dio.post(
      '${AppConstants.tutorSessionEnd}/$id/end',
      data: {'notes': notes},
    );
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> cancelSession(String id, String reason) async {
    final res = await _apiClient.dio.post(
      '${AppConstants.tutorSessionCancel}/$id/cancel',
      data: {'reason': reason},
    );
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getSessionToken(String id) async {
    final res = await _apiClient.dio.get('${AppConstants.tutorSessionToken}/$id/token');
    return res.data as Map<String, dynamic>;
  }

  // ======================
  // REVIEWS
  // ======================

  Future<Map<String, dynamic>> createReview(dynamic data) async {
    final res = await _apiClient.dio.post(AppConstants.tutorReviews, data: data);
    return res.data as Map<String, dynamic>;
  }

  Future<List<dynamic>> getTutorReviews(String tutorId) async {
    final res = await _apiClient.dio.get('${AppConstants.tutorReviews}/$tutorId');
    final data = res.data;
    return (data is List) ? data : (data['data'] as List?) ?? [];
  }

  // ======================
  // STUDENTS
  // ======================

  Future<List<dynamic>> getMyStudents() async {
    final res = await _apiClient.dio.get(AppConstants.tutorStudents);
    final data = res.data;
    return (data is List) ? data : (data['data'] as List?) ?? [];
  }

  // ======================
  // STATS
  // ======================

  Future<Map<String, dynamic>> getStats() async {
    final res = await _apiClient.dio.get(AppConstants.tutorStats);
    return res.data as Map<String, dynamic>;
  }

  // ======================
  // WALLET / WITHDRAWALS
  // ======================

  Future<Map<String, dynamic>> getWallet() async {
    final res = await _apiClient.dio.get(AppConstants.wallet);
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> updateWalletDetails(dynamic data) async {
    final res = await _apiClient.dio.put(AppConstants.walletDetails, data: data);
    return res.data as Map<String, dynamic>;
  }

  Future<List<dynamic>> getWithdrawals({String? status}) async {
    final params = <String, dynamic>{};
    if (status != null) params['status'] = status;
    final res = await _apiClient.dio.get(AppConstants.withdrawals, queryParameters: params);
    final data = res.data;
    return (data is List) ? data : (data['data'] as List?) ?? [];
  }

  Future<Map<String, dynamic>> createWithdrawal(dynamic data) async {
    final res = await _apiClient.dio.post(AppConstants.withdrawals, data: data);
    return res.data as Map<String, dynamic>;
  }

  Future<List<dynamic>> getTransactions() async {
    final res = await _apiClient.dio.get(AppConstants.transactions);
    final data = res.data;
    return (data is List) ? data : (data['data'] as List?) ?? [];
  }

  // ======================
  // PUBLIC / STUDENT-FACING
  // ======================

  Future<List<dynamic>> browseTutors({String? subjectId, int? grade, double? minRating}) async {
    final params = <String, dynamic>{};
    if (subjectId != null) params['subjectId'] = subjectId;
    if (grade != null) params['grade'] = grade;
    if (minRating != null) params['minRating'] = minRating;
    final res = await _apiClient.dio.get(AppConstants.tutors, queryParameters: params);
    final data = res.data;
    return (data is List) ? data : (data['data'] as List?) ?? [];
  }

  Future<List<dynamic>> searchTutors(String query) async {
    final res = await _apiClient.dio.get('${AppConstants.tutors}/search', queryParameters: {'q': query});
    final data = res.data;
    return (data is List) ? data : (data['data'] as List?) ?? [];
  }

  Future<Map<String, dynamic>> getTutorById(String id) async {
    final res = await _apiClient.dio.get('${AppConstants.tutors}/$id');
    return res.data as Map<String, dynamic>;
  }

  Future<List<dynamic>> getTutorReviewsPublic(String tutorId) async {
    final res = await _apiClient.dio.get('${AppConstants.tutorReviews}/$tutorId');
    final data = res.data;
    return (data is List) ? data : (data['data'] as List?) ?? [];
  }
}
