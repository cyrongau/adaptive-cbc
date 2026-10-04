import 'package:flutter/foundation.dart';
import '../services/tutor_service.dart';

class TutorProvider extends ChangeNotifier {
  final TutorService _service = TutorService();

  Map<String, dynamic>? _profile;
  Map<String, dynamic>? _stats;
  List<dynamic> _sessions = [];
  List<dynamic> _bookings = [];
  List<dynamic> _students = [];
  List<dynamic> _reviews = [];
  bool _isLoading = false;

  Map<String, dynamic>? get profile => _profile;
  Map<String, dynamic>? get stats => _stats;
  List<dynamic> get sessions => _sessions;
  List<dynamic> get bookings => _bookings;
  List<dynamic> get students => _students;
  List<dynamic> get reviews => _reviews;
  bool get isLoading => _isLoading;

  Future<void> loadProfile() async {
    try {
      _profile = await _service.getProfile();
      notifyListeners();
    } catch (_) {}
  }

  Future<void> loadStats() async {
    try {
      _stats = await _service.getStats();
      notifyListeners();
    } catch (_) {}
  }

  Future<void> loadSessions({String? status}) async {
    _isLoading = true;
    notifyListeners();
    try {
      _sessions = await _service.getSessions(status: status);
    } catch (_) {
      _sessions = [];
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> loadBookings({String? status}) async {
    _isLoading = true;
    notifyListeners();
    try {
      _bookings = await _service.getBookings(status: status);
    } catch (_) {
      _bookings = [];
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> loadStudents() async {
    try {
      _students = await _service.getMyStudents();
      notifyListeners();
    } catch (_) {}
  }

  Future<void> loadReviews(String tutorId) async {
    try {
      _reviews = await _service.getTutorReviews(tutorId);
      notifyListeners();
    } catch (_) {}
  }

  Future<bool> confirmBooking(String id, {String? message}) async {
    try {
      await _service.confirmBooking(id, responseMessage: message);
      await loadBookings();
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> cancelBooking(String id, String reason) async {
    try {
      await _service.cancelBooking(id, reason);
      await loadBookings();
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> startSession(String id) async {
    try {
      await _service.startSession(id);
      await loadSessions();
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> endSession(String id, {String? notes}) async {
    try {
      await _service.endSession(id, notes: notes);
      await loadSessions();
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<Map<String, dynamic>?> getSessionToken(String id) async {
    try {
      return await _service.getSessionToken(id);
    } catch (_) {
      return null;
    }
  }

  Future<void> refreshAll() async {
    await Future.wait([
      loadStats(),
      loadSessions(),
      loadBookings(),
      loadStudents(),
    ]);
  }
}
