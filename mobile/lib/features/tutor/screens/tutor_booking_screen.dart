import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../services/tutor_service.dart';

class TutorBookingScreen extends StatefulWidget {
  final String tutorId;
  final Map<String, dynamic> tutorData;
  const TutorBookingScreen({super.key, required this.tutorId, required this.tutorData});

  @override
  State<TutorBookingScreen> createState() => _TutorBookingScreenState();
}

class _TutorBookingScreenState extends State<TutorBookingScreen> {
  final TutorService _service = TutorService();
  bool _isLoading = true;
  bool _isSubmitting = false;

  List<dynamic> _slots = [];
  List<dynamic> _subjects = [];
  DateTime _selectedDate = DateTime.now().add(const Duration(days: 1));
  String? _selectedTime;
  String? _selectedSubjectId;
  String? _selectedSubjectName;
  double _hourlyRate = 0;
  final _messageController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _subjects = widget.tutorData['subjects'] as List<dynamic>? ?? [];
    if (_subjects.isNotEmpty) {
      _selectedSubjectId = _subjects.first['subjectId']?.toString();
      _selectedSubjectName = _subjects.first['subjectName'] as String?;
      _hourlyRate = (_subjects.first['hourlyRate'] as num?)?.toDouble() ?? 0;
    }
    _loadSlots();
  }

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _loadSlots() async {
    try {
      _slots = await _service.getAvailableSlots(widget.tutorId);
    } catch (_) {}
    if (mounted) setState(() => _isLoading = false);
  }

  List<String> _getDaySlots(String day) {
    final daySlots = _slots.where((s) => s['dayOfWeek']?.toString().toLowerCase() == day.toLowerCase()).toList();
    final times = <String>[];
    for (final slot in daySlots) {
      final start = slot['startTime'] as String? ?? '';
      final end = slot['endTime'] as String? ?? '';
      final startH = int.tryParse(start.split(':')[0]) ?? 0;
      final endH = int.tryParse(end.split(':')[0]) ?? 0;
      for (int h = startH; h < endH; h++) {
        times.add('${h.toString().padLeft(2, '0')}:00');
      }
    }
    return times;
  }

  String _dayOfWeek(DateTime d) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[d.weekday % 7];
  }

  double _calculatePrice() {
    return _hourlyRate;
  }

  Future<void> _submitBooking() async {
    if (_selectedTime == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a time slot'), backgroundColor: Colors.red),
      );
      return;
    }
    if (_selectedSubjectId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a subject'), backgroundColor: Colors.red),
      );
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      await _service.createBooking({
        'tutorId': widget.tutorId,
        'subjectId': _selectedSubjectId,
        'subjectName': _selectedSubjectName,
        'requestedDate': DateFormat('yyyy-MM-dd').format(_selectedDate),
        'startTime': _selectedTime,
        'endTime': '${(int.parse(_selectedTime!.split(':')[0]) + 1).toString().padLeft(2, '0')}:00',
        'price': _calculatePrice(),
        'message': _messageController.text,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Booking request sent! Tutor will confirm shortly.'), backgroundColor: Colors.green),
        );
        Navigator.of(context).popUntil((route) => route.isFirst);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed: ${e.toString()}'), backgroundColor: Colors.red),
        );
      }
    }
    if (mounted) setState(() => _isSubmitting = false);
  }

  @override
  Widget build(BuildContext context) {
    final user = widget.tutorData['user'] as Map<String, dynamic>? ?? {};
    final name = '${user['firstName'] ?? ''} ${user['lastName'] ?? ''}'.trim();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Book $name'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _sectionHeader('Select Subject', Icons.menu_book_rounded),
                  const SizedBox(height: 12),
                  ..._subjects.map((s) {
                    final sid = s['subjectId']?.toString();
                    final sn = s['subjectName'] as String? ?? '';
                    final rate = (s['hourlyRate'] as num?)?.toDouble() ?? 0;
                    final selected = sid == _selectedSubjectId;
                    return GestureDetector(
                      onTap: () => setState(() {
                        _selectedSubjectId = sid;
                        _selectedSubjectName = sn;
                        _hourlyRate = rate;
                      }),
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: selected ? AppColors.primary : Colors.grey[200]!, width: selected ? 2 : 1),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.check_circle_rounded,
                              color: selected ? AppColors.primary : Colors.grey[300], size: 22),
                            const SizedBox(width: 12),
                            Expanded(child: Text(sn, style: TextStyle(fontWeight: selected ? FontWeight.bold : FontWeight.normal))),
                            Text('KSh ${rate.toStringAsFixed(0)}/hr',
                              style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary)),
                          ],
                        ),
                      ),
                    );
                  }),
                  const SizedBox(height: 24),

                  _sectionHeader('Select Date', Icons.calendar_month_rounded),
                  const SizedBox(height: 12),
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: CalendarDatePicker(
                      initialDate: _selectedDate,
                      firstDate: DateTime.now(),
                      lastDate: DateTime.now().add(const Duration(days: 30)),
                      onDateChanged: (d) => setState(() {
                        _selectedDate = d;
                        _selectedTime = null;
                      }),
                    ),
                  ),
                  const SizedBox(height: 24),

                  _sectionHeader('Select Time', Icons.access_time_rounded),
                  const SizedBox(height: 12),
                  _buildTimeSlots(),
                  const SizedBox(height: 24),

                  _sectionHeader('Message (optional)', Icons.message_rounded),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _messageController,
                    maxLines: 3,
                    decoration: InputDecoration(
                      hintText: 'Add a note for the tutor...',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      filled: true,
                      fillColor: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Summary
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Booking Summary', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                        const SizedBox(height: 12),
                        _summaryRow('Tutor', name),
                        _summaryRow('Subject', _selectedSubjectName ?? ''),
                        _summaryRow('Date', _selectedTime != null
                            ? '${DateFormat('MMM d, yyyy').format(_selectedDate)} at $_selectedTime'
                            : 'Not selected'),
                        _summaryRow('Duration', '60 minutes'),
                        const Divider(height: 20),
                        _summaryRow('Total', 'KSh ${_calculatePrice().toStringAsFixed(0)}',
                          bold: true, color: AppColors.primary),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _isSubmitting ? null : _submitBooking,
                      icon: _isSubmitting
                          ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Icon(Icons.send_rounded),
                      label: Text(_isSubmitting ? 'Sending...' : 'Send Booking Request'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),
                ],
              ),
            ),
    );
  }

  Widget _buildTimeSlots() {
    final daySlots = _getDaySlots(_dayOfWeek(_selectedDate));
    if (daySlots.isEmpty) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Icon(Icons.schedule_rounded, size: 40, color: Colors.grey[300]),
            const SizedBox(height: 8),
            Text('No available slots for this day',
              style: TextStyle(color: Colors.grey[500], fontSize: 14)),
            Text('Try a different date.',
              style: TextStyle(color: Colors.grey[400], fontSize: 12)),
          ],
        ),
      );
    }

    return Wrap(
      spacing: 8, runSpacing: 8,
      children: daySlots.map((t) {
        final selected = t == _selectedTime;
        return GestureDetector(
          onTap: () => setState(() => _selectedTime = t),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: selected ? AppColors.primary : Colors.white,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: selected ? AppColors.primary : Colors.grey[300]!),
            ),
            child: Text(t,
              style: TextStyle(
                color: selected ? Colors.white : Colors.grey[700],
                fontWeight: FontWeight.w600,
                fontSize: 13,
              )),
          ),
        );
      }).toList(),
    );
  }

  Widget _sectionHeader(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 20, color: AppColors.primary),
        const SizedBox(width: 8),
        Text(title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _summaryRow(String label, String value, {bool bold = false, Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: 13, color: Colors.grey[600])),
          Text(value, style: TextStyle(fontWeight: bold ? FontWeight.bold : FontWeight.w500, fontSize: 13, color: color)),
        ],
      ),
    );
  }
}
