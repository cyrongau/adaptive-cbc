import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/tutor_provider.dart';

class TutorDashboardScreen extends StatefulWidget {
  const TutorDashboardScreen({super.key});

  @override
  State<TutorDashboardScreen> createState() => _TutorDashboardScreenState();
}

class _TutorDashboardScreenState extends State<TutorDashboardScreen> {
  final ApiClient _apiClient = ApiClient();
  Map<String, dynamic>? _stats;
  List<dynamic> _upcomingSessions = [];
  List<dynamic> _pendingBookings = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    try {
      final statsRes = await _apiClient.dio.get(AppConstants.tutorStats);
      final sessionsRes = await _apiClient.dio.get(AppConstants.tutorSessions, queryParameters: {'status': 'scheduled'});
      final bookingsRes = await _apiClient.dio.get(AppConstants.tutorBookings, queryParameters: {'status': 'pending'});

      if (mounted) {
        final tp = context.read<TutorProvider>();
        await tp.refreshAll();

        setState(() {
          _stats = statsRes.data as Map<String, dynamic>?;
          final sData = sessionsRes.data;
          _upcomingSessions = (sData is List) ? sData : (sData['data'] as List?) ?? [];
          final bData = bookingsRes.data;
          _pendingBookings = (bData is List) ? bData : (bData['data'] as List?) ?? [];
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().currentUser;
    final name = '${user?['firstName'] ?? ''} ${user?['lastName'] ?? ''}'.trim();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Tutor Dashboard'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
        actions: [
          IconButton(icon: const Icon(Icons.refresh_rounded), onPressed: _load),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildHeader(name),
                    const SizedBox(height: 24),
                    _buildStatsRow(),
                    const SizedBox(height: 24),
                    _buildQuickActions(),
                    const SizedBox(height: 24),
                    if (_pendingBookings.isNotEmpty) ...[
                      _buildSectionTitle('Pending Booking Requests', Icons.calendar_today_rounded),
                      const SizedBox(height: 12),
                      ..._pendingBookings.take(3).map((b) => _buildBookingRequestCard(b)),
                      const SizedBox(height: 24),
                    ],
                    _buildSectionTitle('Upcoming Sessions', Icons.video_call_rounded),
                    const SizedBox(height: 12),
                    if (_upcomingSessions.isEmpty)
                      _buildEmptyState('No upcoming sessions', 'New bookings will appear here.')
                    else
                      ..._upcomingSessions.take(5).map((s) => _buildSessionCard(s)),
                    const SizedBox(height: 80),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildHeader(String name) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.primary, AppColors.primary.withValues(alpha: 0.8)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Welcome back,', style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontSize: 14)),
          const SizedBox(height: 4),
          Text(name.isNotEmpty ? name : 'Tutor',
            style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text('Rating: ${_stats?['averageRating']?.toStringAsFixed(1) ?? '—'}  |  ${_stats?['totalStudents'] ?? 0} students',
              style: const TextStyle(color: Colors.white, fontSize: 13)),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsRow() {
    final items = [
      _StatItem(Icons.video_call_rounded, 'Sessions', '${_stats?['totalSessions'] ?? 0}', AppColors.primary),
      _StatItem(Icons.trending_up_rounded, 'This Month', '${_stats?['sessionsThisMonth'] ?? 0}', Colors.green),
      _StatItem(Icons.star_rounded, 'Rating', _stats?['averageRating']?.toStringAsFixed(1) ?? '—', Colors.amber),
      _StatItem(Icons.people_rounded, 'Students', '${_stats?['totalStudents'] ?? 0}', Colors.blue),
    ];

    return Row(
      children: items.map((item) => Expanded(
        child: _buildStatCard(item.icon, item.label, item.value, item.color),
      )).toList(),
    );
  }

  Widget _buildStatCard(IconData icon, String label, String value, Color color) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 3),
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(height: 6),
          Text(value, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: color)),
          const SizedBox(height: 2),
          Text(label, style: TextStyle(fontSize: 10, color: Colors.grey[500])),
        ],
      ),
    );
  }

  Widget _buildQuickActions() {
    final actions = [
      _ActionItem(Icons.schedule_rounded, 'Availability', () => context.push('/tutor/availability'), Colors.blue),
      _ActionItem(Icons.monetization_on_rounded, 'Earnings', () => context.push('/tutor/earnings'), Colors.green),
      _ActionItem(Icons.people_rounded, 'My Students', () => context.push('/tutor/students'), Colors.orange),
      _ActionItem(Icons.edit_note_rounded, 'Profile', () => context.push('/tutor/profile'), AppColors.primary),
      _ActionItem(Icons.calendar_month_rounded, 'Sessions', () => context.push('/tutor/sessions'), Colors.purple),
      _ActionItem(Icons.book_online_rounded, 'Bookings', () => context.push('/tutor/bookings'), Colors.teal),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('Quick Actions', Icons.touch_app_rounded),
        const SizedBox(height: 12),
        Wrap(
          spacing: 12, runSpacing: 12,
          children: actions.map((a) => _buildActionChip(a.icon, a.label, a.onTap, a.color)).toList(),
        ),
      ],
    );
  }

  Widget _buildActionChip(IconData icon, String label, VoidCallback onTap, Color color) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: (MediaQuery.of(context).size.width - 56) / 3,
        padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2))],
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 8),
            Text(label, textAlign: TextAlign.center,
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.grey[700])),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 20, color: AppColors.primary),
        const SizedBox(width: 8),
        Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildBookingRequestCard(dynamic booking) {
    final student = booking['student'] as Map<String, dynamic>? ?? {};
    final studentName = '${student['firstName'] ?? ''} ${student['lastName'] ?? ''}'.trim();
    final subject = booking['subjectName'] as String? ?? 'General';
    final date = booking['requestedDate'] as String? ?? '';
    final time = '${booking['startTime'] ?? ''} - ${booking['endTime'] ?? ''}';
    final message = booking['message'] as String?;
    final id = booking['id'] as String? ?? '';

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.orange.withValues(alpha: 0.3)),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 6, offset: const Offset(0, 1))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                child: Text(studentName.isNotEmpty ? studentName[0].toUpperCase() : '?',
                  style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary)),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(studentName.isNotEmpty ? studentName : 'Student',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    Text('$subject · $date · $time',
                      style: TextStyle(fontSize: 11, color: Colors.grey[600])),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: Colors.orange.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Text('Pending', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.orange)),
              ),
            ],
          ),
          if (message != null && message.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(message, maxLines: 2, overflow: TextOverflow.ellipsis,
              style: TextStyle(fontSize: 12, color: Colors.grey[700])),
          ],
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              OutlinedButton(
                onPressed: () => _handleBooking(id, 'decline'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  side: BorderSide(color: Colors.red[300]!),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: Text('Decline', style: TextStyle(color: Colors.red[400], fontSize: 12)),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: () => _handleBooking(id, 'confirm'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  backgroundColor: AppColors.primary,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: const Text('Confirm', style: TextStyle(color: Colors.white, fontSize: 12)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSessionCard(dynamic session) {
    final student = session['student'] as Map<String, dynamic>? ?? {};
    final studentName = '${student['firstName'] ?? ''} ${student['lastName'] ?? ''}'.trim();
    final subject = session['subjectName'] as String? ?? 'General';
    final startStr = session['startTime'] as String? ?? '';
    final price = (session['price'] is num) ? (session['price'] as num).toDouble() : 0.0;
    final id = session['id'] as String? ?? '';

    final startTime = DateTime.tryParse(startStr);
    final timeStr = startTime != null ? DateFormat('MMM d, h:mm a').format(startTime) : startStr;
    final isSoon = startTime != null && startTime.difference(DateTime.now()).inHours < 2 && startTime.isAfter(DateTime.now());

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: isSoon ? Border.all(color: Colors.green.withValues(alpha: 0.4)) : null,
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 6, offset: const Offset(0, 1))],
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 22,
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
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                Text('$subject · KSh ${price.toStringAsFixed(0)}',
                  style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                Text(timeStr, style: TextStyle(fontSize: 11, color: isSoon ? Colors.green : Colors.grey[500])),
              ],
            ),
          ),
          if (isSoon)
            ElevatedButton(
              onPressed: () => _startSession(id),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: const Text('Start', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
            ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(String title, String subtitle) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Icon(Icons.inbox_rounded, size: 48, color: Colors.grey[300]),
          const SizedBox(height: 12),
          Text(title, style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.grey[600])),
          const SizedBox(height: 4),
          Text(subtitle, style: TextStyle(fontSize: 12, color: Colors.grey[400])),
        ],
      ),
    );
  }

  Future<void> _handleBooking(String id, String action) async {
    String? reason;
    if (action == 'decline') {
      reason = await showDialog<String>(
        context: context,
        builder: (ctx) {
          final controller = TextEditingController();
          return AlertDialog(
            title: const Text('Decline Booking'),
            content: TextField(
              controller: controller,
              maxLines: 3,
              decoration: const InputDecoration(
                hintText: 'Reason for declining...',
                border: OutlineInputBorder(),
              ),
            ),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
              ElevatedButton(
                onPressed: () => Navigator.pop(ctx, controller.text),
                style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                child: const Text('Decline', style: TextStyle(color: Colors.white)),
              ),
            ],
          );
        },
      );
      if (reason == null || !mounted) return;
    }
    try {
      if (action == 'confirm') {
        await _apiClient.dio.patch('${AppConstants.tutorBookingConfirm}/$id/confirm');
      } else {
        await _apiClient.dio.patch('${AppConstants.tutorBookingCancel}/$id/cancel', data: {'reason': reason ?? 'Declined'});
      }
      _load();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(action == 'confirm' ? 'Booking confirmed!' : 'Booking declined'),
          backgroundColor: action == 'confirm' ? Colors.green : Colors.red,
        ));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Failed to $action booking'),
          backgroundColor: Colors.red,
        ));
      }
    }
  }

  Future<void> _startSession(String id) async {
    try {
      final res = await _apiClient.dio.post('${AppConstants.tutorSessionStart}/$id/start');
      final data = res.data as Map<String, dynamic>? ?? {};
      if (mounted) {
        context.push('/tutor/session/$id', extra: {
          'sessionId': id,
          'roomId': data['roomId'],
          'meetingUrl': data['meetingUrl'],
          'role': 'tutor',
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Failed to start session'),
          backgroundColor: Colors.red,
        ));
      }
    }
  }
}

class _StatItem {
  final IconData icon;
  final String label;
  final String value;
  final Color color;
  _StatItem(this.icon, this.label, this.value, this.color);
}

class _ActionItem {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color color;
  _ActionItem(this.icon, this.label, this.onTap, this.color);
}
