import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants.dart';
import '../../../core/theme/app_colors.dart';

class TeachersScreen extends StatefulWidget {
  const TeachersScreen({super.key});

  @override
  State<TeachersScreen> createState() => _TeachersScreenState();
}

class _TeachersScreenState extends State<TeachersScreen> {
  final ApiClient _apiClient = ApiClient();
  List<dynamic> _tutors = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  Future<void> _fetch() async {
    setState(() => _isLoading = true);
    try {
      final res = await _apiClient.dio.get(AppConstants.tutors, queryParameters: {'limit': 50});
      if (res.statusCode == 200 && mounted) {
        final data = res.data;
        final tutors = (data is List) ? data : ((data['tutors'] as List?) ?? (data['data'] as List?) ?? []);
        setState(() { _tutors = tutors; _isLoading = false; });
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
        title: const Text('Teachers & Tutors'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
        actions: [IconButton(icon: const Icon(Icons.refresh_rounded), onPressed: _fetch)],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _tutors.isEmpty
              ? Center(child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.people_outline_rounded, size: 72, color: AppColors.primary.withValues(alpha: 0.3)),
                    const SizedBox(height: 16),
                    const Text('No tutors found', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Text('Approved tutors will appear here.',
                      style: TextStyle(color: AppColors.onSurfaceVariant), textAlign: TextAlign.center),
                  ],
                ))
              : RefreshIndicator(
                  onRefresh: _fetch,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _tutors.length,
                    itemBuilder: (_, i) => _buildCard(_tutors[i]),
                  ),
                ),
    );
  }

  Widget _buildCard(dynamic t) {
    final user = t['user'] as Map<String, dynamic>? ?? {};
    final name = '${user['firstName'] ?? ''} ${user['lastName'] ?? ''}'.trim();
    final headline = t['headline'] as String? ?? '';
    final bio = t['bio'] as String? ?? '';
    final rating = t['rating'];
    final totalStudents = t['totalStudents'] as int? ?? 0;
    final totalSessions = t['totalSessions'] as int? ?? 0;
    final subjects = t['subjects'] as List? ?? [];
    final grades = t['teachingGrades'] as List? ?? [];
    final profilePic = t['profilePicture'] as String? ?? user['avatar'] as String?;
    final isOnline = t['isAvailableForOnline'] == true;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 1,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 28,
                  backgroundImage: profilePic != null && profilePic.isNotEmpty
                      ? NetworkImage(profilePic) : null,
                  backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                  child: !(profilePic != null && profilePic.isNotEmpty)
                      ? Text(name.isNotEmpty ? name[0].toUpperCase() : '?',
                          style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary))
                      : null,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      if (headline.isNotEmpty)
                        Text(headline, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                    ],
                  ),
                ),
                if (isOnline)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(color: Colors.green.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(6)),
                    child: const Text('Online', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.green)),
                  ),
              ],
            ),
            if (bio.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(bio, maxLines: 2, overflow: TextOverflow.ellipsis,
                style: TextStyle(fontSize: 13, color: Colors.grey[700])),
            ],
            if (subjects.isNotEmpty || grades.isNotEmpty) ...[
              const SizedBox(height: 10),
              Wrap(
                spacing: 6, runSpacing: 4,
                children: [
                  ...subjects.take(3).map<Widget>((s) {
                    final name = s is String ? s : (s['subjectName'] as String? ?? '');
                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(6)),
                      child: Text(name, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.primary)),
                    );
                  }),
                  ...grades.map<Widget>((g) => Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(color: Colors.amber.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(6)),
                    child: Text('Grade $g', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.amber.shade700)),
                  )),
                ],
              ),
            ],
            const SizedBox(height: 10),
            Row(
              children: [
                if (rating != null) ...[
                  Icon(Icons.star_rounded, size: 16, color: Colors.amber[600]),
                  Text('$rating', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.amber[700])),
                  const SizedBox(width: 12),
                ],
                if (totalStudents > 0)
                  Text('$totalStudents students', style: TextStyle(fontSize: 11, color: Colors.grey[500])),
                if (totalSessions > 0) ...[
                  const SizedBox(width: 8),
                  Text('$totalSessions sessions', style: TextStyle(fontSize: 11, color: Colors.grey[500])),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}
