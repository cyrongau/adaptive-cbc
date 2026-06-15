import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';

class BrainBreakModal extends StatefulWidget {
  final Map<String, dynamic> gameData;
  final VoidCallback onComplete;

  const BrainBreakModal({
    super.key,
    required this.gameData,
    required this.onComplete,
  });

  @override
  State<BrainBreakModal> createState() => _BrainBreakModalState();
}

class _BrainBreakModalState extends State<BrainBreakModal> with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;
  
  int _currentQuestionIndex = 0;
  bool _hasAnswered = false;
  bool _isCorrect = false;
  String? _selectedOption;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
    
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.05).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  void _submitAnswer(String option) {
    if (_hasAnswered) return;
    
    final currentQ = widget.gameData['questions'][_currentQuestionIndex];
    final correctAnswer = currentQ['correctAnswer'];

    setState(() {
      _selectedOption = option;
      _hasAnswered = true;
      _isCorrect = (option == correctAnswer);
    });

    // Automatically proceed after 2 seconds
    Future.delayed(const Duration(seconds: 2), () {
      if (!mounted) return;
      
      if (_currentQuestionIndex < (widget.gameData['questions'] as List).length - 1) {
        setState(() {
          _currentQuestionIndex++;
          _hasAnswered = false;
          _selectedOption = null;
          _isCorrect = false;
        });
      } else {
        // Game complete
        widget.onComplete();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final questions = widget.gameData['questions'] as List<dynamic>? ?? [];
    if (questions.isEmpty) {
      return const Center(child: Text('Invalid game data'));
    }

    final currentQ = questions[_currentQuestionIndex];
    final options = currentQ['options'] as List<dynamic>? ?? [];

    return Container(
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
      ),
      padding: EdgeInsets.only(
        top: 24,
        left: 24,
        right: 24,
        bottom: MediaQuery.of(context).padding.bottom + 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 48,
            height: 6,
            decoration: BoxDecoration(
              color: Colors.grey.shade300,
              borderRadius: BorderRadius.circular(10),
            ),
          ),
          const SizedBox(height: 24),
          
          ScaleTransition(
            scale: _pulseAnimation,
            child: const Icon(Icons.psychology_alt, size: 64, color: AppColors.accent),
          ),
          const SizedBox(height: 16),
          
          Text(
            widget.gameData['title'] ?? 'Brain Break Time!',
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(height: 32),
          
          Text(
            currentQ['question'] ?? currentQ['prompt'] ?? '',
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: AppColors.onSurface,
            ),
          ),
          const SizedBox(height: 32),
          
          ...options.map((option) {
            final isSelected = _selectedOption == option;
            Color bgColor = Colors.white;
            Color borderColor = Colors.grey.shade300;
            
            if (_hasAnswered) {
              if (option == currentQ['correctAnswer']) {
                bgColor = Colors.green.shade50;
                borderColor = Colors.green;
              } else if (isSelected) {
                bgColor = Colors.red.shade50;
                borderColor = Colors.red;
              }
            } else if (isSelected) {
              borderColor = AppColors.primary;
            }

            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: InkWell(
                onTap: () => _submitAnswer(option),
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
                  decoration: BoxDecoration(
                    color: bgColor,
                    border: Border.all(color: borderColor, width: 2),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Text(
                    option,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                      color: AppColors.onSurface,
                    ),
                  ),
                ),
              ),
            );
          }),
          
          if (_hasAnswered) ...[
            const SizedBox(height: 16),
            Text(
              _isCorrect ? 'Great job!' : 'Not quite!',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: _isCorrect ? Colors.green : Colors.red,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              currentQ['explanation'] ?? '',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey.shade700),
            )
          ]
        ],
      ),
    );
  }
}
