import 'package:flutter/material.dart';
import 'package:signature/signature.dart';
import 'dart:convert';
import 'package:flutter_widget_from_html/flutter_widget_from_html.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants.dart';
import '../../../core/theme/app_colors.dart';

class AssignmentDetailScreen extends StatefulWidget {
  final String assignmentId;
  const AssignmentDetailScreen({super.key, required this.assignmentId});

  @override
  State<AssignmentDetailScreen> createState() => _AssignmentDetailScreenState();
}

class _AssignmentDetailScreenState extends State<AssignmentDetailScreen> {
  final ApiClient _apiClient = ApiClient();

  Map<String, dynamic>? _assignment;
  List<dynamic> _questions = [];
  bool _isLoading = true;
  bool _isSubmitting = false;
  bool _submitted = false;

  Map<String, String?> _selectedOptions = {};
  Map<String, TextEditingController> _textControllers = {};
  Map<String, SignatureController> _signatureControllers = {};

  @override
  void initState() {
    super.initState();
    _fetchDetail();
  }

  @override
  void dispose() {
    for (final c in _textControllers.values) c.dispose();
    for (final c in _signatureControllers.values) c.dispose();
    super.dispose();
  }

  Future<void> _fetchDetail() async {
    setState(() => _isLoading = true);
    try {
      final results = await Future.wait([
        _apiClient.dio.get('${AppConstants.assignments}/${widget.assignmentId}'),
        _apiClient.dio.get('${AppConstants.assignments}/${widget.assignmentId}/questions'),
      ]);
      if (results[0].statusCode == 200 && results[1].statusCode == 200 && mounted) {
        final assignment = results[0].data as Map<String, dynamic>;
        final questions = results[1].data as List? ?? [];
        final submission = assignment['submission'] as Map<String, dynamic>?;
        setState(() {
          _assignment = assignment;
          _questions = questions;
          _submitted = assignment['submitted'] == true || submission != null;
          _isLoading = false;
        });
        for (final q in questions) {
          final qId = q['id'] as String;
          if (q['type'] == 'drawing_canvas') {
            continue;
          } else if (!(q['options'] is List && (q['options'] as List).isNotEmpty)) {
            _textControllers[qId] = TextEditingController();
          }
        }
        if (mounted) setState(() {});
      }
    } catch (_) {
      if (mounted) {
        setState(() => _isLoading = false);
        _showError('Failed to load assignment');
      }
    }
  }

  void _showError(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: Colors.red));
  }

  Future<void> _submitAssignment() async {
    final answers = <Map<String, dynamic>>[];
    for (final q in _questions) {
      final qId = q['id'] as String;
      final type = q['type'] as String? ?? '';
      String? answer;

      if (type == 'drawing_canvas') {
        final ctrl = _signatureControllers[qId];
        if (ctrl != null && !ctrl.isEmpty) {
          final pngBytes = await ctrl.toPngBytes();
          if (pngBytes != null) answer = 'data:image/png;base64,' + base64Encode(pngBytes);
        }
      } else if (q['options'] is List && (q['options'] as List).isNotEmpty) {
        answer = _selectedOptions[qId];
      } else {
        answer = _textControllers[qId]?.text.trim();
      }
      answers.add({'questionId': qId, 'answer': answer ?? ''});
    }

    setState(() => _isSubmitting = true);
    try {
      await _apiClient.dio.post('${AppConstants.assignments}/${widget.assignmentId}/submit', data: {
        'answers': answers,
      });
      if (mounted) {
        setState(() {
          _submitted = true;
          _isSubmitting = false;
        });
        _showSuccess('Assignment submitted successfully!');
        _fetchDetail();
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSubmitting = false);
        _showError('Failed to submit assignment');
      }
    }
  }

  void _showSuccess(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: Colors.green));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(_assignment?['title'] as String? ?? 'Assignment'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _buildBody(),
    );
  }

  Widget _buildBody() {
    final assignment = _assignment;
    if (assignment == null) {
      return const Center(child: Text('Assignment not found'));
    }

    final title = assignment['title'] as String? ?? 'Untitled';
    final description = assignment['description'] as String?;
    final dueDate = assignment['dueDate'] as String?;
    final subject = assignment['subject'] is Map
        ? assignment['subject']['name']
        : (assignment['subjectName'] as String? ?? 'General');
    final grade = assignment['grade'];
    final submission = assignment['submission'] as Map<String, dynamic>?;
    final feedback = submission?['feedback'] as String?;
    final answers = submission?['answers'] as List? ?? [];

    return RefreshIndicator(
      onRefresh: _fetchDetail,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Card(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              elevation: 1,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Row(children: [
                      Icon(Icons.book_rounded, size: 16, color: AppColors.onSurfaceVariant),
                      const SizedBox(width: 4),
                      Text(subject, style: TextStyle(color: AppColors.onSurfaceVariant)),
                    ]),
                    if (dueDate != null) ...[
                      const SizedBox(height: 4),
                      Row(children: [
                        Icon(Icons.calendar_today_rounded, size: 16, color: AppColors.onSurfaceVariant),
                        const SizedBox(width: 4),
                        Text('Due: ${_formatDate(dueDate)}', style: TextStyle(color: AppColors.onSurfaceVariant)),
                      ]),
                    ],
                    if (grade != null) ...[
                      const SizedBox(height: 4),
                      Row(children: [
                        Icon(Icons.grade_rounded, size: 16, color: Colors.green),
                        const SizedBox(width: 4),
                        Text('Grade: $grade%', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
                      ]),
                    ],
                    if (_submitted)
                      Container(
                        margin: const EdgeInsets.only(top: 12),
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.green.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.check_circle_rounded, size: 16, color: Colors.green),
                            SizedBox(width: 6),
                            Text('Submitted', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
            ),
            if (description != null && description.isNotEmpty) ...[
              const SizedBox(height: 16),
              Card(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                elevation: 0,
                color: Colors.grey[50],
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Description', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                      const SizedBox(height: 6),
                      HtmlWidget(description, textStyle: TextStyle(fontSize: 14, color: AppColors.onSurface)),
                    ],
                  ),
                ),
              ),
            ],
            const SizedBox(height: 20),
            Text('Questions (${_questions.length})',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            if (_questions.isEmpty)
              const Padding(
                padding: EdgeInsets.all(32),
                child: Center(child: Text('No questions in this assignment.')),
              )
            else ...[
              ..._questions.asMap().entries.map((entry) {
                final i = entry.key;
                final q = entry.value;
                final qId = q['id'] as String;
                final type = q['type'] as String? ?? '';
                final options = q['options'] as List? ?? [];
                final hasOptions = options.isNotEmpty;
                final answeredAnswer = answers.isNotEmpty
                    ? answers.firstWhere(
                        (a) => a['questionId'] == qId,
                        orElse: () => null,
                      )
                    : null;
                final answerValue = answeredAnswer?['answer'] as String?;
                final isCorrect = answeredAnswer?['isCorrect'] as bool?;
                final evalFeedback = answeredAnswer?['feedback'] as String?;
                final mediaList = q['questionMedia'] as List? ?? [];
                final mediaUrl = q['mediaUrl'] as String?;

                final mediaWidgets = (mediaList.isNotEmpty || mediaUrl != null)
                    ? <Widget>[
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
                      ]
                    : <Widget>[];

                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
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
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: AppColors.primary.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text('Q${i + 1}',
                                style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primary)),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: Colors.grey[100],
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(type.replaceAll('_', ' ').toUpperCase(),
                                style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey[600])),
                            ),
                            if (isCorrect != null) ...[
                              const SizedBox(width: 8),
                              Icon(isCorrect ? Icons.check_circle_rounded : Icons.cancel_rounded,
                                size: 16, color: isCorrect ? Colors.green : Colors.red),
                              const SizedBox(width: 4),
                              Text(isCorrect ? 'Correct' : 'Incorrect',
                                style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold,
                                  color: isCorrect ? Colors.green : Colors.red)),
                            ],
                          ],
                        ),
                        const SizedBox(height: 10),
                        HtmlWidget(q['content'] as String? ?? '',
                          textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                        ...mediaWidgets,
                        const SizedBox(height: 12),
                        if (!_submitted) ...[
                          if (type == 'drawing_canvas') ...[
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(20),
                              decoration: BoxDecoration(
                                color: Colors.grey[50],
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: Colors.grey[200]!),
                              ),
                              child: Column(
                                children: [
                                  Icon(Icons.draw_outlined, size: 40, color: Colors.grey[400]),
                                  const SizedBox(height: 12),
                                  Text('Drawing questions are not available on mobile devices.',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(fontSize: 14, color: Colors.grey[600])),
                                ],
                              ),
                            ),
                          ] else if (hasOptions) ...[
                            ...options.map<Widget>((opt) {
                              final optId = opt['id'] as String? ?? '';
                              final optText = opt['text'] as String? ?? opt['value'] as String? ?? '';
                              return RadioListTile<String>(
                                title: HtmlWidget(optText, textStyle: const TextStyle(fontSize: 14)),
                                value: optId,
                                groupValue: _selectedOptions[qId],
                                onChanged: (val) => setState(() => _selectedOptions[qId] = val),
                                contentPadding: EdgeInsets.zero,
                                dense: true,
                              );
                            }),
                          ] else ...[
                            TextField(
                              controller: _textControllers[qId] ?? TextEditingController(),
                              decoration: InputDecoration(
                                hintText: 'Type your answer...',
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                              ),
                              maxLines: 3,
                            ),
                          ],
                        ] else if (answerValue != null && answerValue.isNotEmpty) ...[
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: Colors.grey[50],
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: Colors.grey[200]!),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Your answer:', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey[600])),
                                const SizedBox(height: 4),
                                if (answerValue.startsWith('data:image/'))
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(8),
                                    child: Image.memory(base64Decode(answerValue.split(',').last),
                                      height: 140, width: double.infinity, fit: BoxFit.contain),
                                  )
                                else
                                  Text(answerValue, style: const TextStyle(fontSize: 14)),
                              ],
                            ),
                          ),
                        ],
                        if (evalFeedback != null && evalFeedback.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.06),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(evalFeedback, style: TextStyle(fontSize: 13, color: AppColors.primary)),
                          ),
                        ],
                      ],
                    ),
                  ),
                );
              }),
              if (!_submitted) ...[
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: _isSubmitting ? null : _submitAssignment,
                    icon: _isSubmitting
                        ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Icon(Icons.send_rounded),
                    label: Text(_isSubmitting ? 'Submitting...' : 'Submit Assignment',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                  ),
                ),
              ],
              if (submission != null && feedback != null) ...[
                const SizedBox(height: 16),
                Card(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 0,
                  color: Colors.blue.withValues(alpha: 0.06),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.feedback_rounded, size: 18, color: Colors.blue),
                            const SizedBox(width: 8),
                            const Text('Teacher Feedback', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                          ],
                        ),
                        const SizedBox(height: 8),
                        HtmlWidget(feedback, textStyle: const TextStyle(fontSize: 14)),
                      ],
                    ),
                  ),
                ),
              ],
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
