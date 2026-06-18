import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:firebase_auth/firebase_auth.dart' hide AuthProvider;
import '../providers/auth_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/services/social_auth_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final SocialAuthService _socialAuthService = SocialAuthService();

  // Student Form
  final _studentFormKey = GlobalKey<FormState>();
  final _studentIdController = TextEditingController();
  final _studentPinController = TextEditingController();

  // Parent/Teacher Form
  final _adultFormKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _studentIdController.dispose();
    _studentPinController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submitStudent() async {
    if (!_studentFormKey.currentState!.validate()) return;
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final identifier = _studentIdController.text.trim();
    final pin = _studentPinController.text;
    
    final success = await authProvider.studentLogin(identifier, pin);
    
    if (!success && authProvider.requiresDeviceApproval) {
      _showDeviceApprovalDialog(authProvider, identifier, pin);
      return;
    }
    
    _navigateOnSuccess(success, authProvider);
  }

  void _showDeviceApprovalDialog(AuthProvider authProvider, String identifier, String pin) {
    bool isWaiting = false;
    Timer? pollingTimer;
    int retryCount = 0;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              title: const Text('New Device Detected'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.security, size: 48, color: AppColors.primary),
                  const SizedBox(height: 16),
                  Text(
                    isWaiting 
                        ? 'Waiting for parent approval... ($retryCount/3)'
                        : 'Your parent must approve this new device before you can log in.',
                    textAlign: TextAlign.center,
                  ),
                  if (isWaiting) ...[
                    const SizedBox(height: 16),
                    const CircularProgressIndicator(),
                  ],
                ],
              ),
              actions: [
                if (!isWaiting)
                  TextButton(
                    onPressed: () {
                      authProvider.clearDeviceApprovalState();
                      Navigator.pop(dialogContext);
                    },
                    child: const Text('Cancel'),
                  ),
                if (!isWaiting)
                  ElevatedButton(
                    onPressed: () async {
                      if (authProvider.pendingDeviceId != null) {
                        await authProvider.notifyParentForDeviceApproval(authProvider.pendingDeviceId!);
                      }
                      setState(() {
                        isWaiting = true;
                      });
                      
                      pollingTimer = Timer.periodic(const Duration(seconds: 5), (timer) async {
                        retryCount++;
                        setState(() {});
                        
                        final pollSuccess = await authProvider.studentLogin(
                          identifier, 
                          pin, 
                          deviceFingerprint: authProvider.pendingDeviceId
                        );
                        if (pollSuccess) {
                          timer.cancel();
                          if (dialogContext.mounted) {
                            Navigator.pop(dialogContext);
                            _navigateOnSuccess(true, authProvider);
                          }
                        } else if (retryCount >= 12) {
                          timer.cancel();
                          if (dialogContext.mounted) {
                            Navigator.pop(dialogContext);
                            _showError('Approval timed out. Please contact your parent manually and try again.');
                            authProvider.clearDeviceApprovalState();
                          }
                        }
                      });
                    },
                    child: const Text('Send Approval Request'),
                  ),
              ],
            );
          },
        );
      },
    ).then((_) {
      pollingTimer?.cancel();
    });
  }

  Future<void> _submitAdult() async {
    if (!_adultFormKey.currentState!.validate()) return;
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final success = await authProvider.login(
      _emailController.text.trim(),
      _passwordController.text,
    );
    _navigateOnSuccess(success, authProvider);
  }

  Future<void> _handleGoogleSignIn() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    try {
      final idToken = await _socialAuthService.signInWithGoogle();
      if (idToken != null) {
        final success = await authProvider.socialLogin(idToken, role: 'parent'); // Assume parent default or pick role from context
        _navigateOnSuccess(success, authProvider);
      }
    } catch (e) {
      _showError('Google Sign-In failed');
    }
  }

  Future<void> _handleAppleSignIn() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    try {
      final idToken = await _socialAuthService.signInWithApple();
      if (idToken != null) {
        final success = await authProvider.socialLogin(idToken, role: 'parent');
        _navigateOnSuccess(success, authProvider);
      }
    } catch (e) {
      _showError('Apple Sign-In failed');
    }
  }

  Future<void> _handlePhoneSignIn() async {
    String phone = '';
    
    // Step 1: Request Phone Number
    final phoneSubmitted = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Enter Phone Number'),
          content: TextField(
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(
              hintText: '+1234567890',
            ),
            onChanged: (val) => phone = val,
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Send SMS'),
            ),
          ],
        );
      },
    );

    if (phoneSubmitted != true || phone.isEmpty) return;

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    
    await _socialAuthService.auth.verifyPhoneNumber(
      phoneNumber: phone,
      verificationCompleted: (credential) async {
        try {
          final userCredential = await _socialAuthService.auth.signInWithCredential(credential);
          final idToken = await userCredential.user?.getIdToken();
          if (idToken != null) {
            final success = await authProvider.socialLogin(idToken, role: 'parent');
            _navigateOnSuccess(success, authProvider);
          }
        } catch (e) {
          _showError('Automatic verification failed');
        }
      },
      verificationFailed: (e) {
        _showError('Verification failed: ${e.message}');
      },
      codeSent: (verificationId, resendToken) async {
        String smsCode = '';
        final otpSubmitted = await showDialog<bool>(
          context: context,
          barrierDismissible: false,
          builder: (context) {
            return AlertDialog(
              title: const Text('Enter SMS Code'),
              content: TextField(
                keyboardType: TextInputType.number,
                onChanged: (val) => smsCode = val,
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context, false),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: () => Navigator.pop(context, true),
                  child: const Text('Verify'),
                ),
              ],
            );
          },
        );

        if (otpSubmitted == true && smsCode.isNotEmpty) {
          try {
            final credential = PhoneAuthProvider.credential(
              verificationId: verificationId,
              smsCode: smsCode,
            );
            final userCredential = await _socialAuthService.auth.signInWithCredential(credential);
            final idToken = await userCredential.user?.getIdToken();
            if (idToken != null) {
              final success = await authProvider.socialLogin(idToken, role: 'parent');
              _navigateOnSuccess(success, authProvider);
            }
          } catch (e) {
            _showError('Invalid SMS code');
          }
        }
      },
      codeAutoRetrievalTimeout: (verificationId) {},
    );
  }

  void _navigateOnSuccess(bool success, AuthProvider authProvider) {
    if (success && mounted) {
      if (authProvider.isTwoFactorPending) {
        context.push('/otp');
      } else {
        context.go('/home');
      }
    } else if (mounted) {
      _showError(authProvider.errorMessage ?? 'Login failed');
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppColors.error,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final theme = Theme.of(context);

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            const SizedBox(height: 40),
            Center(
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Image.asset(
                  'assets/images/logo.png',
                  height: 64,
                  width: 64,
                  errorBuilder: (context, error, stackTrace) => const Icon(
                    Icons.school_rounded,
                    size: 64,
                    color: AppColors.primary,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Adaptive CBC',
              style: theme.textTheme.displayMedium?.copyWith(
                color: AppColors.primary,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 24),
            TabBar(
              controller: _tabController,
              labelColor: AppColors.primary,
              unselectedLabelColor: Colors.grey,
              indicatorColor: AppColors.primary,
              tabs: const [
                Tab(text: 'Student'),
                Tab(text: 'Parent / Teacher'),
              ],
            ),
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  _buildStudentTab(authProvider),
                  _buildAdultTab(authProvider),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStudentTab(AuthProvider authProvider) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Form(
        key: _studentFormKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextFormField(
              controller: _studentIdController,
              decoration: const InputDecoration(
                labelText: 'Username or Admission Number',
                prefixIcon: Icon(Icons.person_outline, color: AppColors.primary),
              ),
              validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _studentPinController,
              obscureText: true,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: '4-Digit PIN',
                prefixIcon: Icon(Icons.dialpad, color: AppColors.primary),
              ),
              validator: (v) => (v == null || v.length < 4) ? 'Enter valid PIN' : null,
            ),
            const SizedBox(height: 24),
            if (authProvider.isLoading)
              const Center(child: CircularProgressIndicator(color: AppColors.primary))
            else
              ElevatedButton(
                onPressed: _submitStudent,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                ),
                child: const Text('Sign In as Student'),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildAdultTab(AuthProvider authProvider) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Form(
        key: _adultFormKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextFormField(
              controller: _emailController,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(
                labelText: 'Email Address or Phone',
                prefixIcon: Icon(Icons.email_outlined, color: AppColors.primary),
              ),
              validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _passwordController,
              obscureText: true,
              decoration: const InputDecoration(
                labelText: 'Password',
                prefixIcon: Icon(Icons.lock_outline, color: AppColors.primary),
              ),
              validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
            ),
            const SizedBox(height: 24),
            if (authProvider.isLoading)
              const Center(child: CircularProgressIndicator(color: AppColors.primary))
            else
              ElevatedButton(
                onPressed: _submitAdult,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                ),
                child: const Text('Sign In'),
              ),
            const SizedBox(height: 24),
            const Row(
              children: [
                Expanded(child: Divider()),
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 16),
                  child: Text('OR', style: TextStyle(color: Colors.grey)),
                ),
                Expanded(child: Divider()),
              ],
            ),
            const SizedBox(height: 24),
            OutlinedButton.icon(
              icon: const Icon(Icons.phone_android, color: Colors.blueGrey),
              label: const Text('Sign in with Phone'),
              onPressed: _handlePhoneSignIn,
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              icon: const Icon(Icons.g_mobiledata, color: Colors.red),
              label: const Text('Sign in with Google'),
              onPressed: _handleGoogleSignIn,
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              icon: const Icon(Icons.apple, color: Colors.black),
              label: const Text('Sign in with Apple'),
              onPressed: _handleAppleSignIn,
            ),
          ],
        ),
      ),
    );
  }
}
