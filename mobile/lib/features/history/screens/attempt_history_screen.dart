import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:flutter_widget_from_html/flutter_widget_from_html.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants.dart';
import '../../../core/theme/app_colors.dart';

class AttemptHistoryScreen extends StatefulWidget {
  const AttemptHistoryScreen({super.key});

  @override
  State<AttemptHistoryScreen> createState() => _AttemptHistoryScreenState();
}

class _AttemptHistoryScreenState extends State<AttemptHistoryScreen> {
  final ApiClient _apiClient = ApiClient();
  List<dynamic> _items = [];
  bool _isLoading = true;
  final Set<int> _expandedIndexes = {};

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    try {
      final res = await _apiClient.dio.get('${AppConstants.questions}/attempts/my-performance');
      if (res.statusCode == 200 && mounted) {
        setState(() {
          _items = (res.data as List?) ?? [];
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => _isLoading = false);
        _showError('Failed to load performance data');
      }
    }
  }

  void _showError(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: Colors.red));
  }

  void _toggleExpand(int index) {
    setState(() {
      if (_expandedIndexes.contains(index)) {
        _expandedIndexes.remove(index);
      } else {
        _expandedIndexes.add(index);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Attempt History'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
        actions: [
          IconButton(icon: const Icon(Icons.refresh_rounded), onPressed: _fetchData),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _items.isEmpty
              ? _buildEmptyState()
              : _buildBody(),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.bar_chart_rounded, size: 72, color: AppColors.primary.withValues(alpha: 0.3)),
            const SizedBox(height: 20),
            const Text('No attempts yet',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),
            Text('Start practicing to see your performance history here.',
              style: TextStyle(fontSize: 14, color: AppColors.onSurfaceVariant), textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }

  Widget _buildBody() {
    final totalFirstCorrect = _items.where((i) => i['firstAttemptCorrect'] == true).length;
    final totalXp = _items.fold<int>(0, (sum, i) => sum + (i['totalXp'] as int? ?? 0));
    final totalAttempts = _items.fold<int>(0, (sum, i) => sum + (i['totalAttempts'] as int? ?? 0));
    final pct = _items.isEmpty ? 0 : (totalFirstCorrect * 100 / _items.length).round();

    return RefreshIndicator(
      onRefresh: _fetchData,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [AppColors.primary, AppColors.primary.withValues(alpha: 0.8)],
                begin: Alignment.topLeft, end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('My Attempt History',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white)),
                const SizedBox(height: 4),
                Text('Track your performance across all attempted questions.',
                  style: TextStyle(fontSize: 14, color: Colors.white.withValues(alpha: 0.8))),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: _statCard('Questions', _items.length.toString(), 'Total attempted', Icons.book_rounded, Colors.green)),
              const SizedBox(width: 8),
              Expanded(child: _statCard('First Try', '$pct%', '$totalFirstCorrect of ${_items.length} correct', Icons.trending_up_rounded, Colors.indigo)),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(child: _statCard('Attempts', totalAttempts.toString(), 'Total submissions', Icons.repeat_rounded, Colors.amber)),
              const SizedBox(width: 8),
              Expanded(child: _statCard('XP Earned', totalXp.toString(), 'Total points', Icons.emoji_events_rounded, Colors.purple)),
            ],
          ),
          const SizedBox(height: 20),
          Text('Question History (${_items.length})',
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          ..._items.asMap().entries.map((entry) => _buildQuestionCard(entry.key, entry.value)),
        ],
      ),
    );
  }

  Widget _statCard(String label, String value, String sub, IconData icon, MaterialColor color) {
    return Container(
      padding: const EdgeInsets.all(14),
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
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(8)),
                child: Icon(icon, size: 16, color: color),
              ),
              const Spacer(),
              Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: color.shade700)),
            ],
          ),
          const SizedBox(height: 4),
          Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.onSurfaceVariant)),
          Text(sub, style: TextStyle(fontSize: 10, color: AppColors.onSurfaceVariant.withValues(alpha: 0.7))),
        ],
      ),
    );
  }

  Widget _buildQuestionCard(int index, dynamic item) {
    final q = item['question'] as Map<String, dynamic>? ?? {};
    final attempts = item['attempts'] as List? ?? [];
    final isExpanded = _expandedIndexes.contains(index);
    final isFirstCorrect = item['firstAttemptCorrect'] == true;
    final totalXp = item['totalXp'] as int? ?? 0;
    final qId = q['id'] as String? ?? '';
    final qContent = q['content'] as String? ?? '';
    final qType = q['type'] as String? ?? '';
    final qGrade = q['grade'];
    final mediaList = q['questionMedia'] as List? ?? [];
    final mediaUrl = q['mediaUrl'] as String?;
    final explanation = q['explanation'] as String?;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 1,
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => _toggleExpand(index),
        child: AnimatedCrossFade(
          firstChild: _buildCollapsed(qContent, qType, qGrade, attempts.length, isFirstCorrect, totalXp),
          secondChild: _buildExpanded(qContent, qType, qGrade, attempts, isFirstCorrect, totalXp, mediaList, mediaUrl, explanation, qId),
          crossFadeState: isExpanded ? CrossFadeState.showSecond : CrossFadeState.showFirst,
          duration: const Duration(milliseconds: 200),
          firstCurve: Curves.easeOut,
          secondCurve: Curves.easeIn,
        ),
      ),
    );
  }

  Widget _buildCollapsed(String content, String type, dynamic grade, int attemptCount, bool isFirstCorrect, int totalXp) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          HtmlWidget(content,
            textStyle: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.onSurface),
            customWidgetBuilder: (el) => null),
          const SizedBox(height: 10),
          Row(
            children: [
              if (grade != null) ...[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(color: Colors.amber.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(6)),
                  child: Text('Grade $grade', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.amber.shade700)),
                ),
                const SizedBox(width: 6),
              ],
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(6)),
                child: Text(type.replaceAll('_', ' ').toUpperCase(),
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.primary)),
              ),
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(color: Colors.grey[100], borderRadius: BorderRadius.circular(6)),
                child: Text('$attemptCount attempt(s)',
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey[600])),
              ),
              const Spacer(),
              Icon(isFirstCorrect ? Icons.check_circle_rounded : Icons.cancel_rounded,
                size: 18, color: isFirstCorrect ? Colors.green : Colors.red),
              const SizedBox(width: 4),
              Text(isFirstCorrect ? 'Correct' : 'Incorrect',
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold,
                  color: isFirstCorrect ? Colors.green : Colors.red)),
              if (totalXp > 0) ...[
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(color: Colors.amber.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(6)),
                  child: Text('+$totalXp XP', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.amber.shade700)),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildExpanded(String content, String type, dynamic grade, List attempts, bool isFirstCorrect, int totalXp,
      List mediaList, String? mediaUrl, String? explanation, String qId) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          HtmlWidget(content,
            textStyle: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.onSurface)),
          const SizedBox(height: 10),
          Row(
            children: [
              if (grade != null) ...[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(color: Colors.amber.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(6)),
                  child: Text('Grade $grade', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.amber.shade700)),
                ),
                const SizedBox(width: 6),
              ],
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(6)),
                child: Text(type.replaceAll('_', ' ').toUpperCase(),
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.primary)),
              ),
            ],
          ),
          if (mediaList.isNotEmpty || mediaUrl != null) ...[
            const SizedBox(height: 10),
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
          const SizedBox(height: 16),
          ...attempts.asMap().entries.map((entry) {
            final a = entry.value;
            final aNum = entry.key + 1;
            final answer = a['answer'] as String? ?? '';
            final isCorrect = a['isCorrect'] as bool? ?? false;
            final xp = a['xpAwarded'] as int? ?? 0;
            final attemptedAt = a['attemptedAt'] as String? ?? '';

            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey[50],
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey[200]!),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text('Attempt #$aNum',
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.primary)),
                      ),
                      const SizedBox(width: 8),
                      if (attemptedAt.isNotEmpty)
                        Text(_formatDate(attemptedAt),
                          style: TextStyle(fontSize: 11, color: Colors.grey[600])),
                      const Spacer(),
                      Icon(isCorrect ? Icons.check_circle_rounded : Icons.cancel_rounded,
                        size: 16, color: isCorrect ? Colors.green : Colors.red),
                      const SizedBox(width: 4),
                      Text(isCorrect ? 'Correct' : 'Incorrect',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold,
                          color: isCorrect ? Colors.green : Colors.red)),
                      if (xp > 0) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(color: Colors.amber.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(6)),
                          child: Text('+$xp XP', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.amber.shade700)),
                        ),
                      ],
                    ],
                  ),
                  if (answer.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.grey[100]!),
                      ),
                      child: answer.startsWith('data:image/')
                          ? ClipRRect(
                              borderRadius: BorderRadius.circular(6),
                              child: Image.memory(base64Decode(answer.split(',').last),
                                height: 120, width: double.infinity, fit: BoxFit.contain),
                            )
                          : Text(answer, style: TextStyle(fontSize: 13, color: AppColors.onSurface)),
                    ),
                  ],
                ],
              ),
            );
          }),
          if (explanation != null && explanation.isNotEmpty) ...[
            const SizedBox(height: 8),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.primary.withValues(alpha: 0.15)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Explanation:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary)),
                  const SizedBox(height: 4),
                  HtmlWidget(explanation, textStyle: TextStyle(fontSize: 13, color: AppColors.onSurface)),
                ],
              ),
            ),
          ],
        ],
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
