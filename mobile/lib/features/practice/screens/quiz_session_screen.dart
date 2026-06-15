import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../gamification/widgets/brain_break_modal.dart';

class QuizSessionScreen extends StatefulWidget {
  final String? sessionId;
  final Map<String, dynamic>? quizData;
  final String subjectName;
  final String topicName;
  final bool isFallback;

  const QuizSessionScreen({
    super.key,
    this.sessionId,
    this.quizData,
    required this.subjectName,
    required this.topicName,
    required this.isFallback,
  });

  @override
  State<QuizSessionScreen> createState() => _QuizSessionScreenState();
}

class _QuizSessionScreenState extends State<QuizSessionScreen> {
  final ApiClient _apiClient = ApiClient();
  
  bool _isLoading = true;
  String? _errorMessage;
  
  // Real DB Session State
  Map<String, dynamic>? _currentQuestion;
  int _currentQuestionIndex = 0;
  int _totalQuestions = 5;
  
  // Fallback State
  List<dynamic> _fallbackQuestions = [];
  
  // UI State
  String? _selectedOptionId;
  bool _hasSubmitted = false;
  bool _isCorrect = false;
  String? _correctOptionId;
  String? _aiExplanation;
  bool _isLoadingExplanation = false;
  int _score = 0;
  int _xpAwarded = 0;

  int _consecutiveQuestionsAnswered = 0;
  bool _isShowingBrainBreak = false;

  @override
  void initState() {
    super.initState();
    if (widget.isFallback && widget.quizData != null) {
      _fallbackQuestions = widget.quizData!['questions'] ?? [];
      _totalQuestions = _fallbackQuestions.length;
      if (_totalQuestions > 0) {
        _currentQuestion = _fallbackQuestions[0];
        _isLoading = false;
      } else {
        _errorMessage = 'No questions available in this generated quiz.';
        _isLoading = false;
      }
    } else {
      // Real DB Session
      _fetchCurrentQuestion();
    }
  }

  Future<void> _fetchCurrentQuestion() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _hasSubmitted = false;
      _selectedOptionId = null;
      _correctOptionId = null;
      _aiExplanation = null;
    });

    try {
      final response = await _apiClient.dio.get('${AppConstants.practice}/session/${widget.sessionId}/current-question');
      if (response.statusCode == 200) {
        final data = response.data;
        setState(() {
          _currentQuestion = data['question'];
          _isLoading = false;
          // In real API, we don't know total questions exactly here without fetching session details,
          // but let's assume we can keep going until a 400 'No more questions' error.
        });
      }
    } catch (e) {
      // If we get an error, it might be 'No more questions in this session'
      if (e.toString().contains('No more questions') || e.toString().contains('already completed')) {
        _finishSession();
      } else {
        setState(() {
          _errorMessage = 'Failed to load question. Please try again.';
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _submitAnswer() async {
    if (_selectedOptionId == null) return;
    
    setState(() {
      _hasSubmitted = true;
      _isLoadingExplanation = false;
    });

    if (widget.isFallback) {
      // Handle locally
      final correctAnswerId = _currentQuestion!['correctAnswer'];
      setState(() {
        _isCorrect = (_selectedOptionId == correctAnswerId);
        _correctOptionId = correctAnswerId;
        if (_isCorrect) {
          _score++;
          _xpAwarded += 10;
        }
      });
    } else {
      // Submit to backend
      try {
        final response = await _apiClient.dio.post(
          '${AppConstants.practice}/answer',
          data: {
            'sessionId': widget.sessionId,
            'questionId': _currentQuestion!['id'],
            'userAnswer': _selectedOptionId,
          },
        );

        if (response.statusCode == 200 || response.statusCode == 201) {
          final data = response.data;
          setState(() {
            _isCorrect = data['isCorrect'] ?? false;
            if (_isCorrect) _score++;
            _xpAwarded += (data['xpAwarded'] as int?) ?? 0;
            _consecutiveQuestionsAnswered++;
            // The API doesn't return correctOptionId directly, so we rely on the visual indicator of what the user chose
          });
        }
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to submit answer.')),
        );
      }
    }
  }

  Future<void> _fetchAiExplanation() async {
    setState(() {
      _isLoadingExplanation = true;
    });

    if (widget.isFallback) {
      // Fallback has explanation built-in
      await Future.delayed(const Duration(milliseconds: 600)); // simulate network
      setState(() {
        _aiExplanation = _currentQuestion!['explanation'] ?? 'This is the correct answer because of the mathematical principles involved.';
        _isLoadingExplanation = false;
      });
    } else {
      // Fetch from API
      try {
        final response = await _apiClient.dio.get('${AppConstants.practice}/explanation/${widget.sessionId}/${_currentQuestion!['id']}');
        if (response.statusCode == 200) {
          setState(() {
            _aiExplanation = response.data['explanation'] ?? 'No explanation provided.';
            _isLoadingExplanation = false;
          });
        }
      } catch (e) {
        setState(() {
          _aiExplanation = 'Could not load AI explanation at this time.';
          _isLoadingExplanation = false;
        });
      }
    }
  }

  void _nextQuestion() {
    if (_consecutiveQuestionsAnswered >= 10 && !_isShowingBrainBreak) {
      _triggerBrainBreak();
      return;
    }

    if (widget.isFallback) {
      if (_currentQuestionIndex < _totalQuestions - 1) {
        setState(() {
          _currentQuestionIndex++;
          _currentQuestion = _fallbackQuestions[_currentQuestionIndex];
          _hasSubmitted = false;
          _selectedOptionId = null;
          _correctOptionId = null;
          _aiExplanation = null;
        });
      } else {
        _finishSession();
      }
    } else {
      _currentQuestionIndex++;
      _fetchCurrentQuestion();
    }
  }

  Future<void> _triggerBrainBreak() async {
    setState(() {
      _isShowingBrainBreak = true;
    });

    // Calculate mastery level
    final double successRate = _currentQuestionIndex > 0 
        ? (_score / _currentQuestionIndex) 
        : 0.5;
        
    String masteryLevel = 'medium';
    if (successRate < 0.5) masteryLevel = 'low';
    if (successRate >= 0.8) masteryLevel = 'high';

    try {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(
          child: CircularProgressIndicator(valueColor: AlwaysStoppedAnimation<Color>(AppColors.accent)),
        ),
      );

      final response = await _apiClient.dio.post('/gamification/games/generate', data: {
        'subject': widget.subjectName,
        'topic': widget.topicName,
        'grade': 8, // Assuming grade 8 for now or fetch from user context
        'difficulty': masteryLevel,
      });

      if (mounted) Navigator.pop(context); // hide loading

      if (response.statusCode == 200 || response.statusCode == 201) {
        if (mounted) {
          showModalBottomSheet(
            context: context,
            isScrollControlled: true,
            isDismissible: false,
            enableDrag: false,
            backgroundColor: Colors.transparent,
            builder: (context) {
              return BrainBreakModal(
                gameData: response.data,
                onComplete: () {
                  Navigator.pop(context);
                  setState(() {
                    _consecutiveQuestionsAnswered = 0;
                    _isShowingBrainBreak = false;
                    _xpAwarded += 50; // Bonus XP
                  });
                  _nextQuestion();
                },
              );
            },
          );
        }
      } else {
        _skipBrainBreak();
      }
    } catch (e) {
      if (mounted) Navigator.pop(context); // hide loading
      _skipBrainBreak();
    }
  }

  void _skipBrainBreak() {
    setState(() {
      _consecutiveQuestionsAnswered = 0;
      _isShowingBrainBreak = false;
    });
    _nextQuestion();
  }

  Future<void> _finishSession() async {
    if (!widget.isFallback) {
      try {
        await _apiClient.dio.post('${AppConstants.practice}/session/${widget.sessionId}/complete');
      } catch (e) {
        // Ignore errors on complete
      }
    }

    if (mounted) {
      context.pushReplacement(
        '/practice/results',
        extra: {
          'score': _score,
          'total': widget.isFallback ? _totalQuestions : _currentQuestionIndex,
          'xpAwarded': _xpAwarded,
          'subjectName': widget.subjectName,
          'topicName': widget.topicName,
        },
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('${widget.subjectName} Practice'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
        actions: [
          TextButton(
            onPressed: () => _finishSession(),
            child: const Text('End Session'),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary)))
          : _errorMessage != null
              ? Center(child: Text(_errorMessage!, style: const TextStyle(color: Colors.red)))
              : _buildQuizInterface(),
    );
  }

  Widget _buildQuizInterface() {
    final questionText = _currentQuestion?['content'] ?? 'Unknown Question';
    final options = _currentQuestion?['options'] as List<dynamic>? ?? [];

    return Column(
      children: [
        // Progress Bar (estimated for real API)
        LinearProgressIndicator(
          value: widget.isFallback ? (_currentQuestionIndex / _totalQuestions) : null,
          backgroundColor: AppColors.surfaceContainer,
          valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
        ),
        
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Question ${_currentQuestionIndex + 1}',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: AppColors.onSurfaceVariant,
                        letterSpacing: 1.1,
                      ),
                    ),
                    if (widget.isFallback)
                      Text(
                        '${_currentQuestionIndex + 1} / $_totalQuestions',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: AppColors.onSurfaceVariant,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 16),
                
                // Question Card
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.surfaceContainer),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.05),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Text(
                    questionText,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: AppColors.onSurface,
                      height: 1.4,
                    ),
                  ),
                ),
                
                const SizedBox(height: 32),
                
                // Options
                ...options.map((option) {
                  final String id = option['id'];
                  final String text = option['text'];
                  
                  bool isSelected = _selectedOptionId == id;
                  
                  Color borderColor = AppColors.surfaceContainer;
                  Color bgColor = Colors.white;
                  Color textColor = AppColors.onSurface;
                  IconData? trailingIcon;
                  Color iconColor = Colors.transparent;

                  if (_hasSubmitted) {
                    if (widget.isFallback) {
                      if (id == _correctOptionId) {
                        borderColor = Colors.green;
                        bgColor = Colors.green.withValues(alpha: 0.1);
                        trailingIcon = Icons.check_circle_rounded;
                        iconColor = Colors.green;
                      } else if (isSelected) {
                        borderColor = Colors.red;
                        bgColor = Colors.red.withValues(alpha: 0.1);
                        trailingIcon = Icons.cancel_rounded;
                        iconColor = Colors.red;
                      }
                    } else {
                      // For Real API, we only know if the selected option is correct or not.
                      if (isSelected) {
                        if (_isCorrect) {
                          borderColor = Colors.green;
                          bgColor = Colors.green.withValues(alpha: 0.1);
                          trailingIcon = Icons.check_circle_rounded;
                          iconColor = Colors.green;
                        } else {
                          borderColor = Colors.red;
                          bgColor = Colors.red.withValues(alpha: 0.1);
                          trailingIcon = Icons.cancel_rounded;
                          iconColor = Colors.red;
                        }
                      }
                    }
                  } else if (isSelected) {
                    borderColor = AppColors.primary;
                    bgColor = AppColors.primary.withValues(alpha: 0.05);
                    textColor = AppColors.primary;
                  }

                  return GestureDetector(
                    onTap: _hasSubmitted ? null : () {
                      setState(() {
                        _selectedOptionId = id;
                      });
                    },
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                      decoration: BoxDecoration(
                        color: bgColor,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: borderColor, width: isSelected || _hasSubmitted ? 2 : 1),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              text,
                              style: TextStyle(
                                fontSize: 16,
                                color: textColor,
                                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                              ),
                            ),
                          ),
                          if (_hasSubmitted && trailingIcon != null)
                            Icon(trailingIcon, color: iconColor),
                        ],
                      ),
                    ),
                  );
                }),
                
                if (_hasSubmitted) ...[
                  const SizedBox(height: 24),
                  
                  // AI Explanation Area
                  if (_aiExplanation == null)
                    OutlinedButton.icon(
                      onPressed: _isLoadingExplanation ? null : _fetchAiExplanation,
                      icon: _isLoadingExplanation 
                          ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                          : const Icon(Icons.auto_awesome),
                      label: Text(_isLoadingExplanation ? 'Asking AI...' : 'Ask AI Tutor for Explanation'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        foregroundColor: AppColors.primary,
                        side: const BorderSide(color: AppColors.primary),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    )
                  else
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.amber.shade50,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.amber.shade200),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(Icons.auto_awesome, color: Colors.amber.shade800, size: 20),
                              const SizedBox(width: 8),
                              Text(
                                'AI Tutor Explanation',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.amber.shade900,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text(
                            _aiExplanation!,
                            style: TextStyle(
                              color: Colors.amber.shade900,
                              height: 1.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ],
            ),
          ),
        ),
        
        // Bottom Action Bar
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 10,
                offset: const Offset(0, -4),
              ),
            ],
          ),
          child: SafeArea(
            child: SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: _selectedOptionId == null 
                    ? null 
                    : (_hasSubmitted ? _nextQuestion : _submitAnswer),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: Text(
                  _hasSubmitted ? 'Next Question' : 'Submit Answer',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
