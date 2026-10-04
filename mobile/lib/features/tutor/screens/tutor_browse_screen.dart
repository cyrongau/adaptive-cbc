import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants.dart';
import '../services/tutor_service.dart';

class TutorBrowseScreen extends StatefulWidget {
  const TutorBrowseScreen({super.key});

  @override
  State<TutorBrowseScreen> createState() => _TutorBrowseScreenState();
}

class _TutorBrowseScreenState extends State<TutorBrowseScreen> {
  final TutorService _service = TutorService();
  final ApiClient _apiClient = ApiClient();
  final _searchController = TextEditingController();
  bool _isLoading = true;

  List<dynamic> _tutors = [];
  List<dynamic> _allSubjects = [];
  String? _selectedSubjectId;
  int? _selectedGrade;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      _tutors = await _service.browseTutors();
      final subRes = await _apiClient.dio.get(AppConstants.subjects);
      final subData = subRes.data;
      _allSubjects = (subData is List) ? subData : (subData['data'] as List?) ?? [];
    } catch (_) {}
    if (mounted) setState(() => _isLoading = false);
  }

  Future<void> _search(String q) async {
    setState(() {
      _searchQuery = q;
      _isLoading = true;
    });
    try {
      if (q.isEmpty) {
        _tutors = await _service.browseTutors(subjectId: _selectedSubjectId, grade: _selectedGrade);
      } else {
        _tutors = await _service.searchTutors(q);
      }
    } catch (_) {}
    if (mounted) setState(() => _isLoading = false);
  }

  List<dynamic> get _filteredTutors {
    if (_searchQuery.isNotEmpty) return _tutors;
    return _tutors.where((t) {
      if (_selectedSubjectId != null) {
        final subs = t['subjects'] as List? ?? [];
        final match = subs.any((s) => s['subjectId'] == _selectedSubjectId);
        if (!match) return false;
      }
      if (_selectedGrade != null) {
        final grades = t['teachingGrades'] as List? ?? [];
        if (!grades.contains(_selectedGrade)) return false;
      }
      return true;
    }).toList();
  }

  void _showFilters() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Filter Tutors', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 20),
              const Text('Subject', style: TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              InputDecorator(
                decoration: InputDecoration(border: OutlineInputBorder(borderRadius: BorderRadius.circular(12))),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _selectedSubjectId,
                    isDense: true,
                    isExpanded: true,
                    hint: const Text('All subjects'),
                    items: _allSubjects.map((s) => DropdownMenuItem(
                      value: s['id']?.toString(),
                      child: Text(s['name'] as String? ?? ''),
                    )).toList(),
                    onChanged: (v) => setSheetState(() => _selectedSubjectId = v),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Text('Grade', style: TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              InputDecorator(
                decoration: InputDecoration(border: OutlineInputBorder(borderRadius: BorderRadius.circular(12))),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<int>(
                    value: _selectedGrade,
                    isDense: true,
                    isExpanded: true,
                    hint: const Text('All grades'),
                    items: List.generate(12, (i) => DropdownMenuItem(value: i + 1, child: Text('Grade ${i + 1}'))),
                    onChanged: (v) => setSheetState(() => _selectedGrade = v),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(ctx);
                    _search(_searchController.text);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: const Text('Apply Filters'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Find a Tutor'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
        actions: [
          IconButton(icon: const Icon(Icons.filter_list_rounded), onPressed: _showFilters),
        ],
      ),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
            color: Colors.white,
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search tutors by name or subject...',
                prefixIcon: const Icon(Icons.search_rounded),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(icon: const Icon(Icons.clear_rounded), onPressed: () { _searchController.clear(); _search(''); })
                    : null,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                filled: true,
                fillColor: AppColors.background,
              ),
              onSubmitted: _search,
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _filteredTutors.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.person_search_rounded, size: 64, color: Colors.grey[300]),
                            const SizedBox(height: 16),
                            Text('No tutors found', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.grey[500])),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _loadData,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _filteredTutors.length,
                          itemBuilder: (_, i) => _buildTutorCard(_filteredTutors[i]),
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildTutorCard(dynamic tutor) {
    final user = tutor['user'] as Map<String, dynamic>? ?? {};
    final name = '${user['firstName'] ?? ''} ${user['lastName'] ?? ''}'.trim();
    final headline = tutor['headline'] as String? ?? '';
    final rating = (tutor['rating'] is num) ? (tutor['rating'] as num).toDouble() : 0.0;
    final totalSessions = tutor['totalSessions'] as int? ?? 0;
    final totalStudents = tutor['totalStudents'] as int? ?? 0;
    final subjects = tutor['subjects'] as List? ?? [];
    final minRate = subjects.isNotEmpty
        ? (subjects.map((s) => (s['hourlyRate'] as num?)?.toDouble() ?? 0).reduce((a, b) => a < b ? a : b))
        : 0.0;
    final id = tutor['id'] as String? ?? '';
    final avatar = user['avatar'] as String?;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => context.push('/tutors/$id'),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 26,
                  backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                  backgroundImage: avatar != null ? NetworkImage(avatar) : null,
                  child: avatar == null
                      ? Text(name.isNotEmpty ? name[0].toUpperCase() : 'T',
                          style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary))
                      : null,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(name.isNotEmpty ? name : 'Tutor',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      if (headline.isNotEmpty)
                        Text(headline, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                    ],
                  ),
                ),
                Row(
                  children: [
                    Icon(Icons.star_rounded, size: 18, color: Colors.amber[600]),
                    const SizedBox(width: 2),
                    Text(rating.toStringAsFixed(1), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                _infoChip(Icons.school_rounded, '$totalSessions sessions'),
                const SizedBox(width: 8),
                _infoChip(Icons.people_rounded, '$totalStudents students'),
                const Spacer(),
                Text('KSh ${minRate.toStringAsFixed(0)}/hr',
                  style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary, fontSize: 14)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _infoChip(IconData icon, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 13, color: Colors.grey[500]),
        const SizedBox(width: 4),
        Text(label, style: TextStyle(fontSize: 11, color: Colors.grey[600])),
      ],
    );
  }
}
