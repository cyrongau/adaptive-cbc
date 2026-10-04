import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:flutter_widget_from_html/flutter_widget_from_html.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants.dart';
import '../../../core/theme/app_colors.dart';

class ReviewsScreen extends StatefulWidget {
  const ReviewsScreen({super.key});

  @override
  State<ReviewsScreen> createState() => _ReviewsScreenState();
}

class _ReviewsScreenState extends State<ReviewsScreen> {
  final ApiClient _apiClient = ApiClient();
  int _tabIndex = 0;

  List<dynamic> _pending = [];
  List<dynamic> _reviewed = [];
  bool _isLoadingPending = true;
  bool _isLoadingReviewed = true;
  final Set<String> _evaluating = {};

  @override
  void initState() {
    super.initState();
    _fetchPending();
    _fetchReviewed();
  }

  Future<void> _fetchPending() async {
    setState(() => _isLoadingPending = true);
    try {
      final res = await _apiClient.dio.get('${AppConstants.questions}/attempts/pending-review');
      if (res.statusCode == 200 && mounted) {
        setState(() {
          _pending = (res.data as List?) ?? [];
          _isLoadingPending = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoadingPending = false);
    }
  }

  Future<void> _fetchReviewed() async {
    setState(() => _isLoadingReviewed = true);
    try {
      final res = await _apiClient.dio.get('${AppConstants.questions}/attempts/reviewed-history');
      if (res.statusCode == 200 && mounted) {
        setState(() {
          _reviewed = (res.data as List?) ?? [];
          _isLoadingReviewed = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoadingReviewed = false);
    }
  }

  Future<void> _evaluate(String attemptId, bool isCorrect) async {
    setState(() => _evaluating.add(attemptId));
    try {
      await _apiClient.dio.put(
        '${AppConstants.questions}/attempts/$attemptId/evaluate',
        data: {'isCorrect': isCorrect},
      );
      if (mounted) {
        setState(() {
          _pending.removeWhere((a) => a['id'] == attemptId);
          _evaluating.remove(attemptId);
        });
        _showSuccess(isCorrect ? 'Marked as correct' : 'Marked as incorrect');
      }
    } catch (_) {
      if (mounted) {
        setState(() => _evaluating.remove(attemptId));
        _showError('Failed to evaluate');
      }
    }
  }

  void _showSuccess(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: Colors.green));
  }

  void _showError(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: Colors.red));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Answer Reviews'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () {
              _fetchPending();
              if (_tabIndex == 1) _fetchReviewed();
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _tabButton('Pending', 0, _pending.length),
                const SizedBox(width: 8),
                _tabButton('Reviewed', 1, _reviewed.length),
              ],
            ),
          ),
          Expanded(child: _tabIndex == 0 ? _buildPending() : _buildReviewed()),
        ],
      ),
    );
  }

  Widget _tabButton(String label, int index, int count) {
    final active = _tabIndex == index;
    return GestureDetector(
      onTap: () => setState(() => _tabIndex = index),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        decoration: BoxDecoration(
          color: active ? AppColors.primary : Colors.grey[100],
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(label,
              style: TextStyle(
                fontSize: 14, fontWeight: FontWeight.bold,
                color: active ? Colors.white : AppColors.onSurfaceVariant,
              )),
            if (count > 0) ...[
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                decoration: BoxDecoration(
                  color: active ? Colors.white.withValues(alpha: 0.2) : AppColors.primary.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text('$count',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold,
                    color: active ? Colors.white : AppColors.primary)),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildPending() {
    if (_isLoadingPending) return const Center(child: CircularProgressIndicator());
    if (_pending.isEmpty) return _emptyState('No pending reviews', 'All drawing answers have been reviewed.');
    return RefreshIndicator(
      onRefresh: _fetchPending,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _pending.length,
        itemBuilder: (_, i) => _buildAttemptCard(_pending[i], isPending: true),
      ),
    );
  }

  Widget _buildReviewed() {
    if (_isLoadingReviewed) return const Center(child: CircularProgressIndicator());
    if (_reviewed.isEmpty) return _emptyState('No reviewed answers', 'Reviewed answers will appear here.');
    return RefreshIndicator(
      onRefresh: _fetchReviewed,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _reviewed.length,
        itemBuilder: (_, i) => _buildAttemptCard(_reviewed[i], isPending: false),
      ),
    );
  }

  Widget _emptyState(String title, String subtitle) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.rate_review_outlined, size: 64, color: AppColors.primary.withValues(alpha: 0.3)),
            const SizedBox(height: 16),
            Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text(subtitle, style: TextStyle(color: AppColors.onSurfaceVariant), textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }

  Widget _buildAttemptCard(dynamic item, {required bool isPending}) {
    final id = item['id'] as String? ?? '';
    final student = item['student'] as Map<String, dynamic>? ?? {};
    final question = item['question'] as Map<String, dynamic>? ?? {};
    final answer = item['answer'] as String? ?? '';
    final attemptedAt = item['attemptedAt'] as String? ?? '';
    final sessionType = item['sessionType'] as String? ?? '';
    final content = question['content'] as String? ?? '';
    final mediaList = question['questionMedia'] as List? ?? [];
    final mediaUrl = question['mediaUrl'] as String?;
    final explanation = question['explanation'] as String?;
    final studentName = '${student['firstName'] ?? ''} ${student['lastName'] ?? ''}'.trim();
    final studentGrade = student['grade'];

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 1,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.indigo.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(studentName.isNotEmpty ? studentName : 'Student',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.indigo.shade700)),
                ),
                if (studentGrade != null) ...[
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.amber.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text('Grade $studentGrade',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.amber.shade700)),
                  ),
                ],
                const SizedBox(width: 6),
                if (attemptedAt.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.grey[100],
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(_formatDate(attemptedAt),
                      style: TextStyle(fontSize: 10, color: Colors.grey[600])),
                  ),
              ],
            ),
            if (sessionType.isNotEmpty) ...[
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: Colors.purple.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(sessionType.replaceAll('_', ' ').toUpperCase(),
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.purple.shade400)),
              ),
            ],
            const SizedBox(height: 12),
            HtmlWidget(content, textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
            if (mediaList.isNotEmpty || mediaUrl != null) ...[
              const SizedBox(height: 8),
              if (mediaList.isNotEmpty)
                ...mediaList.map<Widget>((m) => Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: Image.network(m['url'] as String? ?? '',
                      height: 160, width: double.infinity, fit: BoxFit.contain,
                      errorBuilder: (_, __, ___) => const SizedBox.shrink()),
                  ),
                )),
              if (mediaList.isEmpty && mediaUrl != null)
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: Image.network(mediaUrl, height: 160, width: double.infinity, fit: BoxFit.contain,
                    errorBuilder: (_, __, ___) => const SizedBox.shrink()),
                ),
            ],
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey[50],
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey[200]!),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Student Answer:', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey[600])),
                  const SizedBox(height: 6),
                  if (answer.startsWith('data:image/'))
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.memory(base64Decode(answer.split(',').last),
                        height: 140, width: double.infinity, fit: BoxFit.contain),
                    )
                  else
                    Text(answer.isNotEmpty ? answer : '(blank)',
                      style: TextStyle(fontSize: 14, color: AppColors.onSurface)),
                ],
              ),
            ),
            if (explanation != null && explanation.isNotEmpty) ...[
              const SizedBox(height: 10),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.indigo.withValues(alpha: 0.06),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Explanation:', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.indigo)),
                    const SizedBox(height: 4),
                    HtmlWidget(explanation, textStyle: const TextStyle(fontSize: 13)),
                  ],
                ),
              ),
            ],
            if (isPending) ...[
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: _evaluating.contains(id) ? null : () => _evaluate(id, true),
                      icon: _evaluating.contains(id)
                          ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Icon(Icons.check_circle_rounded, size: 18),
                      label: const Text('Correct', style: TextStyle(fontWeight: FontWeight.bold)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: _evaluating.contains(id) ? null : () => _evaluate(id, false),
                      icon: _evaluating.contains(id)
                          ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Icon(Icons.cancel_rounded, size: 18),
                      label: const Text('Incorrect', style: TextStyle(fontWeight: FontWeight.bold)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                ],
              ),
            ] else ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  Icon(item['isCorrect'] == true ? Icons.check_circle_rounded : Icons.cancel_rounded,
                    size: 16, color: item['isCorrect'] == true ? Colors.green : Colors.red),
                  const SizedBox(width: 6),
                  Text(item['isCorrect'] == true ? 'Correct' : 'Incorrect',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13,
                      color: item['isCorrect'] == true ? Colors.green : Colors.red)),
                  const Spacer(),
                  if (item['reviewer'] != null) ...[
                    Icon(Icons.person_rounded, size: 14, color: Colors.grey[500]),
                    const SizedBox(width: 4),
                    Text('${item['reviewer']['firstName'] ?? ''} ${item['reviewer']['lastName'] ?? ''}',
                      style: TextStyle(fontSize: 11, color: Colors.grey[600])),
                  ],
                  if (item['reviewedAt'] != null) ...[
                    const SizedBox(width: 8),
                    Text(_formatDate(item['reviewedAt'] as String? ?? ''),
                      style: TextStyle(fontSize: 10, color: Colors.grey[500])),
                  ],
                ],
              ),
            ],
          ],
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
