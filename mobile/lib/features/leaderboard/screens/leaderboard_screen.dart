import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants.dart';
import '../../../core/theme/app_colors.dart';

class LeaderboardScreen extends StatefulWidget {
  const LeaderboardScreen({super.key});

  @override
  State<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends State<LeaderboardScreen> {
  final ApiClient _apiClient = ApiClient();
  List<dynamic> _entries = [];
  bool _isLoading = true;
  String _filter = 'global';

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  Future<void> _fetch() async {
    setState(() => _isLoading = true);
    try {
      final uri = _filter == 'global' ? AppConstants.leaderboardGlobal : AppConstants.leaderboardGlobal;
      final res = await _apiClient.dio.get(uri, queryParameters: {'limit': 50});
      if (res.statusCode == 200 && mounted) {
        setState(() {
          _entries = (res.data as List?) ?? [];
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Leaderboard'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
        actions: [IconButton(icon: const Icon(Icons.refresh_rounded), onPressed: _fetch)],
      ),
      body: Column(
        children: [
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
            child: Row(
              children: ['global', 'grade', 'subject'].map((f) {
                final active = _filter == f;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(f[0].toUpperCase() + f.substring(1),
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600,
                        color: active ? Colors.white : AppColors.onSurfaceVariant)),
                    selected: active,
                    selectedColor: AppColors.primary,
                    backgroundColor: Colors.grey[100],
                    onSelected: (_) => setState(() { _filter = f; _fetch(); }),
                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    visualDensity: VisualDensity.compact,
                  ),
                );
              }).toList(),
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _entries.isEmpty
                    ? Center(child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.emoji_events_outlined, size: 72, color: AppColors.primary.withValues(alpha: 0.3)),
                          const SizedBox(height: 16),
                          const Text('No rankings yet', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                        ],
                      ))
                    : RefreshIndicator(
                        onRefresh: _fetch,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _entries.length,
                          itemBuilder: (_, i) => _buildRow(i, _entries[i]),
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildRow(int index, dynamic entry) {
    final rank = entry['rank'] ?? (index + 1);
    final name = entry['userName'] as String? ?? 'Student';
    final xp = entry['xpPoints'] as int? ?? 0;
    final level = entry['level'] as int? ?? 1;
    final streak = entry['streakDays'] as int? ?? 0;
    final isTop3 = index < 3;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      elevation: isTop3 ? 2 : 0,
      color: isTop3 ? [Colors.amber[50], Colors.grey[100], Colors.brown[50]][index] : Colors.white,
      child: ListTile(
        leading: CircleAvatar(
          radius: 20,
          backgroundColor: isTop3 ? [Colors.amber, Colors.grey, Colors.brown][index] : Colors.grey[200],
          child: Text('$rank', style: TextStyle(fontWeight: FontWeight.bold, color: isTop3 ? Colors.white : Colors.grey[600])),
        ),
        title: Text(name, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Row(
          children: [
            Icon(Icons.stars_rounded, size: 14, color: Colors.amber[600]),
            const SizedBox(width: 4),
            Text('Lv $level', style: TextStyle(fontSize: 12, color: Colors.amber[700])),
            const SizedBox(width: 12),
            Icon(Icons.local_fire_department_rounded, size: 14, color: Colors.orange[400]),
            const SizedBox(width: 4),
            Text('$streak day streak', style: TextStyle(fontSize: 12, color: Colors.orange[600])),
          ],
        ),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Text('$xp XP', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary)),
        ),
      ),
    );
  }
}
