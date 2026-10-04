import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../services/tutor_service.dart';

class TutorSessionsScreen extends StatefulWidget {
  const TutorSessionsScreen({super.key});

  @override
  State<TutorSessionsScreen> createState() => _TutorSessionsScreenState();
}

class _TutorSessionsScreenState extends State<TutorSessionsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TutorService _service = TutorService();
  bool _isLoading = false;

  final Map<int, List<dynamic>> _sessions = {0: [], 1: [], 2: []};
  final Map<int, String> _statusFilters = {0: 'scheduled', 1: 'in_progress', 2: 'completed'};

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) _loadTab(_tabController.index);
    });
    _loadTab(0);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadTab(int index) async {
    setState(() => _isLoading = true);
    try {
      final data = await _service.getSessions(status: _statusFilters[index]);
      if (mounted) {
        setState(() {
          _sessions[index] = data;
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
        title: const Text('My Sessions'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppColors.primary,
          unselectedLabelColor: Colors.grey,
          indicatorColor: AppColors.primary,
          tabs: const [
            Tab(text: 'Upcoming', icon: Icon(Icons.schedule_rounded, size: 18)),
            Tab(text: 'In Progress', icon: Icon(Icons.play_circle_rounded, size: 18)),
            Tab(text: 'Completed', icon: Icon(Icons.check_circle_rounded, size: 18)),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: List.generate(3, (i) => _buildTabContent(i)),
      ),
    );
  }

  Widget _buildTabContent(int index) {
    final items = _sessions[index] ?? [];

    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (items.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              index == 0 ? Icons.event_available_rounded
                  : index == 1 ? Icons.play_circle_outline_rounded
                  : Icons.inbox_rounded,
              size: 64, color: Colors.grey[300],
            ),
            const SizedBox(height: 16),
            Text(
              index == 0 ? 'No upcoming sessions'
                  : index == 1 ? 'No active sessions'
                  : 'No completed sessions',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.grey),
            ),
            const SizedBox(height: 8),
            Text(
              index == 0 ? 'Confirmed bookings will appear here.'
                  : index == 1 ? 'Start a session to see it here.'
                  : 'Finished sessions will appear here.',
              style: TextStyle(fontSize: 13, color: Colors.grey[400]),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => _loadTab(index),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: items.length,
        itemBuilder: (_, i) => _buildSessionCard(items[i], index),
      ),
    );
  }

  Widget _buildSessionCard(dynamic session, int tabIndex) {
    final student = session['student'] as Map<String, dynamic>? ?? {};
    final studentName = '${student['firstName'] ?? ''} ${student['lastName'] ?? ''}'.trim();
    final subject = session['subjectName'] as String? ?? 'General';
    final startStr = session['startTime'] as String? ?? '';
    final price = (session['price'] is num) ? (session['price'] as num).toDouble() : 0.0;
    final id = session['id'] as String? ?? '';
    final notes = session['notes'] as String?;
    final paymentStatus = session['paymentStatus'] as String?;

    final startTime = DateTime.tryParse(startStr);
    final timeStr = startTime != null ? DateFormat('MMM d, yyyy · h:mm a').format(startTime) : startStr;

    String statusLabel;
    Color statusColor;
    switch (tabIndex) {
      case 0:
        statusLabel = 'Scheduled';
        statusColor = Colors.blue;
        break;
      case 1:
        statusLabel = 'In Progress';
        statusColor = Colors.green;
        break;
      default:
        statusLabel = 'Completed';
        statusColor = Colors.grey;
        break;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () {
          if (tabIndex == 1) {
            context.push('/tutor/session/$id', extra: {'sessionId': id, 'role': 'tutor'});
          } else {
            context.push('/tutor/sessions/$id');
          }
        },
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 24,
                  backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                  child: Text(studentName.isNotEmpty ? studentName[0].toUpperCase() : '?',
                    style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(studentName.isNotEmpty ? studentName : 'Student',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                      Text(subject, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(statusLabel,
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: statusColor)),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Icon(Icons.access_time_rounded, size: 14, color: Colors.grey[500]),
                const SizedBox(width: 6),
                Text(timeStr, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                const Spacer(),
                Text('KSh ${price.toStringAsFixed(0)}',
                  style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary, fontSize: 13)),
              ],
            ),
            if (tabIndex == 2 && paymentStatus != null) ...[
              const SizedBox(height: 6),
              Row(
                children: [
                  Icon(Icons.payment_rounded, size: 14, color: paymentStatus == 'paid' ? Colors.green : Colors.orange),
                  const SizedBox(width: 6),
                  Text(paymentStatus == 'paid' ? 'Payment received' : 'Payment pending',
                    style: TextStyle(fontSize: 11, color: paymentStatus == 'paid' ? Colors.green : Colors.orange)),
                  if (notes != null && notes.isNotEmpty) ...[
                    const Spacer(),
                    GestureDetector(
                      onTap: () => _showNotes(notes),
                      child: Text('View notes', style: TextStyle(fontSize: 11, color: AppColors.primary, fontWeight: FontWeight.w600)),
                    ),
                  ],
                ],
              ),
            ],
            if (tabIndex == 0 || tabIndex == 1) ...[
              const SizedBox(height: 14),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  if (tabIndex == 0)
                    ElevatedButton.icon(
                      onPressed: () => _startSession(id),
                      icon: const Icon(Icons.play_arrow_rounded, size: 18),
                      label: const Text('Start'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  if (tabIndex == 1)
                    ElevatedButton.icon(
                      onPressed: () => _endSession(id),
                      icon: const Icon(Icons.stop_rounded, size: 18),
                      label: const Text('End Session'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  void _showNotes(String notes) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Session Notes'),
        content: Text(notes),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Close')),
        ],
      ),
    );
  }

  Future<void> _startSession(String id) async {
    try {
      await _service.startSession(id);
      if (mounted) {
        context.push('/tutor/session/$id', extra: {'sessionId': id, 'role': 'tutor'});
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to start session'), backgroundColor: Colors.red),
        );
      }
    }
  }

  Future<void> _endSession(String id) async {
    final reason = await showDialog<String>(
      context: context,
      builder: (ctx) {
        final controller = TextEditingController();
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Text('End Session'),
          content: TextField(
            controller: controller,
            maxLines: 3,
            decoration: const InputDecoration(
              hintText: 'Session notes (optional)',
              border: OutlineInputBorder(),
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx, controller.text),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
              child: const Text('End', style: TextStyle(color: Colors.white)),
            ),
          ],
        );
      },
    );

    if (reason != null && mounted) {
      try {
        await _service.endSession(id, notes: reason);
        _loadTab(_tabController.index);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Session ended'), backgroundColor: Colors.green),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Failed to end session'), backgroundColor: Colors.red),
          );
        }
      }
    }
  }
}
