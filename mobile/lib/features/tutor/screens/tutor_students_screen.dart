import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../services/tutor_service.dart';

class TutorStudentsScreen extends StatefulWidget {
  const TutorStudentsScreen({super.key});

  @override
  State<TutorStudentsScreen> createState() => _TutorStudentsScreenState();
}

class _TutorStudentsScreenState extends State<TutorStudentsScreen> {
  final TutorService _service = TutorService();
  bool _isLoading = true;

  List<dynamic> _students = [];
  Map<String, int> _sessionCounts = {};
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      _students = await _service.getMyStudents();
      await _loadSessionCounts();
    } catch (_) {}
    if (mounted) setState(() => _isLoading = false);
  }

  Future<void> _loadSessionCounts() async {
    try {
      final sessions = await _service.getSessions(status: 'completed');
      final counts = <String, int>{};
      for (final s in sessions) {
        final student = s['student'] as Map<String, dynamic>?;
        final id = student?['id'] as String?;
        if (id != null) {
          counts[id] = (counts[id] ?? 0) + 1;
        }
      }
      _sessionCounts = counts;
    } catch (_) {}
  }

  List<dynamic> get _filteredStudents {
    if (_searchQuery.isEmpty) return _students;
    final q = _searchQuery.toLowerCase();
    return _students.where((s) {
      final student = s['student'] as Map<String, dynamic>? ?? {};
      final name = '${student['firstName'] ?? ''} ${student['lastName'] ?? ''}'.trim().toLowerCase();
      return name.contains(q);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('My Students'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.search_rounded),
            onPressed: _showSearch,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _students.isEmpty
              ? _buildEmptyState()
              : RefreshIndicator(
                  onRefresh: _loadData,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _filteredStudents.length,
                    itemBuilder: (_, i) => _buildStudentCard(_filteredStudents[i]),
                  ),
                ),
    );
  }

  void _showSearch() {
    showDialog(
      context: context,
      builder: (ctx) {
        final controller = TextEditingController();
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Text('Search Students'),
          content: TextField(
            controller: controller,
            autofocus: true,
            decoration: InputDecoration(
              hintText: 'Search by name...',
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              prefixIcon: const Icon(Icons.search_rounded),
            ),
            onSubmitted: (v) {
              setState(() => _searchQuery = v);
              Navigator.pop(ctx);
            },
          ),
          actions: [
            TextButton(
              onPressed: () {
                setState(() => _searchQuery = '');
                Navigator.pop(ctx);
              },
              child: const Text('Clear'),
            ),
          ],
        );
      },
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.people_outline_rounded, size: 80, color: Colors.grey[300]),
          const SizedBox(height: 20),
          const Text('No Students Yet', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.grey)),
          const SizedBox(height: 8),
          Text('Students who book your sessions will appear here.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 13, color: Colors.grey[400])),
        ],
      ),
    );
  }

  Widget _buildStudentCard(dynamic rel) {
    final student = rel['student'] as Map<String, dynamic>? ?? {};
    final name = '${student['firstName'] ?? ''} ${student['lastName'] ?? ''}'.trim();
    final email = student['email'] as String? ?? '';
    final avatar = student['avatar'] as String?;
    final enrolledAt = rel['enrolledAt'] as String? ?? '';
    final studentId = student['id'] as String? ?? '';
    final sessionCount = _sessionCounts[studentId] ?? 0;
    final enrolledDate = DateTime.tryParse(enrolledAt);
    final enrolledStr = enrolledDate != null ? DateFormat('MMM d, yyyy').format(enrolledDate) : '';

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => _showStudentDetail(student, sessionCount),
        child: Row(
          children: [
            CircleAvatar(
              radius: 24,
              backgroundColor: AppColors.primary.withValues(alpha: 0.1),
              backgroundImage: avatar != null && avatar.isNotEmpty ? NetworkImage(avatar) : null,
              child: avatar == null || avatar.isEmpty
                  ? Text(name.isNotEmpty ? name[0].toUpperCase() : '?',
                      style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary))
                  : null,
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(name.isNotEmpty ? name : 'Student',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                  if (email.isNotEmpty)
                    Text(email, style: TextStyle(fontSize: 11, color: Colors.grey[500])),
                  if (enrolledStr.isNotEmpty)
                    Row(
                      children: [
                        Icon(Icons.calendar_today_rounded, size: 11, color: Colors.grey[400]),
                        const SizedBox(width: 4),
                        Text('Enrolled $enrolledStr',
                          style: TextStyle(fontSize: 10, color: Colors.grey[400])),
                      ],
                    ),
                ],
              ),
            ),
            Column(
              children: [
                Text('$sessionCount', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.primary)),
                Text('sessions', style: TextStyle(fontSize: 10, color: Colors.grey[500])),
              ],
            ),
            const SizedBox(width: 4),
            Icon(Icons.chevron_right_rounded, color: Colors.grey[400]),
          ],
        ),
      ),
    );
  }

  void _showStudentDetail(Map<String, dynamic> student, int sessionCount) {
    final name = '${student['firstName'] ?? ''} ${student['lastName'] ?? ''}'.trim();
    final email = student['email'] as String? ?? '';
    final avatar = student['avatar'] as String?;
    final grade = student['grade'] as String? ?? 'N/A';
    final studentId = student['id'] as String? ?? '';

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircleAvatar(
              radius: 40,
              backgroundColor: AppColors.primary.withValues(alpha: 0.1),
              backgroundImage: avatar != null && avatar.isNotEmpty ? NetworkImage(avatar) : null,
              child: avatar == null || avatar.isEmpty
                  ? Text(name.isNotEmpty ? name[0].toUpperCase() : '?',
                      style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary, fontSize: 28))
                  : null,
            ),
            const SizedBox(height: 16),
            Text(name.isNotEmpty ? name : 'Student',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20)),
            if (email.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(email, style: TextStyle(fontSize: 14, color: Colors.grey[600])),
            ],
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _detailStat(Icons.school_rounded, 'Sessions', '$sessionCount', Colors.blue),
                _detailStat(Icons.menu_book_rounded, 'Grade', grade, Colors.green),
              ],
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () {
                  Navigator.pop(ctx);
                  _navigateToChat(studentId, name);
                },
                icon: const Icon(Icons.chat_rounded),
                label: const Text('Message Student'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  Widget _detailStat(IconData icon, String label, String value, Color color) {
    return Column(
      children: [
        Icon(icon, color: color, size: 24),
        const SizedBox(height: 6),
        Text(value, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: color)),
        Text(label, style: TextStyle(fontSize: 11, color: Colors.grey[600])),
      ],
    );
  }

  Future<void> _navigateToChat(String userId, String name) async {
    try {
      final apiClient = ApiClient();
      final res = await apiClient.dio.post('/chat/conversations', data: {
        'type': 'direct',
        'participantIds': [userId],
      });
      if (mounted) {
        final convId = res.data['id'] as String? ?? userId;
        context.push('/chat/$convId', extra: {'name': name, 'role': 'student'});
      }
    } catch (_) {
      if (mounted) {
        context.push('/chat/$userId', extra: {'name': name, 'role': 'student'});
      }
    }
  }
}
