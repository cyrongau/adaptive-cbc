import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants.dart';

class AuthProvider extends ChangeNotifier {
  final ApiClient _apiClient = ApiClient();
  
  bool _isLoading = false;
  bool _isTwoFactorPending = false;
  String? _tempEmail;
  Map<String, dynamic>? _currentUser;
  String? _errorMessage;

  bool get isLoading => _isLoading;
  bool get isTwoFactorPending => _isTwoFactorPending;
  String? get tempEmail => _tempEmail;
  Map<String, dynamic>? get currentUser => _currentUser;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _currentUser != null;

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  Future<bool> checkSession() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.dio.get(AppConstants.profile);
      if (response.statusCode == 200) {
        _currentUser = response.data;
        _isLoading = false;
        notifyListeners();
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

      if (response.statusCode == 200) {
        final data = response.data;
        if (data['isTwoFactorPending'] == true) {
          _isTwoFactorPending = true;
          _tempEmail = data['tempEmail'];
          _isLoading = false;
          notifyListeners();
          return true;
        }
      } else {
        _errorMessage = response.data['message'] ?? 'Authentication failed';
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
