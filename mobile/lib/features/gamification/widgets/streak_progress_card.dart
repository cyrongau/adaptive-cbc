import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';

class StreakProgressCard extends StatelessWidget {
  final int currentStreak;
  final VoidCallback? onViewAchievements;

  const StreakProgressCard({
    super.key,
    required this.currentStreak,
    this.onViewAchievements,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.orange.withOpacity(0.15),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _buildFireIcon(),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '$currentStreak Day Streak!',
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: AppColors.onSurface,
                    ),
                  ),
                  Text(
                    'You\'re on fire! Keep it up.',
                    style: TextStyle(
                      fontSize: 14,
                      color: AppColors.onSurfaceVariant.withOpacity(0.8),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 24),
          // 7-day progress track
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: List.generate(7, (index) {
              final int dayNumber = index + 1;
              final bool isAchieved = dayNumber <= (currentStreak % 7 == 0 && currentStreak > 0 ? 7 : currentStreak % 7);
              final bool isToday = dayNumber == (currentStreak % 7 == 0 && currentStreak > 0 ? 7 : currentStreak % 7);

              return Column(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: isAchieved ? AppColors.accent : AppColors.surfaceContainer,
                      border: isToday
                          ? Border.all(color: AppColors.primary, width: 2)
                          : null,
                      boxShadow: isAchieved
                          ? [
                              BoxShadow(
                                color: AppColors.accent.withOpacity(0.4),
                                blurRadius: 8,
                                offset: const Offset(0, 4),
                              )
                            ]
                          : [],
                    ),
                    child: Center(
                      child: isAchieved
                          ? const Icon(Icons.check_rounded, color: Colors.white, size: 20)
                          : Text(
                              'Day\n$dayNumber',
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.bold,
                                color: AppColors.onSurfaceVariant,
                              ),
                            ),
                    ),
                  ),
                ],
              );
            }),
          ),
          const SizedBox(height: 24),
          if (onViewAchievements != null)
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: onViewAchievements,
                icon: const Icon(Icons.emoji_events_rounded, color: Colors.white),
                label: const Text('View All Achievements'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  elevation: 0,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildFireIcon() {
    return TweenAnimationBuilder<double>(
      tween: Tween<double>(begin: 0.8, end: 1.1),
      duration: const Duration(seconds: 1),
      curve: Curves.easeInOut,
      builder: (context, value, child) {
        return Transform.scale(
          scale: value,
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.accent.withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.local_fire_department_rounded,
              color: AppColors.accent,
              size: 36,
            ),
          ),
        );
      },
      onEnd: () {}, // For a continuous loop, we would need a StatefulWidget, but this gives a nice entry pulse
    );
  }
}
