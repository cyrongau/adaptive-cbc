import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants.dart';
import '../../../core/theme/app_colors.dart';

class AuthorStudioScreen extends StatefulWidget {
  const AuthorStudioScreen({super.key});

  @override
  State<AuthorStudioScreen> createState() => _AuthorStudioScreenState();
}

class _AuthorStudioScreenState extends State<AuthorStudioScreen> {
  final ApiClient _apiClient = ApiClient();
  final _formKey = GlobalKey<FormState>();
  bool _isSaving = false;

  List<dynamic> _subjects = [];
  final Map<String, List<dynamic>> _topicsCache = {};
  bool _isLoadingSubjects = true;

  String? _selectedSubjectId;
  String? _selectedTopicId;
  int? _selectedGrade;
  String _questionType = 'multiple_choice';
  final _contentController = TextEditingController();
  final _correctAnswerController = TextEditingController();
  final _explanationController = TextEditingController();
  final _marksController = TextEditingController(text: '1');
  String _difficulty = 'medium';
  bool _trueFalseCorrect = true;

  final List<Map<String, dynamic>> _options = [];
  int? _correctOptionIndex;

  @override
  void initState() {
    super.initState();
    _fetchSubjects();
    _addOption();
    _addOption();
  }

  @override
  void dispose() {
    _contentController.dispose();
    _correctAnswerController.dispose();
    _explanationController.dispose();
    _marksController.dispose();
    super.dispose();
  }

  Future<void> _fetchSubjects() async {
    try {
      final res = await _apiClient.dio.get(AppConstants.subjects);
      if (res.statusCode == 200 && mounted) {
        setState(() {
          _subjects = res.data as List? ?? [];
          _isLoadingSubjects = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoadingSubjects = false);
    }
  }

  Future<void> _fetchTopics(String subjectId) async {
    if (_topicsCache.containsKey(subjectId)) return;
    try {
      final res = await _apiClient.dio.get('${AppConstants.subjects}/$subjectId/topics');
      if (res.statusCode == 200 && mounted) {
        setState(() => _topicsCache[subjectId] = res.data as List? ?? []);
      }
    } catch (_) {}
  }

  void _addOption() {
    setState(() => _options.add({'id': '', 'text': '', 'isCorrect': false}));
  }

  void _removeOption(int index) {
    if (_options.length <= 2) return;
    setState(() {
      _options.removeAt(index);
      if (_correctOptionIndex == index) {
        _correctOptionIndex = null;
      } else if (_correctOptionIndex != null && _correctOptionIndex! > index) {
        _correctOptionIndex = _correctOptionIndex! - 1;
      }
    });
  }

  Future<void> _save({required bool submitForReview}) async {
    if (!_formKey.currentState!.validate()) return;

    if (_questionType == 'multiple_choice') {
      if (_correctOptionIndex == null) {
        _showError('Please select the correct answer');
        return;
      }
      if (_options.any((o) => (o['text'] as String).trim().isEmpty)) {
        _showError('All options must have text');
        return;
      }
    }
    if (_questionType == 'short_answer' && _correctAnswerController.text.trim().isEmpty) {
      _showError('Please enter the correct answer');
      return;
    }
    if (_contentController.text.trim().isEmpty) {
      _showError('Please enter question content');
      return;
    }

    setState(() => _isSaving = true);

    final payload = <String, dynamic>{
      'subjectId': _selectedSubjectId,
      'grade': _selectedGrade,
      'type': _questionType,
      'content': _contentController.text.trim(),
      'difficulty': _difficulty,
      'marks': int.tryParse(_marksController.text) ?? 1,
      'explanation': _explanationController.text.trim().isNotEmpty
          ? _explanationController.text.trim() : null,
    };
    if (_selectedTopicId != null) payload['topicId'] = _selectedTopicId;

    if (_questionType == 'multiple_choice') {
      final opts = _options.asMap().entries.map((entry) {
        final i = entry.key;
        final o = entry.value;
        return {
          'id': o['id'] ?? 'opt_$i',
          'text': o['text'],
          'isCorrect': i == _correctOptionIndex,
        };
      }).toList();
      payload['options'] = opts;
    } else if (_questionType == 'true_false') {
      payload['correctAnswer'] = _trueFalseCorrect ? 'true' : 'false';
    } else {
      payload['correctAnswer'] = _correctAnswerController.text.trim();
    }

    if (submitForReview) payload['status'] = 'pending_review';

    try {
      await _apiClient.dio.post('${AppConstants.questions}/structured', data: payload);
      if (mounted) {
        setState(() => _isSaving = false);
        _showSuccess(submitForReview ? 'Submitted for review' : 'Saved as draft');
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSaving = false);
        _showError('Failed to save question');
      }
    }
  }

  void _showError(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: Colors.red));
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
        title: const Text('Author Studio'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
      ),
      body: _isLoadingSubjects
          ? const Center(child: CircularProgressIndicator())
          : Form(
              key: _formKey,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  _sectionHeader('Curriculum'),
                  _buildSubjectDropdown(),
                  const SizedBox(height: 12),
                  _buildGradeDropdown(),
                  const SizedBox(height: 12),
                  _buildTopicDropdown(),
                  const SizedBox(height: 20),
                  _sectionHeader('Question Details'),
                  _buildTypeDropdown(),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _contentController,
                    decoration: InputDecoration(
                      labelText: 'Question Content',
                      hintText: 'Enter your question...',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      contentPadding: const EdgeInsets.all(16),
                    ),
                    maxLines: 4,
                    validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
                  ),
                  if (_questionType == 'multiple_choice') ...[
                    const SizedBox(height: 16),
                    _buildOptionsSection(),
                  ] else if (_questionType == 'true_false') ...[
                    const SizedBox(height: 12),
                    _buildTrueFalseToggle(),
                  ] else ...[
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _correctAnswerController,
                      decoration: InputDecoration(
                        labelText: 'Correct Answer',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        contentPadding: const EdgeInsets.all(16),
                      ),
                      maxLines: 2,
                    ),
                  ],
                  const SizedBox(height: 20),
                  _sectionHeader('Additional Info'),
                  _buildDifficultyDropdown(),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _marksController,
                    decoration: InputDecoration(
                      labelText: 'Marks',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      contentPadding: const EdgeInsets.all(16),
                    ),
                    keyboardType: TextInputType.number,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _explanationController,
                    decoration: InputDecoration(
                      labelText: 'Explanation (optional)',
                      hintText: 'Explain the correct answer...',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      contentPadding: const EdgeInsets.all(16),
                    ),
                    maxLines: 3,
                  ),
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: _isSaving ? null : () => _save(submitForReview: false),
                          icon: const Icon(Icons.save_rounded, size: 18),
                          label: const Text('Save Draft', style: TextStyle(fontWeight: FontWeight.bold)),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: _isSaving ? null : () => _save(submitForReview: true),
                          icon: _isSaving
                              ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                              : const Icon(Icons.send_rounded, size: 18),
                          label: const Text('Submit', style: TextStyle(fontWeight: FontWeight.bold)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),
                ],
              ),
            ),
    );
  }

  Widget _sectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(title, style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.primary)),
    );
  }

  Widget _buildSubjectDropdown() {
    return DropdownButtonFormField<String>(
      value: _selectedSubjectId,
      decoration: InputDecoration(
        labelText: 'Subject',
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      items: _subjects.map<DropdownMenuItem<String>>((s) => DropdownMenuItem(
        value: s['id'] as String?,
        child: Text(s['name'] as String? ?? ''),
      )).toList(),
      onChanged: (val) {
        setState(() {
          _selectedSubjectId = val;
          _selectedTopicId = null;
        });
        if (val != null) _fetchTopics(val);
      },
      validator: (v) => v == null ? 'Required' : null,
    );
  }

  Widget _buildGradeDropdown() {
    return DropdownButtonFormField<int>(
      value: _selectedGrade,
      decoration: InputDecoration(
        labelText: 'Grade',
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      items: List.generate(12, (i) => i + 1).map<DropdownMenuItem<int>>((g) => DropdownMenuItem(
        value: g,
        child: Text('Grade $g'),
      )).toList(),
      onChanged: (val) => setState(() => _selectedGrade = val),
      validator: (v) => v == null ? 'Required' : null,
    );
  }

  Widget _buildTopicDropdown() {
    final topics = _selectedSubjectId != null ? (_topicsCache[_selectedSubjectId] ?? []) : [];
    return DropdownButtonFormField<String>(
      value: _selectedTopicId,
      decoration: InputDecoration(
        labelText: 'Topic (optional)',
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      items: [
        const DropdownMenuItem(value: null, child: Text('None')),
        ...topics.map<DropdownMenuItem<String>>((t) => DropdownMenuItem(
          value: t['id'] as String?,
          child: Text(t['name'] as String? ?? ''),
        )),
      ],
      onChanged: (val) => setState(() => _selectedTopicId = val),
    );
  }

  Widget _buildTypeDropdown() {
    return DropdownButtonFormField<String>(
      value: _questionType,
      decoration: InputDecoration(
        labelText: 'Question Type',
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      items: const [
        DropdownMenuItem(value: 'multiple_choice', child: Text('Multiple Choice')),
        DropdownMenuItem(value: 'short_answer', child: Text('Short Answer')),
        DropdownMenuItem(value: 'true_false', child: Text('True/False')),
        DropdownMenuItem(value: 'drawing_canvas', child: Text('Drawing Canvas')),
      ],
      onChanged: (val) {
        if (val != null) setState(() => _questionType = val);
      },
    );
  }

  Widget _buildOptionsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Text('Options', style: TextStyle(fontWeight: FontWeight.bold)),
            const Spacer(),
            TextButton.icon(
              onPressed: _addOption,
              icon: const Icon(Icons.add_rounded, size: 18),
              label: const Text('Add'),
              style: TextButton.styleFrom(foregroundColor: AppColors.primary),
            ),
          ],
        ),
        ..._options.asMap().entries.map((entry) {
          final i = entry.key;
          final opt = entry.value;
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(
              children: [
                GestureDetector(
                  onTap: () => setState(() => _correctOptionIndex = i),
                  child: Container(
                    width: 24, height: 24,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: _correctOptionIndex == i ? Colors.green : Colors.transparent,
                      border: Border.all(color: _correctOptionIndex == i ? Colors.green : Colors.grey[400]!, width: 2),
                    ),
                    child: _correctOptionIndex == i
                        ? const Icon(Icons.check_rounded, size: 16, color: Colors.white)
                        : null,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: TextFormField(
                    initialValue: opt['text'] as String? ?? '',
                    decoration: InputDecoration(
                      hintText: 'Option ${String.fromCharCode(65 + i)}',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                      isDense: true,
                    ),
                    onChanged: (v) => opt['text'] = v,
                  ),
                ),
                if (_options.length > 2)
                  IconButton(
                    icon: Icon(Icons.remove_circle_outline_rounded, size: 20, color: Colors.red[300]),
                    onPressed: () => _removeOption(i),
                  ),
              ],
            ),
          );
        }),
      ],
    );
  }

  Widget _buildTrueFalseToggle() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey[300]!),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Correct Answer', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: () => setState(() => _trueFalseCorrect = true),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    decoration: BoxDecoration(
                      color: _trueFalseCorrect ? Colors.green : Colors.grey[100],
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Center(
                      child: Text('True',
                        style: TextStyle(fontWeight: FontWeight.bold,
                          color: _trueFalseCorrect ? Colors.white : Colors.grey[600])),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: GestureDetector(
                  onTap: () => setState(() => _trueFalseCorrect = false),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    decoration: BoxDecoration(
                      color: !_trueFalseCorrect ? Colors.red : Colors.grey[100],
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Center(
                      child: Text('False',
                        style: TextStyle(fontWeight: FontWeight.bold,
                          color: !_trueFalseCorrect ? Colors.white : Colors.grey[600])),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDifficultyDropdown() {
    return DropdownButtonFormField<String>(
      value: _difficulty,
      decoration: InputDecoration(
        labelText: 'Difficulty',
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      items: const [
        DropdownMenuItem(value: 'easy', child: Text('Easy')),
        DropdownMenuItem(value: 'medium', child: Text('Medium')),
        DropdownMenuItem(value: 'hard', child: Text('Hard')),
      ],
      onChanged: (val) {
        if (val != null) setState(() => _difficulty = val);
      },
    );
  }
}
