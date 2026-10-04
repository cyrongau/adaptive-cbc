import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../services/tutor_service.dart';

class TutorAvailabilityScreen extends StatefulWidget {
  const TutorAvailabilityScreen({super.key});

  @override
  State<TutorAvailabilityScreen> createState() => _TutorAvailabilityScreenState();
}

class _TutorAvailabilityScreenState extends State<TutorAvailabilityScreen> {
  final TutorService _service = TutorService();
  bool _isLoading = true;
  bool _isSaving = false;

  static const List<String> _days = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  ];

  static const List<String> _dayLabels = [
    'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun',
  ];

  static const List<String> _timeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
  ];

  final Map<String, Set<String>> _selectedRanges = {};
  final Map<String, List<String>> _selectedHours = {};

  @override
  void initState() {
    super.initState();
    for (final day in _days) {
      _selectedRanges[day] = {};
      _selectedHours[day] = [];
    }
    _loadAvailability();
  }

  Future<void> _loadAvailability() async {
    setState(() => _isLoading = true);
    try {
      final profile = await _service.getProfile();
      final slots = profile['availability'] as List<dynamic>? ?? [];
      for (final slot in slots) {
        final day = slot['dayOfWeek'] as String?;
        final start = slot['startTime'] as String?;
        final end = slot['endTime'] as String?;
        if (day != null && start != null && end != null) {
          _fillRange(day, start, end);
        }
      }
    } catch (_) {}
    if (mounted) setState(() => _isLoading = false);
  }

  void _fillRange(String day, String start, String end) {
    final startIdx = _timeSlots.indexOf(start);
    final endIdx = _timeSlots.indexOf(end);
    if (startIdx == -1 || endIdx == -1) return;
    for (int i = startIdx; i < endIdx; i++) {
      _selectedRanges[day]?.add(_timeSlots[i]);
    }
    _syncHours(day);
  }

  void _toggleHour(String day, String hour) {
    setState(() {
      if (_selectedRanges[day]!.contains(hour)) {
        _selectedRanges[day]!.remove(hour);
      } else {
        _selectedRanges[day]!.add(hour);
      }
      _syncHours(day);
    });
  }

  void _syncHours(String day) {
    final sorted = _selectedRanges[day]!.toList()..sort();
    _selectedHours[day] = sorted;
  }

  List<Map<String, String>> _buildSlotsPayload() {
    final result = <Map<String, String>>[];
    for (final day in _days) {
      final hours = _selectedHours[day]!;
      if (hours.isEmpty) continue;
      String rangeStart = hours.first;
      String rangeEnd = _nextHour(hours.first);
      for (int i = 1; i < hours.length; i++) {
        final expected = _nextHour(rangeEnd);
        if (hours[i] == expected) {
          rangeEnd = _nextHour(hours[i]);
        } else {
          result.add({'dayOfWeek': day, 'startTime': rangeStart, 'endTime': rangeEnd});
          rangeStart = hours[i];
          rangeEnd = _nextHour(hours[i]);
        }
      }
      result.add({'dayOfWeek': day, 'startTime': rangeStart, 'endTime': rangeEnd});
    }
    return result;
  }

  String _nextHour(String hour) {
    final parts = hour.split(':');
    final h = int.parse(parts[0]) + 1;
    return '${h.toString().padLeft(2, '0')}:00';
  }

  Future<void> _save() async {
    setState(() => _isSaving = true);
    try {
      await _service.setAvailabilitySlots(_buildSlotsPayload());
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Availability saved'), backgroundColor: Colors.green),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to save availability'), backgroundColor: Colors.red),
        );
      }
    }
    if (mounted) setState(() => _isSaving = false);
  }

  bool _isAllWeekEmpty() {
    return _days.every((d) => _selectedHours[d]!.isEmpty);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Set Availability'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
        actions: [
          TextButton.icon(
            onPressed: _isSaving ? null : _save,
            icon: _isSaving
                ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                : const Icon(Icons.save_rounded),
            label: const Text('Save'),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Legend
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  color: Colors.white,
                  child: Row(
                    children: [
                      _legendChip(Colors.green, 'Available'),
                      const SizedBox(width: 16),
                      _legendChip(Colors.grey[200]!, 'Unavailable'),
                      const Spacer(),
                      Text('Tap hours to toggle',
                        style: TextStyle(fontSize: 12, color: Colors.grey[500])),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                Expanded(child: _buildGrid()),
                if (!_isAllWeekEmpty())
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                    child: SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: _isSaving ? null : _save,
                        icon: _isSaving
                            ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                            : const Icon(Icons.save_rounded),
                        label: Text(_isSaving ? 'Saving...' : 'Save Availability'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
    );
  }

  Widget _legendChip(Color color, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(width: 14, height: 14, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(3))),
        const SizedBox(width: 6),
        Text(label, style: TextStyle(fontSize: 12, color: Colors.grey[700])),
      ],
    );
  }

  Widget _buildGrid() {
    final screenWidth = MediaQuery.of(context).size.width;
    final columnWidth = (screenWidth - 16) / (_timeSlots.length + 1);

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: SingleChildScrollView(
        padding: const EdgeInsets.only(left: 8, right: 8, bottom: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header row
            Row(
              children: [
                SizedBox(
                  width: 50,
                  child: Center(
                    child: Text('Day', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey[600])),
                  ),
                ),
                ..._timeSlots.map((t) => SizedBox(
                  width: columnWidth,
                  child: Center(
                    child: Text(t, style: TextStyle(fontSize: 9, fontWeight: FontWeight.w500, color: Colors.grey[500])),
                  ),
                )),
              ],
            ),
            const SizedBox(height: 4),
            // Day rows
            ...List.generate(_days.length, (dayIdx) {
              final day = _days[dayIdx];
              final hours = _selectedHours[day]!;
              final allEmpty = hours.isEmpty;

              return Container(
                margin: const EdgeInsets.only(bottom: 4),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 50,
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      child: Center(
                        child: Text(_dayLabels[dayIdx],
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: allEmpty ? Colors.grey[400] : AppColors.primary,
                          )),
                      ),
                    ),
                    ..._timeSlots.map((t) {
                      final selected = _selectedRanges[day]!.contains(t);
                      return GestureDetector(
                        onTap: () => _toggleHour(day, t),
                        child: Container(
                          width: columnWidth,
                          height: 34,
                          margin: const EdgeInsets.symmetric(horizontal: 1, vertical: 2),
                          decoration: BoxDecoration(
                            color: selected ? Colors.green : Colors.grey[200],
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                      );
                    }),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}
