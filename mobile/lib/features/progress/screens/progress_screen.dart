import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants.dart';
import '../../../core/theme/app_colors.dart';
import 'package:intl/intl.dart';

class ProgressScreen extends StatefulWidget {
  const ProgressScreen({super.key});

  @override
  State<ProgressScreen> createState() => _ProgressScreenState();
}

class _ProgressScreenState extends State<ProgressScreen> {
  final ApiClient _apiClient = ApiClient();
  Map<String, dynamic>? _stats;
  Map<String, dynamic>? _dashboard;
  Map<String, dynamic>? _streak;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  Future<void> _fetch() async {
    setState(() => _isLoading = true);
    try {
      final results = await Future.wait([
        _apiClient.dio.get(AppConstants.stats),
        _apiClient.dio.get(AppConstants.dashboard),
        _apiClient.dio.get(AppConstants.streak),
      ]);
      if (mounted) {
        setState(() {
          _stats = results[0].data as Map<String, dynamic>?;
          _dashboard = results[1].data as Map<String, dynamic>?;
          _streak = results[2].data as Map<String, dynamic>?;
          _isLoading = false;
        });
      }
    } catch (_) {
      // Try with just stats and dashboard (streak is optional)
      try {
        final results = await Future.wait([
          _apiClient.dio.get(AppConstants.stats),
          _apiClient.dio.get(AppConstants.dashboard),
        ]);
        if (mounted) {
          setState(() {
            _stats = results[0].data as Map<String, dynamic>?;
            _dashboard = results[1].data as Map<String, dynamic>?;
            _isLoading = false;
          });
        }
      } catch (_) {
        if (mounted) setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('My Progress'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
        actions: [IconButton(icon: const Icon(Icons.refresh_rounded), onPressed: _fetch)],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _fetch,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  _buildStreakBanner(),
                  const SizedBox(height: 16),
                  _buildStatsGrid(),
                  const SizedBox(height: 20),
                  if (_dashboard != null) ...[
                    if (_dashboard!['weakAreas'] is List && (_dashboard!['weakAreas'] as List).isNotEmpty) ...[
                      _sectionHeader('Weak Areas'),
                      ...(_dashboard!['weakAreas'] as List).map<Widget>((w) => _buildWeakArea(w)),
                      const SizedBox(height: 20),
                    ],
                    if (_dashboard!['recentActivities'] is List && (_dashboard!['recentActivities'] as List).isNotEmpty) ...[
                      _sectionHeader('Recent Activity'),
                      ...(_dashboard!['recentActivities'] as List).map<Widget>((a) => _buildActivity(a)),
                    ],
                  ],
                ],
              ),
            ),
    );
  }

  Widget _sectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
    );
  }

  Widget _buildStreakBanner() {
    final streakData = _streak;
    final currentStreak = streakData?['currentStreak'] as int? ?? _dashboard?['streak'] as int? ?? 0;
    final isAtRisk = streakData?['isAtRisk'] == true;
    final isBroken = streakData?['isBroken'] == true;
    final daysSinceLastActive = streakData?['daysSinceLastActive'] as int? ?? 0;
    final lastActiveStr = streakData?['lastActiveDate'] as String?;

    if (currentStreak == 0) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: LinearGradient(colors: [Colors.grey[400]!, Colors.grey[600]!]),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Row(
          children: [
            const Icon(Icons.local_fire_department_rounded, color: Colors.white38, size: 28),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('No Streak Yet', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                  const SizedBox(height: 2),
                  Text('Complete a practice session to start your streak!',
                    style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.8))),
                ],
              ),
            ),
          ],
        ),
      );
    }

    MaterialColor bannerColor;
    IconData bannerIcon;
    String bannerTitle;
    String bannerSubtitle;

    if (isBroken) {
      bannerColor = Colors.red;
      bannerIcon = Icons.broken_image_rounded;
      bannerTitle = 'Streak Broken!';
      bannerSubtitle = 'You missed $daysSinceLastActive day(s). Start a new streak today!';
    } else if (isAtRisk) {
      bannerColor = Colors.orange;
      bannerIcon = Icons.warning_amber_rounded;
      bannerTitle = '$currentStreak-day Streak at Risk!';
      bannerSubtitle = 'Study today to keep your streak alive!';
    } else {
      bannerColor = Colors.green;
      bannerIcon = Icons.local_fire_department_rounded;
      bannerTitle = '$currentStreak-day Streak!';
      bannerSubtitle = 'Great job! Keep it going!';
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: [bannerColor[400]!, bannerColor[600]!]),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          Icon(bannerIcon, color: Colors.white, size: 32),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(bannerTitle, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                if (lastActiveStr != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text('Last active: ${DateFormat('MMM d, yyyy').format(DateTime.parse(lastActiveStr))}',
                      style: TextStyle(fontSize: 11, color: Colors.white.withValues(alpha: 0.8))),
                  ),
                const SizedBox(height: 2),
                Text(bannerSubtitle, style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.9))),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsGrid() {
    final s = _stats;

    return Column(
      children: [
        Row(
          children: [
            Expanded(child: _statCard('Sessions', '${s?['totalSessions'] ?? 0}', Icons.play_circle_rounded, Colors.indigo)),
            const SizedBox(width: 8),
            Expanded(child: _statCard('Score', '${s?['averageScore'] ?? 0}%', Icons.trending_up_rounded, Colors.green)),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(child: _statCard('Correct', '${s?['totalCorrect'] ?? 0}', Icons.check_circle_rounded, Colors.green)),
            const SizedBox(width: 8),
            Expanded(child: _statCard('Time', '${s?['totalTimeMinutes'] ?? 0}m', Icons.access_time_rounded, Colors.blue)),
          ],
        ),
      ],
    );
  }

  Widget _statCard(String label, String value, IconData icon, MaterialColor color) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(8)),
                child: Icon(icon, size: 16, color: color),
              ),
              const Spacer(),
              Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color.shade700)),
            ],
          ),
          const SizedBox(height: 4),
          Text(label, style: TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant)),
        ],
      ),
    );
  }

  Widget _buildWeakArea(dynamic w) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      elevation: 0,
      color: Colors.red.withValues(alpha: 0.04),
      child: ListTile(
        leading: const Icon(Icons.warning_amber_rounded, color: Colors.red),
        title: Text('Topic area', style: TextStyle(fontSize: 13, color: Colors.grey[700])),
        subtitle: Text('${w['successRate'] ?? 0}% success rate', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.red)),
        trailing: Text('${w['totalAttempts'] ?? 0} attempts', style: TextStyle(fontSize: 11, color: Colors.grey[500])),
      ),
    );
  }

  Widget _buildActivity(dynamic a) {
    final subject = a['subject'] as String? ?? '';
    final topic = a['topic'] as String? ?? '';
    final score = a['score'];
    final questionsAttempted = a['questionsAttempted'] as int? ?? 0;
    final correctAnswers = a['correctAnswers'] as int? ?? 0;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      elevation: 0,
      color: Colors.white,
      child: ListTile(
        leading: Container(
          width: 40, height: 40,
          decoration: BoxDecoration(
            color: Colors.green.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(Icons.check_circle_rounded, color: Colors.green[600], size: 20),
        ),
        title: Text('$subject - $topic', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
        subtitle: Text('$correctAnswers/$questionsAttempted correct', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
        trailing: score != null
            ? Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: (score >= 50 ? Colors.green : Colors.red).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text('$score%', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12,
                  color: score >= 50 ? Colors.green : Colors.red)),
              )
            : null,
      ),
    );
  }
}
