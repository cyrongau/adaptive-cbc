import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants.dart';
import '../../../core/theme/app_colors.dart';

class AssignmentsScreen extends StatefulWidget {
  const AssignmentsScreen({super.key});

  @override
  State<AssignmentsScreen> createState() => _AssignmentsScreenState();
}

class _AssignmentsScreenState extends State<AssignmentsScreen> {
  final ApiClient _apiClient = ApiClient();
  List<dynamic> _assignments = [];
  bool _isLoading = true;

  String _statusFilter = 'all';

  @override
  void initState() {
    super.initState();
    _fetchAssignments();
  }

  Future<void> _fetchAssignments() async {
    setState(() => _isLoading = true);
    try {
      final res = await _apiClient.dio.get('${AppConstants.assignments}/student');
      if (res.statusCode == 200 && mounted) {
        setState(() {
          _assignments = res.data as List? ?? [];
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => _isLoading = false);
        _showError('Failed to load assignments');
      }
    }
  }

  void _showError(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: Colors.red));
  }

  List<dynamic> get _filteredAssignments {
    if (_statusFilter == 'all') return _assignments;
    return _assignments.where((a) {
      final status = _getStatus(a);
      return status == _statusFilter;
    }).toList();
  }

  String _getStatus(dynamic assignment) {
    final submitted = assignment['submitted'] == true;
    final graded = assignment['grade'] != null;
    final dueDate = assignment['dueDate'] as String?;
    if (graded) return 'graded';
    if (submitted) return 'submitted';
    if (dueDate != null) {
      final due = DateTime.tryParse(dueDate);
      if (due != null && due.isBefore(DateTime.now())) return 'overdue';
    }
    return 'pending';
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'graded': return 'Graded';
      case 'submitted': return 'Submitted';
      case 'overdue': return 'Overdue';
      default: return 'Pending';
    }
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'graded': return Colors.green;
      case 'submitted': return Colors.blue;
      case 'overdue': return Colors.red;
      default: return Colors.orange;
    }
  }

  IconData _statusIcon(String status) {
    switch (status) {
      case 'graded': return Icons.check_circle_rounded;
      case 'submitted': return Icons.hourglass_top_rounded;
      case 'overdue': return Icons.warning_rounded;
      default: return Icons.schedule_rounded;
    }
  }

  @override
  Widget build(BuildContext context) {
    final statuses = ['all', 'pending', 'submitted', 'graded', 'overdue'];

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Assignments'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
        actions: [
          IconButton(icon: const Icon(Icons.refresh_rounded), onPressed: _fetchAssignments),
        ],
      ),
      body: Column(
        children: [
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: SizedBox(
              height: 36,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                children: statuses.map((s) {
                  final active = _statusFilter == s;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(_statusLabel(s),
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600,
                          color: active ? Colors.white : AppColors.onSurfaceVariant)),
                      selected: active,
                      selectedColor: AppColors.primary,
                      backgroundColor: Colors.grey[100],
                      onSelected: (val) => setState(() => _statusFilter = s),
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      visualDensity: VisualDensity.compact,
                    ),
                  );
                }).toList(),
              ),
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _assignments.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.assignment_outlined, size: 72, color: AppColors.primary.withValues(alpha: 0.3)),
                            const SizedBox(height: 16),
                            const Text('No assignments yet',
                              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 8),
                            Text('Check back when your teacher assigns something.',
                              style: TextStyle(color: AppColors.onSurfaceVariant), textAlign: TextAlign.center),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _fetchAssignments,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _filteredAssignments.length,
                          itemBuilder: (ctx, i) => _buildCard(_filteredAssignments[i]),
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildCard(dynamic assignment) {
    final status = _getStatus(assignment);
    final title = assignment['title'] as String? ?? 'Untitled';
    final subject = assignment['subject'] != null
        ? (assignment['subject'] is Map ? assignment['subject']['name'] : assignment['subject'])
        : (assignment['subjectName'] as String? ?? 'General');
    final dueDate = assignment['dueDate'] as String?;
    final grade = assignment['grade'];
    final questionsCount = assignment['questions'] is List ? (assignment['questions'] as List).length
        : (assignment['questionCount'] as int? ?? 0);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 1,
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => context.push('/assignments/${assignment['id']}'),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: _statusColor(status).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(_statusIcon(status), size: 14, color: _statusColor(status)),
                        const SizedBox(width: 4),
                        Text(_statusLabel(status),
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: _statusColor(status))),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  if (grade != null)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.green.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text('$grade%',
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.green)),
                    ),
                ],
              ),
              const SizedBox(height: 12),
              Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              Row(
                children: [
                  Icon(Icons.book_rounded, size: 14, color: AppColors.onSurfaceVariant),
                  const SizedBox(width: 4),
                  Text(subject, style: TextStyle(fontSize: 13, color: AppColors.onSurfaceVariant)),
                  const SizedBox(width: 16),
                  Icon(Icons.quiz_outlined, size: 14, color: AppColors.onSurfaceVariant),
                  const SizedBox(width: 4),
                  Text('$questionsCount questions', style: TextStyle(fontSize: 13, color: AppColors.onSurfaceVariant)),
                ],
              ),
              if (dueDate != null) ...[
                const SizedBox(height: 6),
                Row(
                  children: [
                    Icon(Icons.calendar_today_rounded, size: 14, color: AppColors.onSurfaceVariant),
                    const SizedBox(width: 4),
                    Text('Due: ${_formatDate(dueDate)}',
                      style: TextStyle(fontSize: 13, color: status == 'overdue' ? Colors.red : AppColors.onSurfaceVariant)),
                  ],
                ),
              ],
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Text('View Details', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.primary)),
                  Icon(Icons.chevron_right_rounded, size: 18, color: AppColors.primary),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatDate(String dateStr) {
    final dt = DateTime.tryParse(dateStr);
    if (dt == null) return dateStr;
    final months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return '${dt.day} ${months[dt.month - 1]} ${dt.year}';
  }
}
