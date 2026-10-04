import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants.dart';
import '../../../core/theme/app_colors.dart';

class ScheduleScreen extends StatefulWidget {
  const ScheduleScreen({super.key});

  @override
  State<ScheduleScreen> createState() => _ScheduleScreenState();
}

class _ScheduleScreenState extends State<ScheduleScreen> {
  final ApiClient _apiClient = ApiClient();
  List<dynamic> _timetable = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  Future<void> _fetch() async {
    setState(() => _isLoading = true);
    try {
      final res = await _apiClient.dio.get(AppConstants.timetable);
      if (res.statusCode == 200 && mounted) {
        final data = res.data;
        final timetable = (data is List) ? data : ((data['timetable'] as List?) ?? (data['data'] as List?) ?? []);
        setState(() { _timetable = timetable; _isLoading = false; });
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
        title: const Text('My Schedule'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
        actions: [IconButton(icon: const Icon(Icons.refresh_rounded), onPressed: _fetch)],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _timetable.isEmpty
              ? Center(child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.calendar_month_outlined, size: 72, color: AppColors.primary.withValues(alpha: 0.3)),
                    const SizedBox(height: 16),
                    const Text('No schedule yet', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Text('Your weekly timetable will appear here.',
                      style: TextStyle(color: AppColors.onSurfaceVariant), textAlign: TextAlign.center),
                  ],
                ))
              : RefreshIndicator(
                  onRefresh: _fetch,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _timetable.length,
                    itemBuilder: (_, i) => _buildDay(_timetable[i]),
                  ),
                ),
    );
  }

  Widget _buildDay(dynamic day) {
    final dayName = day['day'] as String? ?? '';
    final lessons = day['lessons'] as List? ?? [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          margin: const EdgeInsets.only(bottom: 8, top: 8),
          decoration: BoxDecoration(
            color: AppColors.primary,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              Text(dayName.toUpperCase(),
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white)),
              const Spacer(),
              Text('${lessons.length} lesson(s)', style: TextStyle(fontSize: 11, color: Colors.white.withValues(alpha: 0.8))),
            ],
          ),
        ),
        if (lessons.isEmpty)
          Container(
            padding: const EdgeInsets.all(16),
            margin: const EdgeInsets.only(bottom: 8),
            child: Center(child: Text('No lessons', style: TextStyle(color: Colors.grey[400]))),
          )
        else
          ...lessons.map<Widget>((l) => _buildLesson(l)),
      ],
    );
  }

  Widget _buildLesson(dynamic l) {
    final id = l['id'] as String? ?? '';
    final title = l['title'] as String? ?? 'Lesson';
    final subject = l['subject'] as String? ?? '';
    final startTime = l['startTime'] as String? ?? '';
    final endTime = l['endTime'] as String? ?? '';
    final teacher = l['teacher'] as Map<String, dynamic>?;
    final teacherName = teacher != null ? '${teacher['firstName'] ?? ''} ${teacher['lastName'] ?? ''}' : '';
    final isLive = l['isLive'] == true;
    final status = l['status'] as String? ?? 'scheduled';
    final isOngoing = status == 'ongoing';

    return GestureDetector(
      onTap: () {
        if (!isOngoing && !isLive) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('This lesson is not ongoing. Scheduled: $startTime - $endTime'),
              backgroundColor: Colors.orange),
          );
          return;
        }
        context.push('/live/meeting', extra: {
          'roomId': id,
          'roomName': title,
          'hostName': teacherName,
        });
      },
      child: Card(
        margin: const EdgeInsets.only(bottom: 6),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        elevation: isOngoing ? 2 : 0,
        color: Colors.white,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Container(
                width: 4, height: 48,
                decoration: BoxDecoration(
                  color: isLive || isOngoing ? Colors.red : AppColors.primary,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    if (subject.isNotEmpty)
                      Text(subject, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                    Row(
                      children: [
                        Icon(Icons.access_time_rounded, size: 12, color: Colors.grey[400]),
                        const SizedBox(width: 4),
                        Text('$startTime - $endTime', style: TextStyle(fontSize: 11, color: Colors.grey[500])),
                        if (teacherName.isNotEmpty) ...[
                          const SizedBox(width: 8),
                          Icon(Icons.person_rounded, size: 12, color: Colors.grey[400]),
                          const SizedBox(width: 4),
                          Text(teacherName, style: TextStyle(fontSize: 11, color: Colors.grey[500])),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
              if (isOngoing)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(color: Colors.green.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(6)),
                  child: const Text('LIVE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.green)),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
