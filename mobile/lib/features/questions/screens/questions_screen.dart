import 'package:flutter/material.dart';
import 'package:signature/signature.dart';
import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter_widget_from_html/flutter_widget_from_html.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants.dart';
import '../../../core/theme/app_colors.dart';

class QuestionsScreen extends StatefulWidget {
  const QuestionsScreen({super.key});

  @override
  State<QuestionsScreen> createState() => _QuestionsScreenState();
}

class _QuestionsScreenState extends State<QuestionsScreen> {
  final ApiClient _apiClient = ApiClient();
  final ScrollController _scrollController = ScrollController();

  List<dynamic> _questions = [];
  List<dynamic> _subjects = [];
  final Map<String, List<dynamic>> _topicsCache = {};
  bool _isLoadingQuestions = true;

  String? _selectedSubjectId;
  String? _selectedTopicId;
  int? _selectedGrade;

  Map<String, String?> _selectedOptions = {};
  Map<String, TextEditingController> _textControllers = {};
  Map<String, SignatureController> _signatureControllers = {};
  Map<String, bool> _submitting = {};
  Map<String, Map<String, dynamic>?> _results = {};

  @override
  void initState() {
    super.initState();
    _fetchSubjects();
    _fetchQuestions();
  }

  @override
  void dispose() {
    _scrollController.dispose();
    for (final c in _textControllers.values) {
      c.dispose();
    }
    for (final c in _signatureControllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _fetchSubjects() async {
    try {
      final res = await _apiClient.dio.get(AppConstants.subjects);
      if (res.statusCode == 200 && mounted) {
        setState(() {
          _subjects = res.data as List? ?? [];
        });
      }
    } catch (_) {
      // silently fail
    }
  }

  Future<void> _fetchTopics(String subjectId) async {
    if (_topicsCache.containsKey(subjectId)) return;
    try {
      final res = await _apiClient.dio.get('${AppConstants.subjects}/$subjectId/topics');
      if (res.statusCode == 200 && mounted) {
        setState(() {
          _topicsCache[subjectId] = res.data as List? ?? [];
        });
      }
    } catch (_) {}
  }

  Future<void> _fetchQuestions() async {
    setState(() => _isLoadingQuestions = true);
    try {
      final params = <String, dynamic>{
        'status': 'published',
        'limit': 50,
      };
      if (_selectedSubjectId != null) params['subjectId'] = _selectedSubjectId;
      if (_selectedTopicId != null) params['topicId'] = _selectedTopicId;
      if (_selectedGrade != null) params['grade'] = _selectedGrade;

      final res = await _apiClient.dio.get(AppConstants.questions, queryParameters: params);
      if (res.statusCode == 200 && mounted) {
        final data = res.data;
        final questions = (data is List) ? data : ((data['questions'] as List?) ?? []);
        setState(() {
          _questions = questions;
          _isLoadingQuestions = false;
          _selectedOptions = {};
          _textControllers = {};
          _signatureControllers = {};
          _results = {};
          _submitting = {};
        });
        for (final q in _questions) {
          final qId = q['id'] as String;
          if (q['type'] == 'drawing_canvas') {
            _results[qId] = {'skipped': true};
          } else if (!(q['options'] is List && (q['options'] as List).isNotEmpty)) {
            _textControllers[qId] = TextEditingController();
          }
        }
        if (mounted) setState(() {});
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoadingQuestions = false);
        _showError('Failed to load questions. Check your connection.');
      }
    }
  }

  void _showError(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: Colors.red));
  }

  Future<void> _submitAnswer(String questionId, {bool skip = false}) async {
    final question = _questions.firstWhere((q) => q['id'] == questionId, orElse: () => null);
    if (question == null) return;

    String? answer;
    final type = question['type'] as String? ?? '';

    if (!skip) {
      if (type == 'drawing_canvas') {
        final controller = _signatureControllers[questionId];
        if (controller == null || controller.isEmpty) {
          _showError('Please draw your answer first');
          return;
        }
        final Uint8List? pngBytes = await controller.toPngBytes();
        if (pngBytes != null) {
          answer = 'data:image/png;base64,' + base64Encode(pngBytes);
        }
      } else if (question['options'] is List && (question['options'] as List).isNotEmpty) {
        answer = _selectedOptions[questionId];
        if (answer == null || answer.isEmpty) {
          _showError('Please select an answer');
          return;
        }
      } else {
        answer = _textControllers[questionId]?.text.trim() ?? '';
        if (answer.isEmpty) {
          _showError('Please enter an answer');
          return;
        }
      }
    } else {
      setState(() {
        _results[questionId] = {'skipped': true};
        _submitting[questionId] = false;
      });
      return;
    }

    setState(() => _submitting[questionId] = true);

    try {
      final res = await _apiClient.dio.post(
        '${AppConstants.questions}/$questionId/check',
        data: {'answer': answer ?? ''},
      );
      if (res.statusCode == 200 && mounted) {
        setState(() {
          _results[questionId] = res.data as Map<String, dynamic>? ?? {};
          _submitting[questionId] = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _submitting[questionId] = false);
        _showError('Failed to submit answer');
      }
    }
  }

  void _showFilterSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(builder: (ctx, setSheetState) {
          return Container(
            padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  margin: const EdgeInsets.only(top: 12),
                  width: 40, height: 4,
                  decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2)),
                ),
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Text('Filter Questions', style: Theme.of(ctx).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
                ),
                if (_selectedGrade == null && _subjects.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Text('Select your grade in Profile to enable grade-specific filtering.',
                      style: TextStyle(color: AppColors.onSurfaceVariant, fontSize: 13), textAlign: TextAlign.center),
                  ),
                const SizedBox(height: 8),
                if (_subjects.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: DropdownButtonFormField<String>(
                      value: _selectedSubjectId,
                      decoration: const InputDecoration(labelText: 'Subject', border: OutlineInputBorder()),
                      items: _subjects.map<DropdownMenuItem<String>>((s) => DropdownMenuItem(
                        value: s['id'] as String?,
                        child: Text(s['name'] as String? ?? ''),
                      )).toList(),
                      onChanged: (val) {
                        setSheetState(() => _selectedSubjectId = val);
                        if (val != null) _fetchTopics(val);
                      },
                    ),
                  ),
                const SizedBox(height: 12),
                if (_selectedSubjectId != null && _topicsCache[_selectedSubjectId] != null)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: DropdownButtonFormField<String>(
                      value: _selectedTopicId,
                      decoration: const InputDecoration(labelText: 'Topic', border: OutlineInputBorder()),
                      items: (_topicsCache[_selectedSubjectId])?.map<DropdownMenuItem<String>>((t) => DropdownMenuItem(
                        value: t['id'] as String?,
                        child: Text(t['name'] as String? ?? ''),
                      )).toList() ?? [],
                      onChanged: (val) => setSheetState(() => _selectedTopicId = val),
                    ),
                  ),
                const SizedBox(height: 20),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(ctx);
                        _fetchQuestions();
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Apply Filters', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
              ],
            ),
          );
        });
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Question Bank'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
        actions: [
          IconButton(
            icon: Badge(
              isLabelVisible: _selectedSubjectId != null || _selectedTopicId != null || _selectedGrade != null,
              child: const Icon(Icons.filter_list_rounded),
            ),
            onPressed: _showFilterSheet,
          ),
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _fetchQuestions,
          ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoadingQuestions) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_questions.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.quiz_outlined, size: 72, color: AppColors.primary.withOpacity(0.3)),
              const SizedBox(height: 20),
              const Text('No Questions Found',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.onSurface)),
              const SizedBox(height: 10),
              Text('Try adjusting your filters or check back later.',
                style: TextStyle(fontSize: 14, color: AppColors.onSurfaceVariant), textAlign: TextAlign.center),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: () {
                  setState(() {
                    _selectedSubjectId = null;
                    _selectedTopicId = null;
                    _selectedGrade = null;
                  });
                  _fetchQuestions();
                },
                icon: const Icon(Icons.clear_all_rounded),
                label: const Text('Clear Filters'),
              ),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _fetchQuestions,
      child: ListView.builder(
        controller: _scrollController,
        padding: const EdgeInsets.all(16),
        itemCount: _questions.length,
        itemBuilder: (ctx, i) => _buildQuestionCard(_questions[i]),
      ),
    );
  }

  Widget _buildQuestionCard(dynamic question) {
    final qId = question['id'] as String;
    final type = question['type'] as String? ?? '';
    final options = question['options'] as List? ?? [];
    final hasOptions = options.isNotEmpty;
    final result = _results[qId];
    final isSubmitted = result != null;
    final isSkipped = result?['skipped'] == true;
    final isCorrect = !isSkipped && result?['correct'] == true;
    final needsReview = !isSkipped && result?['needsReview'] == true;
    final xpAwarded = result?['xpAwarded'] as int? ?? 0;
    final explanation = result?['explanation'] as String? ?? question['explanation'] as String?;
    final correctAnswer = result?['correctAnswer'] as String? ?? question['correctAnswer'] as String?;
    final mediaList = question['questionMedia'] as List? ?? [];
    final mediaUrl = question['mediaUrl'] as String?;

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
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    type.replaceAll('_', ' ').toUpperCase(),
                    style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.primary),
                  ),
                ),
                const SizedBox(width: 8),
                if (question['grade'] != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.amber.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      'Grade ${question['grade']}',
                      style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.amber),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            HtmlWidget(
              question['content'] as String? ?? '',
              textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.onSurface),
            ),
            if (mediaList.isNotEmpty || mediaUrl != null) ...[
              const SizedBox(height: 10),
              if (mediaList.isNotEmpty)
                ...mediaList.map<Widget>((m) {
                  final url = m['url'] as String? ?? '';
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: Image.network(url, height: 180, width: double.infinity, fit: BoxFit.contain,
                        errorBuilder: (_, __, ___) => const SizedBox.shrink()),
                    ),
                  );
                }),
              if (mediaList.isEmpty && mediaUrl != null)
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: Image.network(mediaUrl, height: 180, width: double.infinity, fit: BoxFit.contain,
                    errorBuilder: (_, __, ___) => const SizedBox.shrink()),
                ),
            ],
            const SizedBox(height: 16),
            if (!isSubmitted) ...[
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
              if (type != 'drawing_canvas') ...[
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton(
                        onPressed: _submitting[qId] == true ? null : () => _submitAnswer(qId),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: _submitting[qId] == true
                            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                            : const Text('Submit', style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ),
                    const SizedBox(width: 12),
                    OutlinedButton(
                      onPressed: _submitting[qId] == true ? null : () => _submitAnswer(qId, skip: true),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        side: BorderSide(color: Colors.grey[400]!),
                      ),
                      child: const Text('Skip', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ],
            ] else ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: isSkipped
                      ? Colors.grey.withOpacity(0.12)
                      : needsReview
                          ? Colors.amber.withOpacity(0.12)
                          : isCorrect
                              ? Colors.green.withOpacity(0.12)
                              : Colors.red.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Icon(
                      isSkipped ? Icons.skip_next_rounded
                          : needsReview ? Icons.access_time_rounded
                          : isCorrect ? Icons.check_circle_rounded
                          : Icons.cancel_rounded,
                      color: isSkipped ? Colors.grey
                          : needsReview ? Colors.amber
                          : isCorrect ? Colors.green
                          : Colors.red,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        isSkipped ? 'Skipped' : needsReview ? 'Submitted for review' : (isCorrect ? 'Correct!' : 'Incorrect'),
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                          color: isSkipped ? Colors.grey
                              : needsReview ? Colors.amber.shade800
                              : isCorrect ? Colors.green.shade800
                              : Colors.red.shade800,
                        ),
                      ),
                    ),
                    if (!isSkipped && xpAwarded > 0)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.amber.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text('+$xpAwarded XP', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.amber)),
                      ),
                  ],
                ),
              ),
              if (!isCorrect && !needsReview && correctAnswer != null && correctAnswer.isNotEmpty && correctAnswer != 'Requires human review') ...[
                const SizedBox(height: 10),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.green.withOpacity(0.06),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.green.withOpacity(0.2)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Correct Answer:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.green)),
                      const SizedBox(height: 4),
                      HtmlWidget(correctAnswer, textStyle: const TextStyle(fontSize: 14, color: AppColors.onSurface)),
                    ],
                  ),
                ),
              ],
              if (explanation != null && explanation.isNotEmpty) ...[
                const SizedBox(height: 10),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.06),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.primary.withOpacity(0.15)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Explanation:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary)),
                      const SizedBox(height: 4),
                      HtmlWidget(explanation, textStyle: const TextStyle(fontSize: 14, color: AppColors.onSurface)),
                    ],
                  ),
                ),
              ],
            ],
          ],
        ),
      ),
    );
  }
}
