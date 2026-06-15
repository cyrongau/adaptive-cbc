import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants.dart';
import '../../../core/theme/app_colors.dart';

class PracticeSetupScreen extends StatefulWidget {
  final String subjectId;
  final String subjectName;
  final String topicId;
  final String topicName;
  final int grade;

  const PracticeSetupScreen({
    super.key,
    required this.subjectId,
    required this.subjectName,
    required this.topicId,
    required this.topicName,
    required this.grade,
  });

  @override
  State<PracticeSetupScreen> createState() => _PracticeSetupScreenState();
}

class _PracticeSetupScreenState extends State<PracticeSetupScreen> {
  final ApiClient _apiClient = ApiClient();
  String _statusMessage = 'Preparing your personalized session...';
  bool _isError = false;
  bool _isFallback = false;
  Map<String, dynamic>? _quizData;
  String? _sessionId;

  @override
  void initState() {
    super.initState();
    _initializeSession();
  }

  Future<void> _initializeSession() async {
    try {
      // 1. Try to create a session first
      final response = await _apiClient.dio.post(
        '${AppConstants.practice}/session',
        data: {
          'subjectId': widget.subjectId,
          'topicId': widget.topicId.isNotEmpty ? widget.topicId : null,
          'grade': widget.grade,
          'questionCount': 5,
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        // Success
        _sessionId = response.data['id'];
        _navigateToSession();
      } else {
        _triggerFallback();
      }
    } catch (e) {
      _triggerFallback();
    }
  }

  Future<void> _triggerFallback() async {
    setState(() {
      _isFallback = true;
      _statusMessage = 'Generating AI Adaptive Quiz...';
    });

    try {
      final response = await _apiClient.dio.post(
        '${AppConstants.practice}/generate-ai-quiz',
        data: {
          'subject': widget.subjectName,
          'topic': widget.topicName,
          'grade': widget.grade,
          'questionCount': 5,
        },
      );

      if (response.statusCode == 200) {
        _quizData = response.data['quiz'];
        if (_quizData == null && response.data['questions'] != null) {
          _quizData = response.data; // Handle slight structure variations
        }
        _navigateToSession();
      } else {
        _showError('Failed to generate quiz. Please try again later.');
      }
    } catch (e) {
      _showError('Network error while generating quiz. Please try again.');
    }
  }

  void _showError(String message) {
    if (mounted) {
      setState(() {
        _isError = true;
        _statusMessage = message;
      });
    }
  }

  void _navigateToSession() {
    if (!mounted) return;
    
    // Replace the current screen with the actual quiz session
    context.pushReplacement(
      '/practice/session',
      extra: {
        'sessionId': _sessionId,
        'quizData': _quizData,
        'subjectName': widget.subjectName,
        'topicName': widget.topicName,
        'isFallback': _isFallback,
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  _isFallback ? Icons.auto_awesome : Icons.school_rounded,
                  size: 64,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(height: 32),
              Text(
                '${widget.subjectName} Practice',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                widget.topicName,
                style: const TextStyle(
                  fontSize: 16,
                  color: AppColors.onSurfaceVariant,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 48),
              if (_isError) ...[
                Text(
                  _statusMessage,
                  style: const TextStyle(color: Colors.red),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () {
                    setState(() {
                      _isError = false;
                      _statusMessage = 'Retrying...';
                    });
                    _initializeSession();
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                  ),
                  child: const Text('Retry'),
                ),
                TextButton(
                  onPressed: () => context.pop(),
                  child: const Text('Cancel'),
                ),
              ] else ...[
                const CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
                ),
                const SizedBox(height: 24),
                Text(
                  _statusMessage,
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppColors.onSurfaceVariant,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
