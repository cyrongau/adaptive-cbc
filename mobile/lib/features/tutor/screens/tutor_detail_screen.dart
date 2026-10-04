import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../services/tutor_service.dart';

class TutorDetailScreen extends StatefulWidget {
  final String tutorId;
  const TutorDetailScreen({super.key, required this.tutorId});

  @override
  State<TutorDetailScreen> createState() => _TutorDetailScreenState();
}

class _TutorDetailScreenState extends State<TutorDetailScreen> {
  final TutorService _service = TutorService();
  bool _isLoading = true;

  Map<String, dynamic> _tutor = {};
  List<dynamic> _reviews = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final results = await Future.wait([
        _service.getTutorById(widget.tutorId),
        _service.getTutorReviewsPublic(widget.tutorId),
      ]);
      if (mounted) {
        setState(() {
          _tutor = results[0] as Map<String, dynamic>;
          _reviews = results[1] as List<dynamic>;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  double _getRating() => (_tutor['rating'] is num) ? (_tutor['rating'] as num).toDouble() : 0.0;
  int _getSessions() => _tutor['totalSessions'] as int? ?? 0;
  int _getStudents() => _tutor['totalStudents'] as int? ?? 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Tutor Profile'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              child: Column(
                children: [
                  _buildHeader(),
                  const SizedBox(height: 16),
                  _buildStats(),
                  const SizedBox(height: 16),
                  _buildSubjects(),
                  const SizedBox(height: 16),
                  _buildBio(),
                  if (_reviews.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    _buildReviews(),
                  ],
                  const SizedBox(height: 24),
                  _buildBookButton(),
                  const SizedBox(height: 32),
                ],
              ),
            ),
    );
  }

  Widget _buildHeader() {
    final user = _tutor['user'] as Map<String, dynamic>? ?? {};
    final name = '${user['firstName'] ?? ''} ${user['lastName'] ?? ''}'.trim();
    final headline = _tutor['headline'] as String? ?? '';
    final avatar = user['avatar'] as String?;
    final location = _tutor['location'] as String?;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.primary, Color(0xFF1565C0)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        children: [
          CircleAvatar(
            radius: 44,
            backgroundColor: Colors.white.withValues(alpha: 0.2),
            backgroundImage: avatar != null ? NetworkImage(avatar) : null,
            child: avatar == null
                ? Text(name.isNotEmpty ? name[0].toUpperCase() : 'T',
                    style: const TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.bold))
                : null,
          ),
          const SizedBox(height: 12),
          Text(name, style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
          if (headline.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(headline, style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontSize: 14)),
            ),
          if (location != null && location.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.location_on_rounded, size: 14, color: Colors.white.withValues(alpha: 0.7)),
                  const SizedBox(width: 4),
                  Text(location, style: TextStyle(color: Colors.white.withValues(alpha: 0.7), fontSize: 13)),
                ],
              ),
            ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              ...List.generate(5, (i) => Icon(
                i < _getRating().round() ? Icons.star_rounded : Icons.star_outline_rounded,
                color: Colors.amber[300], size: 24,
              )),
              const SizedBox(width: 8),
              Text(_getRating().toStringAsFixed(1), style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStats() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.symmetric(vertical: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _statItem(Icons.school_rounded, '${_getSessions()}', 'Sessions'),
          Container(width: 1, height: 30, color: Colors.grey[200]),
          _statItem(Icons.people_rounded, '${_getStudents()}', 'Students'),
          Container(width: 1, height: 30, color: Colors.grey[200]),
          _statItem(Icons.star_rounded, _getRating().toStringAsFixed(1), 'Rating'),
        ],
      ),
    );
  }

  Widget _statItem(IconData icon, String value, String label) {
    return Column(
      children: [
        Icon(icon, size: 20, color: AppColors.primary),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        Text(label, style: TextStyle(fontSize: 11, color: Colors.grey[600])),
      ],
    );
  }

  Widget _buildSubjects() {
    final subjects = _tutor['subjects'] as List? ?? [];
    if (subjects.isEmpty) return const SizedBox.shrink();

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Subjects & Rates', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 12),
          ...subjects.map((s) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(
              children: [
                Icon(Icons.menu_book_rounded, size: 18, color: AppColors.primary),
                const SizedBox(width: 10),
                Expanded(child: Text(s['subjectName'] as String? ?? '', style: const TextStyle(fontSize: 14))),
                Text('KSh ${s['hourlyRate'] ?? ''}/hr',
                  style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary, fontSize: 13)),
              ],
            ),
          )),
        ],
      ),
    );
  }

  Widget _buildBio() {
    final bio = _tutor['bio'] as String?;
    if (bio == null || bio.isEmpty) return const SizedBox.shrink();

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('About', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 8),
          Text(bio, style: TextStyle(fontSize: 14, color: Colors.grey[700], height: 1.5)),
        ],
      ),
    );
  }

  Widget _buildReviews() {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.symmetric(horizontal: 16),
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
              const Text('Reviews', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text('${_reviews.length}', style: TextStyle(fontSize: 12, color: AppColors.primary, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ..._reviews.map((r) => _buildReviewCard(r)),
        ],
      ),
    );
  }

  Widget _buildReviewCard(dynamic r) {
    final student = r['student'] as Map<String, dynamic>? ?? {};
    final name = '${student['firstName'] ?? ''} ${student['lastName'] ?? ''}'.trim();
    final rating = (r['rating'] is num) ? (r['rating'] as num).toInt() : 0;
    final comment = r['comment'] as String? ?? '';
    final createdAt = DateTime.tryParse(r['createdAt'] as String? ?? '');
    final dateStr = createdAt != null ? DateFormat('MMM d, yyyy').format(createdAt) : '';

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 14,
                backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                child: Text(name.isNotEmpty ? name[0].toUpperCase() : 'S',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primary)),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(name.isNotEmpty ? name : 'Student',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              ),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: List.generate(5, (i) => Icon(
                  i < rating ? Icons.star_rounded : Icons.star_outline_rounded,
                  size: 14, color: Colors.amber[600],
                )),
              ),
            ],
          ),
          if (comment.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(comment, style: TextStyle(fontSize: 12, color: Colors.grey[700])),
          ],
          if (dateStr.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(dateStr, style: TextStyle(fontSize: 10, color: Colors.grey[400])),
            ),
        ],
      ),
    );
  }

  Widget _buildBookButton() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: SizedBox(
        width: double.infinity,
        child: ElevatedButton.icon(
          onPressed: () => context.push('/tutors/${widget.tutorId}/book', extra: _tutor),
          icon: const Icon(Icons.calendar_month_rounded),
          label: const Text('Book a Session'),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
        ),
      ),
    );
  }
}
