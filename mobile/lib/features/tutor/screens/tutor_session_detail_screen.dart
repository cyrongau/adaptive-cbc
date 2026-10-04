import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../services/tutor_service.dart';

class TutorSessionDetailScreen extends StatefulWidget {
  final String sessionId;

  const TutorSessionDetailScreen({super.key, required this.sessionId});

  @override
  State<TutorSessionDetailScreen> createState() => _TutorSessionDetailScreenState();
}

class _TutorSessionDetailScreenState extends State<TutorSessionDetailScreen> {
  final TutorService _service = TutorService();
  Map<String, dynamic>? _session;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await _service.getSession(widget.sessionId);
      if (mounted) setState(() { _session = data; _isLoading = false; });
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Session Details'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _session == null
              ? const Center(child: Text('Session not found'))
              : _buildContent(),
    );
  }

  Widget _buildContent() {
    final s = _session!;
    final student = s['student'] as Map<String, dynamic>? ?? {};
    final studentName = '${student['firstName'] ?? ''} ${student['lastName'] ?? ''}'.trim();
    final subject = s['subjectName'] as String? ?? 'General';
    final price = (s['price'] is num) ? (s['price'] as num).toDouble() : 0.0;
    final tutorEarnings = (s['tutorEarnings'] is num) ? (s['tutorEarnings'] as num).toDouble() : 0.0;
    final status = s['status'] as String? ?? 'unknown';
    final startStr = s['startTime'] as String? ?? '';
    final endStr = s['endTime'] as String? ?? '';
    final notes = s['notes'] as String?;

    final startTime = DateTime.tryParse(startStr);
    final endTime = DateTime.tryParse(endStr);
    final dateStr = startTime != null ? DateFormat('EEEE, MMM d, yyyy').format(startTime) : '';
    final startTimeStr = startTime != null ? DateFormat('h:mm a').format(startTime) : '';
    final endTimeStr = endTime != null ? DateFormat('h:mm a').format(endTime) : '';
    final duration = startTime != null && endTime != null
        ? '${endTime.difference(startTime).inMinutes} minutes'
        : '${s['durationMinutes'] ?? 60} min';

    final statusColor = status == 'completed'
        ? Colors.green
        : status == 'in_progress'
            ? Colors.blue
            : status == 'scheduled'
                ? Colors.orange
                : Colors.grey;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          _sectionCard(
            children: [
              Row(
                children: [
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                    child: Text(studentName.isNotEmpty ? studentName[0].toUpperCase() : '?',
                      style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary, fontSize: 22)),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(studentName.isNotEmpty ? studentName : 'Student',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 17)),
                        Text(subject, style: TextStyle(fontSize: 13, color: Colors.grey[600])),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: statusColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(status.replaceAll('_', ' ').toUpperCase(),
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: statusColor)),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          _sectionCard(
            title: 'Date & Time',
            children: [
              _infoRow(Icons.calendar_today_rounded, 'Date', dateStr),
              if (startTimeStr.isNotEmpty) _infoRow(Icons.access_time_rounded, 'Start', startTimeStr),
              if (endTimeStr.isNotEmpty) _infoRow(Icons.access_time_rounded, 'End', endTimeStr),
              _infoRow(Icons.timer_outlined, 'Duration', duration),
            ],
          ),
          const SizedBox(height: 16),
          _sectionCard(
            title: 'Payment',
            children: [
              _infoRow(Icons.attach_money_rounded, 'Total', 'KSh ${price.toStringAsFixed(2)}'),
              _infoRow(Icons.trending_down_rounded, 'Your Earnings', 'KSh ${tutorEarnings.toStringAsFixed(2)}'),
              _infoRow(Icons.percent_rounded, 'Commission', '20%'),
            ],
          ),
          if (notes != null && notes.isNotEmpty) ...[
            const SizedBox(height: 16),
            _sectionCard(
              title: 'Notes',
              children: [
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.grey[50],
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(notes, style: TextStyle(fontSize: 13, color: Colors.grey[700], height: 1.4)),
                ),
              ],
            ),
          ],
          if (s['review'] != null) ...[
            const SizedBox(height: 16),
            _sectionCard(
              title: 'Review',
              children: [
                _reviewSection(s['review'] as Map<String, dynamic>),
              ],
            ),
          ],
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _sectionCard({String? title, required List<Widget> children}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (title != null) ...[
            Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
            const SizedBox(height: 12),
          ],
          ...children,
        ],
      ),
    );
  }

  Widget _infoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        children: [
          Icon(icon, size: 16, color: Colors.grey[500]),
          const SizedBox(width: 10),
          Text('$label:', style: TextStyle(fontSize: 13, color: Colors.grey[600])),
          const Spacer(),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
        ],
      ),
    );
  }

  Widget _reviewSection(Map<String, dynamic> review) {
    final rating = (review['rating'] is num) ? (review['rating'] as num).toDouble() : 0.0;
    final comment = review['comment'] as String? ?? '';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            ...List.generate(5, (i) => Icon(
              i < rating.round() ? Icons.star_rounded : Icons.star_border_rounded,
              color: Colors.amber, size: 20,
            )),
            const SizedBox(width: 8),
            Text(rating.toStringAsFixed(1), style: TextStyle(fontSize: 13, color: Colors.grey[600])),
          ],
        ),
        if (comment.isNotEmpty) ...[
          const SizedBox(height: 8),
          Text(comment, style: TextStyle(fontSize: 13, color: Colors.grey[700], height: 1.3)),
        ],
      ],
    );
  }
}
