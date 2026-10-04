import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../services/tutor_service.dart';

class TutorBookingsScreen extends StatefulWidget {
  const TutorBookingsScreen({super.key});

  @override
  State<TutorBookingsScreen> createState() => _TutorBookingsScreenState();
}

class _TutorBookingsScreenState extends State<TutorBookingsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TutorService _service = TutorService();
  bool _isLoading = false;

  final Map<int, List<dynamic>> _bookings = {0: [], 1: [], 2: [], 3: []};
  final Map<int, String> _statusFilters = {0: 'pending', 1: 'confirmed', 2: 'completed', 3: 'cancelled'};
  final List<String> _tabLabels = const ['Pending', 'Upcoming', 'Completed', 'Cancelled'];
  final List<IconData> _tabIcons = const [
    Icons.hourglass_empty_rounded,
    Icons.check_circle_rounded,
    Icons.done_all_rounded,
    Icons.cancel_rounded,
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
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
      final data = await _service.getBookings(status: _statusFilters[index]);
      if (mounted) {
        setState(() {
          _bookings[index] = data;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _confirmBooking(String id) async {
    final message = await showDialog<String>(
      context: context,
      builder: (ctx) {
        final controller = TextEditingController();
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Text('Confirm Booking'),
          content: TextField(
            controller: controller,
            maxLines: 3,
            decoration: const InputDecoration(
              hintText: 'Optional message to student...',
              border: OutlineInputBorder(),
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx, controller.text),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
              child: const Text('Confirm', style: TextStyle(color: Colors.white)),
            ),
          ],
        );
      },
    );
    if (message == null || !mounted) return;
    try {
      await _service.confirmBooking(id, responseMessage: message.isNotEmpty ? message : null);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Booking confirmed'), backgroundColor: Colors.green),
        );
        _loadTab(_tabController.index);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to confirm booking'), backgroundColor: Colors.red),
        );
      }
    }
  }

  Future<void> _cancelBooking(String id) async {
    final reason = await showDialog<String>(
      context: context,
      builder: (ctx) {
        final controller = TextEditingController();
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Text('Cancel Booking'),
          content: TextField(
            controller: controller,
            maxLines: 3,
            decoration: const InputDecoration(
              hintText: 'Reason for cancellation',
              border: OutlineInputBorder(),
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Go Back')),
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx, controller.text),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
              child: const Text('Cancel Booking', style: TextStyle(color: Colors.white)),
            ),
          ],
        );
      },
    );

    if (reason != null && mounted) {
      try {
        await _service.cancelBooking(id, reason);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Booking cancelled'), backgroundColor: Colors.orange),
          );
          _loadTab(_tabController.index);
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Failed to cancel booking'), backgroundColor: Colors.red),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Bookings'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppColors.primary,
          unselectedLabelColor: Colors.grey,
          indicatorColor: AppColors.primary,
          isScrollable: true,
          tabs: List.generate(4, (i) => Tab(text: _tabLabels[i], icon: Icon(_tabIcons[i], size: 16))),
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: List.generate(4, (i) => _buildTabContent(i)),
      ),
    );
  }

  Widget _buildTabContent(int index) {
    final items = _bookings[index] ?? [];

    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (items.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(_tabIcons[index], size: 64, color: Colors.grey[300]),
            const SizedBox(height: 16),
            Text(
              index == 0 ? 'No pending bookings'
                  : index == 1 ? 'No upcoming bookings'
                  : index == 2 ? 'No completed bookings'
                  : 'No cancelled bookings',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.grey),
            ),
            const SizedBox(height: 8),
            Text(
              index == 0 ? 'Students have not booked any sessions yet.'
                  : index == 1 ? 'Confirmed bookings will appear here.'
                  : index == 2 ? 'Completed bookings will appear here.'
                  : 'Cancelled bookings will appear here.',
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
        itemBuilder: (_, i) => _buildBookingCard(items[i], index),
      ),
    );
  }

  Widget _buildBookingCard(dynamic booking, int tabIndex) {
    final student = booking['student'] as Map<String, dynamic>? ?? {};
    final studentName = '${student['firstName'] ?? ''} ${student['lastName'] ?? ''}'.trim();
    final subject = booking['subjectName'] as String? ?? 'General';
    final startStr = booking['startTime'] as String? ?? '';
    final endStr = booking['endTime'] as String? ?? '';
    final price = (booking['price'] is num) ? (booking['price'] as num).toDouble() : 0.0;
    final id = booking['id'] as String? ?? '';
    final duration = booking['durationMinutes'] as int? ?? 60;
    final message = booking['message'] as String?;
    final responseMessage = booking['responseMessage'] as String?;
    final cancellationReason = booking['cancellationReason'] as String?;

    final startTime = DateTime.tryParse(startStr);
    final endTime = DateTime.tryParse(endStr);
    final dateStr = startTime != null ? DateFormat('MMM d, yyyy').format(startTime) : '';
    final timeStr = startTime != null
        ? '${DateFormat('h:mm a').format(startTime)} - ${endTime != null ? DateFormat('h:mm a').format(endTime) : ''}'
        : '';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
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
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                    Row(
                      children: [
                        Icon(Icons.menu_book_rounded, size: 12, color: Colors.grey[500]),
                        const SizedBox(width: 4),
                        Text(subject, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                      ],
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: _statusColor(tabIndex).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(_tabLabels[tabIndex],
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: _statusColor(tabIndex))),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Icon(Icons.calendar_today_rounded, size: 14, color: Colors.grey[500]),
              const SizedBox(width: 6),
              Text(dateStr, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
              const SizedBox(width: 16),
              Icon(Icons.access_time_rounded, size: 14, color: Colors.grey[500]),
              const SizedBox(width: 6),
              Expanded(child: Text(timeStr, style: TextStyle(fontSize: 12, color: Colors.grey[600]))),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              Icon(Icons.timer_outlined, size: 14, color: Colors.grey[500]),
              const SizedBox(width: 6),
              Text('$duration min', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
              const Spacer(),
              Text('KSh ${price.toStringAsFixed(0)}',
                style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary, fontSize: 13)),
            ],
          ),
          if (message != null && message.isNotEmpty) ...[
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.grey[50],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(message,
                style: TextStyle(fontSize: 12, color: Colors.grey[700], fontStyle: FontStyle.italic)),
            ),
          ],
          if (responseMessage != null && responseMessage.isNotEmpty) ...[
            const SizedBox(height: 6),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.reply_rounded, size: 14, color: AppColors.primary),
                  const SizedBox(width: 6),
                  Expanded(child: Text(responseMessage,
                    style: TextStyle(fontSize: 12, color: AppColors.primary))),
                ],
              ),
            ),
          ],
          if (cancellationReason != null && cancellationReason.isNotEmpty && tabIndex == 3) ...[
            const SizedBox(height: 6),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.red.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.info_outline_rounded, size: 14, color: Colors.red[400]),
                  const SizedBox(width: 6),
                  Expanded(child: Text(cancellationReason,
                    style: TextStyle(fontSize: 12, color: Colors.red[700]))),
                ],
              ),
            ),
          ],
          if (tabIndex == 0) ...[
            const SizedBox(height: 14),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                OutlinedButton.icon(
                  onPressed: () => _cancelBooking(id),
                  icon: const Icon(Icons.close_rounded, size: 18),
                  label: const Text('Decline'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.red,
                    side: const BorderSide(color: Colors.red),
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
                const SizedBox(width: 12),
                ElevatedButton.icon(
                  onPressed: () => _confirmBooking(id),
                  icon: const Icon(Icons.check_rounded, size: 18),
                  label: const Text('Confirm'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ],
            ),
          ],
          if (tabIndex == 1) ...[
            const SizedBox(height: 14),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () => _cancelBooking(id),
                icon: const Icon(Icons.cancel_outlined, size: 18),
                label: const Text('Cancel Booking'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.red,
                  side: const BorderSide(color: Colors.red),
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Color _statusColor(int index) {
    switch (index) {
      case 0: return Colors.orange;
      case 1: return Colors.green;
      case 2: return Colors.blue;
      case 3: return Colors.grey;
      default: return Colors.grey;
    }
  }
}
