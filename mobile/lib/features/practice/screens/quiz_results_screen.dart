import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';

class QuizResultsScreen extends StatelessWidget {
  final int score;
  final int total;
  final int xpAwarded;
  final String subjectName;
  final String topicName;

  const QuizResultsScreen({
    super.key,
    required this.score,
    required this.total,
    required this.xpAwarded,
    required this.subjectName,
    required this.topicName,
  });

  @override
  Widget build(BuildContext context) {
    final double percentage = total > 0 ? (score / total) * 100 : 0;
    
    String message;
    IconData icon;
    Color color;

    if (percentage >= 80) {
      message = 'Outstanding!';
      icon = Icons.emoji_events_rounded;
      color = Colors.amber;
    } else if (percentage >= 50) {
      message = 'Good Job!';
      icon = Icons.thumb_up_rounded;
      color = AppColors.primary;
    } else {
      message = 'Keep Practicing!';
      icon = Icons.trending_up_rounded;
      color = Colors.orange;
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(32),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, size: 80, color: color),
              ),
              const SizedBox(height: 32),
              Text(
                message,
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: AppColors.onSurface,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'You completed the $topicName session in $subjectName.',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 16,
                  color: AppColors.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 48),
              
              // Stats Cards
              Row(
                children: [
                  Expanded(
                    child: _buildStatCard(
                      'Score', 
                      '$score / $total', 
                      Icons.check_circle_outline, 
                      AppColors.primary,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: _buildStatCard(
                      'XP Earned', 
                      '+$xpAwarded', 
                      Icons.star_rounded, 
                      Colors.amber.shade700,
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 64),
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: () => context.pop(),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Return to Subjects',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(20),
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
      child: Column(
        children: [
          Icon(icon, color: color, size: 32),
          const SizedBox(height: 12),
          Text(
            value,
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: AppColors.onSurfaceVariant,
              letterSpacing: 1.1,
            ),
          ),
        ],
      ),
    );
  }
}
