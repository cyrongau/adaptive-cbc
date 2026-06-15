import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/app_colors.dart';

class AchievementsScreen extends StatefulWidget {
  const AchievementsScreen({super.key});

  @override
  State<AchievementsScreen> createState() => _AchievementsScreenState();
}

class _AchievementsScreenState extends State<AchievementsScreen> {
  final ApiClient _apiClient = ApiClient();
  bool _isLoading = true;
  List<dynamic> _badges = [];
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _fetchBadges();
  }

  Future<void> _fetchBadges() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final response = await _apiClient.dio.get('/gamification/badges');
      if (response.statusCode == 200) {
        setState(() {
          _badges = response.data;
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = response.data['message'] ?? 'Failed to load achievements';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Could not connect to the server.';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Achievements & Badges'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.onSurface,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
              ),
            )
          : _errorMessage != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.error_outline, size: 64, color: AppColors.error.withOpacity(0.5)),
                      const SizedBox(height: 16),
                      Text(
                        _errorMessage!,
                        style: TextStyle(color: AppColors.onSurfaceVariant.withOpacity(0.8)),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _fetchBadges,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : _buildContent(),
    );
  }

  Widget _buildContent() {
    // If we have no badges, show some generic locked ones for visual appeal
    final List<Map<String, dynamic>> displayBadges = [
      ..._badges,
      if (_badges.isEmpty) ...[
        {'badgeType': 'first_login', 'description': 'Log in for the first time', 'earnedAt': DateTime.now().toIso8601String()},
      ],
      {'badgeType': 'streak_7', 'description': 'Achieve a 7-day learning streak', 'isLocked': true},
      {'badgeType': 'perfect_score', 'description': 'Get 100% on a practice test', 'isLocked': true},
      {'badgeType': 'night_owl', 'description': 'Complete a session after 8 PM', 'isLocked': true},
      {'badgeType': 'math_whiz', 'description': 'Master 5 Math topics', 'isLocked': true},
    ];

    return RefreshIndicator(
      onRefresh: _fetchBadges,
      color: AppColors.primary,
      child: GridView.builder(
        padding: const EdgeInsets.all(16),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
          childAspectRatio: 0.85,
        ),
        itemCount: displayBadges.length,
        itemBuilder: (context, index) {
          final badge = displayBadges[index];
          final bool isLocked = badge['isLocked'] == true;
          final String title = _formatBadgeTitle(badge['badgeType'] ?? badge['name'] ?? 'Badge');
          final String desc = badge['description'] ?? '';
          final String? earnedAtStr = badge['earnedAt'];
          
          DateTime? earnedAt;
          if (earnedAtStr != null && !isLocked) {
            try {
              earnedAt = DateTime.parse(earnedAtStr);
            } catch (_) {}
          }

          return _buildBadgeCard(title, desc, earnedAt, isLocked);
        },
      ),
    );
  }

  String _formatBadgeTitle(String type) {
    return type.split('_').map((word) {
      if (word.isEmpty) return word;
      return word[0].toUpperCase() + word.substring(1);
    }).join(' ');
  }

  Widget _buildBadgeCard(String title, String desc, DateTime? earnedAt, bool isLocked) {
    final color = isLocked ? Colors.grey.shade400 : AppColors.accent;
    final bgColor = isLocked ? Colors.grey.shade100 : Colors.white;
    final borderColor = isLocked ? Colors.transparent : AppColors.accent.withOpacity(0.3);

    return Container(
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: borderColor, width: 2),
        boxShadow: isLocked
            ? []
            : [
                BoxShadow(
                  color: AppColors.accent.withOpacity(0.15),
                  blurRadius: 15,
                  offset: const Offset(0, 8),
                )
              ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: isLocked ? Colors.grey.shade300 : AppColors.accent.withOpacity(0.15),
            ),
            child: Icon(
              isLocked ? Icons.lock_rounded : Icons.emoji_events_rounded,
              color: color,
              size: 40,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            title,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 16,
              color: isLocked ? Colors.grey.shade600 : AppColors.onSurface,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
          if (!isLocked && earnedAt != null)
            Text(
              DateFormat('MMM d, yyyy').format(earnedAt),
              style: const TextStyle(
                fontSize: 11,
                color: AppColors.primary,
                fontWeight: FontWeight.w600,
              ),
            )
          else if (desc.isNotEmpty)
            Text(
              desc,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 11,
                color: Colors.grey.shade600,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
        ],
      ),
    );
  }
}
