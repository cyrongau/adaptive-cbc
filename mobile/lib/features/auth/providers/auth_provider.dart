import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants.dart';
import '../../../core/services/notification_service.dart';
import 'dart:math';

class AuthProvider extends ChangeNotifier {
  final ApiClient _apiClient = ApiClient();
  
  bool _isLoading = false;
  bool _isTwoFactorPending = false;
  String? _tempEmail;
  Map<String, dynamic>? _currentUser;
  String? _errorMessage;
  bool _hasSeenOnboarding = false;
  bool _requiresDeviceApproval = false;
  String? _pendingDeviceId;
  String? _deviceFingerprint;

  bool get isLoading => _isLoading;
  bool get isTwoFactorPending => _isTwoFactorPending;
  String? get tempEmail => _tempEmail;
  Map<String, dynamic>? get currentUser => _currentUser;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _currentUser != null;
  bool get hasSeenOnboarding => _hasSeenOnboarding;
  bool get requiresDeviceApproval => _requiresDeviceApproval;
  String? get pendingDeviceId => _pendingDeviceId;

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  void completeOnboarding() {
    _hasSeenOnboarding = true;
    notifyListeners();
  }

  Future<void> _syncFcmToken() async {
    final token = NotificationService().fcmToken;
    if (token != null) {
      try {
        await _apiClient.dio.put(
          AppConstants.fcmToken,
          data: {'fcmToken': token},
        );
      } catch (e) {
        print('[Auth] Failed to sync FCM token: $e');
      }
    }
  }

  Future<bool> checkSession() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      _hasSeenOnboarding = prefs.getBool('has_seen_onboarding') ?? false;
      _deviceFingerprint = prefs.getString('device_fingerprint');

      final response = await _apiClient.dio.get(AppConstants.profile);
      if (response.statusCode == 200) {
        _currentUser = response.data;
        _isLoading = false;
        notifyListeners();
        _syncFcmToken();
        return true;
      }
    } catch (e) {
      print('[Auth] Session check failed: $e');
    }

    _currentUser = null;
    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    _isTwoFactorPending = false;
    _tempEmail = null;
    notifyListeners();

    try {
      final response = await _apiClient.dio.post(
        AppConstants.login,
        data: {
          'email': email,
          'password': password,
        },
      );

      if (response.statusCode != null && response.statusCode! >= 200 && response.statusCode! < 300) {
        final data = response.data;
        if (data is Map && data['isTwoFactorPending'] == true) {
          _isTwoFactorPending = true;
          _tempEmail = data['tempEmail'];
          _isLoading = false;
          notifyListeners();
          return true;
        } else {
          _currentUser = (data is Map) ? (data['user'] ?? data) : null;
          _isLoading = false;
          notifyListeners();
          _syncFcmToken();
          return true;
        }
      } else {
        final data = response.data;
        _errorMessage = (data is Map) ? (data['message'] ?? 'Authentication failed') : 'Authentication failed';
      }
    } on DioException catch (e) {
      _errorMessage = e.response?.data['message'] ?? 'Network or server error';
    } catch (e) {
      _errorMessage = 'An unexpected error occurred';
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  void clearDeviceApprovalState() {
    _requiresDeviceApproval = false;
    _pendingDeviceId = null;
    notifyListeners();
  }

  Future<bool> notifyParentForDeviceApproval(String deviceId) async {
    try {
      final response = await _apiClient.dio.post(
        AppConstants.notifyParent,
        data: {'deviceId': deviceId},
      );
      return response.statusCode == 200;
    } catch (e) {
      print('[Auth] Failed to notify parent: $e');
      return false;
    }
  }

  Future<String> _ensureDeviceFingerprint() async {
    if (_deviceFingerprint != null) return _deviceFingerprint!;
    final prefs = await SharedPreferences.getInstance();
    _deviceFingerprint = prefs.getString('device_fingerprint');
    if (_deviceFingerprint == null) {
      final random = Random.secure();
      final values = List<int>.generate(16, (i) => random.nextInt(256));
      _deviceFingerprint = values.map((e) => e.toRadixString(16).padLeft(2, '0')).join();
      await prefs.setString('device_fingerprint', _deviceFingerprint!);
    }
    return _deviceFingerprint!;
  }

  Future<bool> studentLogin(String identifier, String pin, {String? deviceFingerprint}) async {
    _isLoading = true;
    _errorMessage = null;
    
    // Use persistent fingerprint if none is explicitly passed
    final actualFingerprint = deviceFingerprint ?? await _ensureDeviceFingerprint();

    if (deviceFingerprint == null) {
      _requiresDeviceApproval = false;
      _pendingDeviceId = null;
    }
    notifyListeners();

    try {
      final dataPayload = {
        'identifier': identifier,
        'pin': pin,
        'deviceFingerprint': actualFingerprint,
      };
      
      final response = await _apiClient.dio.post(
        AppConstants.studentLogin,
        data: dataPayload,
      );

      final data = response.data;
      if (response.statusCode != null && response.statusCode! >= 200 && response.statusCode! < 300) {
        if (data is Map && data['requiresDeviceApproval'] == true) {
          _requiresDeviceApproval = true;
          _pendingDeviceId = data['deviceId'];
          _errorMessage = data['message'] ?? 'Device approval required from parent.';
          _isLoading = false;
          notifyListeners();
          return false;
        } else if (data is Map && data['requiresParentApproval'] == true) {
          _errorMessage = data['message'] ?? 'Parent approval required.';
          _isLoading = false;
          notifyListeners();
          return false;
        } else {
          _currentUser = (data is Map) ? (data['user'] ?? data) : null;
          _isLoading = false;
          notifyListeners();
          _syncFcmToken();
          return true;
        }
      } else {
        _errorMessage = (data is Map) ? (data['message'] ?? 'Authentication failed') : 'Authentication failed';
      }
    } on DioException catch (e) {
      if (e.response?.data is Map && e.response?.data['message'] != null) {
        final msg = e.response?.data['message'];
        _errorMessage = (msg is List) ? msg.join(', ') : msg.toString();
      } else {
        _errorMessage = 'Network or server error';
      }
    } catch (e) {
      _errorMessage = 'An unexpected error occurred';
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<bool> verifyOtp(String code) async {
    if (_tempEmail == null) {
      _errorMessage = 'No active verification session';
      notifyListeners();
      return false;
    }

    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.dio.post(
        AppConstants.verifyOtp,
        data: {
          'email': _tempEmail,
          'code': code,
        },
      );

      if (response.statusCode == 200) {
        _currentUser = response.data['user'];
        _isTwoFactorPending = false;
        _tempEmail = null;
        _isLoading = false;
        notifyListeners();
        _syncFcmToken();
        return true;
      } else {
        _errorMessage = response.data['message'] ?? 'Invalid verification code';
      }
    } on DioException catch (e) {
      _errorMessage = e.response?.data['message'] ?? 'Invalid verification code';
    } catch (e) {
      _errorMessage = 'An unexpected error occurred';
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<bool> socialLogin(String idToken, {String role = 'parent'}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.dio.post(
        AppConstants.socialLogin,
        data: {
          'idToken': idToken,
          'role': role,
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        // Backend either returns user directly or sets cookies
        _currentUser = response.data['user'] ?? response.data;
        _isLoading = false;
        notifyListeners();
        _syncFcmToken();
        return true;
      } else {
        _errorMessage = response.data['message'] ?? 'Social login failed';
      }
    } on DioException catch (e) {
      _errorMessage = e.response?.data['message'] ?? 'Network or server error';
    } catch (e) {
      _errorMessage = 'An unexpected error occurred';
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();

    try {
      await _apiClient.dio.post('${AppConstants.apiPrefix}/auth/logout');
    } catch (e) {
      print('[Auth] Logout API call failed, clearing local session anyway: $e');
    }

    await _apiClient.clearCookies();
    _currentUser = null;
    _isTwoFactorPending = false;
    _tempEmail = null;
    _isLoading = false;
    notifyListeners();
  }
}
