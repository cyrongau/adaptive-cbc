import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants.dart';
import '../../../core/theme/app_colors.dart';

class SchoolScreen extends StatefulWidget {
  const SchoolScreen({super.key});

  @override
  State<SchoolScreen> createState() => _SchoolScreenState();
}

class _SchoolScreenState extends State<SchoolScreen> {
  final ApiClient _apiClient = ApiClient();
  Map<String, dynamic>? _schoolData;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  Future<void> _fetch() async {
    setState(() => _isLoading = true);
    try {
      final res = await _apiClient.dio.get(AppConstants.mySchool);
      if (res.statusCode == 200 && mounted) {
        setState(() {
          _schoolData = res.data as Map<String, dynamic>?;
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
        title: const Text('School Details'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
        actions: [IconButton(icon: const Icon(Icons.refresh_rounded), onPressed: _fetch)],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _schoolData == null
              ? Center(child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.school_outlined, size: 72, color: AppColors.primary.withValues(alpha: 0.3)),
                    const SizedBox(height: 16),
                    const Text('No school info', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Text('You are not enrolled in any school yet.',
                      style: TextStyle(color: AppColors.onSurfaceVariant), textAlign: TextAlign.center),
                  ],
                ))
              : RefreshIndicator(
                  onRefresh: _fetch,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      _buildSchoolCard(),
                      const SizedBox(height: 20),
                      _buildEnrollmentCard(),
                      const SizedBox(height: 20),
                      _buildTeachersSection(),
                    ],
                  ),
                ),
    );
  }

  Widget _buildSchoolCard() {
    final institution = _schoolData!['institution'] as Map<String, dynamic>? ?? {};
    final name = institution['name'] as String? ?? 'School';
    final code = institution['code'] as String? ?? '';
    final motto = institution['motto'] as String? ?? '';
    final county = institution['county'] as String? ?? '';
    final type = institution['type'] as String? ?? '';
    final students = institution['totalStudents'] as int? ?? 0;
    final teachers = institution['totalTeachers'] as int? ?? 0;

    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 1,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Container(
              width: 72, height: 72,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(Icons.school_rounded, size: 36, color: AppColors.primary),
            ),
            const SizedBox(height: 12),
            Text(name, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            if (code.isNotEmpty)
              Text('Code: $code', style: TextStyle(fontSize: 13, color: Colors.grey[600])),
            if (motto.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text('"$motto"', style: TextStyle(fontSize: 12, fontStyle: FontStyle.italic, color: Colors.grey[500])),
            ],
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (type.isNotEmpty)
                  _infoChip(type.replaceAll('_', ' ').toUpperCase(), Colors.indigo),
                if (county.isNotEmpty) ...[
                  const SizedBox(width: 6),
                  _infoChip(county, Colors.teal),
                ],
              ],
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _statItem('$students', 'Students'),
                _statItem('$teachers', 'Teachers'),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _infoChip(String label, MaterialColor color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
      child: Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: color)),
    );
  }

  Widget _statItem(String value, String label) {
    return Column(
      children: [
        Text(value, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
        Text(label, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
      ],
    );
  }

  Widget _buildEnrollmentCard() {
    final enrollment = _schoolData!['enrollment'] as Map<String, dynamic>?;
    if (enrollment == null) return const SizedBox.shrink();
    final grade = enrollment['grade'];
    final stream = enrollment['stream'] as String? ?? '';
    final admission = enrollment['admissionNumber'] as String? ?? '';

    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 0,
      color: AppColors.primary.withValues(alpha: 0.06),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            const Icon(Icons.badge_rounded, color: AppColors.primary),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Enrollment', style: TextStyle(fontWeight: FontWeight.bold)),
                Text('Grade $grade${stream.isNotEmpty ? ' - Stream $stream' : ''}',
                  style: TextStyle(fontSize: 13, color: Colors.grey[600])),
                if (admission.isNotEmpty)
                  Text('Admission: $admission', style: TextStyle(fontSize: 12, color: Colors.grey[500])),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTeachersSection() {
    final teachers = _schoolData!['teachers'] as List? ?? [];
    if (teachers.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Your Teachers (${teachers.length})', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        const SizedBox(height: 10),
        ...teachers.map<Widget>((t) {
          final teacher = t['teacher'] as Map<String, dynamic>? ?? {};
          final name = '${teacher['firstName'] ?? ''} ${teacher['lastName'] ?? ''}'.trim();
          final subjects = t['subjects'] as List? ?? [];
          final streams = t['streams'] as List? ?? [];

          return Card(
            margin: const EdgeInsets.only(bottom: 8),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            elevation: 0,
            color: Colors.white,
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                child: Text(name.isNotEmpty ? name[0].toUpperCase() : '?',
                  style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary)),
              ),
              title: Text(name, style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text([
                if (subjects.isNotEmpty) subjects.join(', '),
                if (streams.isNotEmpty) 'Streams: ${streams.join(', ')}',
              ].join(' | '), style: TextStyle(fontSize: 11, color: Colors.grey[600])),
            ),
          );
        }),
      ],
    );
  }
}
