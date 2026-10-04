import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/offline_indicator.dart';

class CoursesScreen extends StatefulWidget {
  const CoursesScreen({super.key});

  @override
  State<CoursesScreen> createState() => _CoursesScreenState();
}

class _CoursesScreenState extends State<CoursesScreen> with SingleTickerProviderStateMixin {
  final ApiClient _apiClient = ApiClient();
  late TabController _tabController;

  List<dynamic> _enrolled = [];
  List<dynamic> _available = [];
  bool _isLoadingEnrolled = true;
  bool _isLoadingAvailable = true;
  String? _enrolledError;
  String? _availableError;

  String _searchQuery = '';
  String? _selectedSubject;
  final TextEditingController _searchController = TextEditingController();

  List<String> get _subjects {
    final subs = _available
        .map((c) => c['subject'] as String? ?? '')
        .where((s) => s.isNotEmpty)
        .toSet()
        .toList();
    subs.sort();
    return subs;
  }

  List<dynamic> get _filteredAvailable {
    var list = List<dynamic>.from(_available);
    if (_searchQuery.isNotEmpty) {
      final q = _searchQuery.toLowerCase();
      list = list.where((c) =>
        (c['title'] as String? ?? '').toLowerCase().contains(q) ||
        (c['description'] as String? ?? '').toLowerCase().contains(q) ||
        (c['subtitle'] as String? ?? '').toLowerCase().contains(q)
      ).toList();
    }
    if (_selectedSubject != null) {
      list = list.where((c) => (c['subject'] as String? ?? '') == _selectedSubject).toList();
    }
    return list;
  }

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _fetchEnrolled();
    _fetchAvailable();
    _searchController.addListener(() {
      setState(() => _searchQuery = _searchController.text.trim().toLowerCase());
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _fetchEnrolled() async {
    setState(() { _isLoadingEnrolled = true; _enrolledError = null; });
    try {
      final res = await _apiClient.dio.get(AppConstants.enrollments);
      if (res.statusCode == 200 && mounted) {
        final data = res.data;
        List<dynamic> enrollments = [];
        if (data is List) {
          enrollments = data;
        } else if (data['data'] is List) {
          enrollments = data['data'] as List;
        } else if (data['enrollments'] is List) {
          enrollments = data['enrollments'] as List;
        }

        setState(() {
          _enrolled = enrollments.where((e) {
            final status = (e['status'] as String? ?? '').toLowerCase();
            return status == 'active' || status == 'completed';
          }).toList();
          _enrolledIds.clear();
          for (final e in _enrolled) {
            final c = e['course'];
            final id = c is Map ? c['id']?.toString() : e['courseId']?.toString();
            if (id != null) _enrolledIds.add(id);
          }
          _isLoadingEnrolled = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() { _enrolledError = 'Could not load enrolled courses.'; _isLoadingEnrolled = false; });
    }
  }

  Future<void> _fetchAvailable() async {
    setState(() { _isLoadingAvailable = true; _availableError = null; });
    try {
      final res = await _apiClient.dio.get(AppConstants.courses);
      if (res.statusCode == 200 && mounted) {
        final data = res.data;
        List<dynamic> courses = [];
        if (data is List) {
          courses = data;
        } else if (data['data'] is List) {
          courses = data['data'] as List;
        } else if (data['courses'] is List) {
          courses = data['courses'] as List;
        }

        // Exclude already enrolled courses
        final enrolledIds = _enrolled.map((e) {
          final course = e['course'];
          return course is Map ? course['id']?.toString() : e['courseId']?.toString();
        }).whereType<String>().toSet();

        setState(() {
          _available = courses.where((c) => !enrolledIds.contains(c['id']?.toString())).toList();
          _isLoadingAvailable = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() { _availableError = 'Could not load available courses.'; _isLoadingAvailable = false; });
    }
  }

  final Set<String> _enrolledIds = {};

  Future<void> _enrollInCourse(String courseId, String courseTitle) async {
    try {
      await _apiClient.dio.post(AppConstants.enroll, data: { 'courseId': courseId });
      if (mounted) {
        setState(() {
          _enrolledIds.add(courseId);
          _available.removeWhere((c) => c['id'].toString() == courseId);
          _enrolled.insert(0, {
            'courseId': courseId,
            'courseTitle': courseTitle,
            'status': 'active',
            'progressPercentage': 0,
            'course': _available.isNotEmpty
                ? _available.firstWhere(
                    (c) => c['id'].toString() == courseId,
                    orElse: () => <String, dynamic>{'id': courseId, 'title': courseTitle},
                  )
                : <String, dynamic>{'id': courseId, 'title': courseTitle},
          });
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Enrolled successfully!'), behavior: SnackBarBehavior.floating),
        );
        _fetchEnrolled();
        _fetchAvailable();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Enrollment failed. ${e.toString()}'), behavior: SnackBarBehavior.floating),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: const Text('My Courses'),
          backgroundColor: Colors.white,
          foregroundColor: AppColors.primary,
          elevation: 0,
          centerTitle: false,
          bottom: TabBar(
            controller: _tabController,
            labelColor: AppColors.primary,
            unselectedLabelColor: AppColors.onSurfaceVariant,
            indicatorColor: AppColors.primary,
            tabs: [
              Tab(text: 'My Courses (${_enrolled.length})'),
              Tab(text: 'Available (${_filteredAvailable.length})'),
            ],
          ),
        ),
        body: Column(
          children: [
            const OfflineIndicator(),
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  _buildEnrolledTab(),
                  _buildAvailableTab(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // --- My Courses tab ---
  Widget _buildEnrolledTab() {
    if (_isLoadingEnrolled) return const Center(child: CircularProgressIndicator());
    if (_enrolledError != null) return _errorView(_enrolledError!, _fetchEnrolled);
    if (_enrolled.isEmpty) {
      return _emptyView(
        Icons.school_rounded,
        'Not Enrolled in Any Courses',
        'Enroll in a course from the Available tab to see it here.',
        _fetchEnrolled,
      );
    }
    return RefreshIndicator(
      onRefresh: _fetchEnrolled,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _enrolled.length,
        itemBuilder: (_, i) => _buildEnrolledCard(_enrolled[i]),
      ),
    );
  }

  Widget _buildEnrolledCard(dynamic enrollment) {
    final course = enrollment['course'] is Map ? enrollment['course'] as Map<String, dynamic> : <String, dynamic>{};
    final id = course['id']?.toString() ?? enrollment['courseId']?.toString() ?? '';
    final title = course['title'] as String? ?? enrollment['courseTitle'] as String? ?? 'Course';
    final thumbnail = course['thumbnail'] as String?;
    final subject = course['subject'] as String? ?? '';
    final totalLessons = course['totalLessons'] as int? ?? 0;
    final teacher = course['teacher'] is Map ? course['teacher'] as Map<String, dynamic>? : null;
    final teacherName = teacher != null ? '${teacher['firstName'] ?? ''} ${teacher['lastName'] ?? ''}'.trim() : '';
    final progress = (enrollment['progressPercentage'] as num?)?.toDouble() ?? 0.0;
    final status = (enrollment['status'] as String? ?? 'active').toLowerCase();
    final isCompleted = status == 'completed';

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: GestureDetector(
        onTap: () => id.isNotEmpty ? context.push('/courses/$id') : null,
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2))],
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Image area
              SizedBox(
                height: 160,
                width: double.infinity,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    if (thumbnail != null && thumbnail.isNotEmpty)
                      CachedNetworkImage(
                        imageUrl: thumbnail.startsWith('http') ? thumbnail : '${AppConstants.baseHttpUrl}$thumbnail',
                        fit: BoxFit.cover,
                        color: Colors.black.withValues(alpha: 0.25),
                        colorBlendMode: BlendMode.darken,
                        placeholder: (_, __) => Container(color: AppColors.primary.withValues(alpha: 0.1)),
                        errorWidget: (_, __, ___) => Container(color: AppColors.primary.withValues(alpha: 0.1)),
                      )
                    else
                      Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(colors: [AppColors.primary, AppColors.primary.withValues(alpha: 0.7)]),
                        ),
                      ),
                    // Gradient overlay
                    Positioned.fill(
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [Colors.transparent, Colors.black.withValues(alpha: 0.6)],
                          ),
                        ),
                      ),
                    ),
                    // Subject badge
                    if (subject.isNotEmpty)
                      Positioned(
                        top: 12, left: 12,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.9),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(subject.toUpperCase(),
                            style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.primary)),
                        ),
                      ),
                    // Completed badge
                    if (isCompleted)
                      Positioned(
                        top: 12, right: 12,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.green,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.check_circle, size: 12, color: Colors.white),
                              SizedBox(width: 4),
                              Text('Completed', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                      ),
                    // Title at bottom of image
                    Positioned(
                      bottom: 12, left: 12, right: 12,
                      child: Text(title, maxLines: 2, overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ),
              // Info section
              Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (teacherName.isNotEmpty) ...[
                      Row(
                        children: [
                          Icon(Icons.person_outline, size: 14, color: Colors.grey[500]),
                          const SizedBox(width: 4),
                          Text(teacherName, style: TextStyle(fontSize: 12, color: Colors.grey[500])),
                        ],
                      ),
                      const SizedBox(height: 8),
                    ],
                    // Progress bar
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text('${progress.round()}% complete',
                                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.primary)),
                                  if (totalLessons > 0)
                                    Text('$totalLessons lessons',
                                      style: TextStyle(fontSize: 11, color: Colors.grey[500])),
                                ],
                              ),
                              const SizedBox(height: 6),
                              ClipRRect(
                                borderRadius: BorderRadius.circular(4),
                                child: LinearProgressIndicator(
                                  value: progress / 100,
                                  minHeight: 6,
                                  backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                                  valueColor: AlwaysStoppedAnimation<Color>(
                                    isCompleted ? Colors.green : AppColors.primary,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        Icon(Icons.chevron_right_rounded, color: Colors.grey[400]),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // --- Available Courses tab ---
  Widget _buildAvailableTab() {
    if (_isLoadingAvailable) return const Center(child: CircularProgressIndicator());
    if (_availableError != null) return _errorView(_availableError!, _fetchAvailable);
    if (_available.isEmpty) {
      return _emptyView(
        Icons.library_books_rounded,
        'No Available Courses',
        'There are no published courses available right now.',
        _fetchAvailable,
      );
    }
    return RefreshIndicator(
      onRefresh: _fetchAvailable,
      child: CustomScrollView(
        slivers: [
          // Search & filters
          SliverToBoxAdapter(child: _buildSearchFilterBar()),
          // Course grid
          _filteredAvailable.isEmpty
              ? SliverToBoxAdapter(
                  child: SizedBox(
                    height: 200,
                    child: Center(child: Text('No courses match your search.',
                      style: TextStyle(color: Colors.grey[500]))),
                  ),
                )
              : SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                  sliver: SliverGrid(
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 0.65,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                    ),
                    delegate: SliverChildBuilderDelegate(
                      (context, index) => _buildAvailableCard(_filteredAvailable[index]),
                      childCount: _filteredAvailable.length,
                    ),
                  ),
                ),
        ],
      ),
    );
  }

  Widget _buildSearchFilterBar() {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
          child: TextField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: 'Search courses...',
              prefixIcon: Icon(Icons.search_rounded, color: Colors.grey[400]),
              suffixIcon: _searchQuery.isNotEmpty
                  ? IconButton(icon: const Icon(Icons.clear_rounded, size: 18), onPressed: () { _searchController.clear(); })
                  : null,
              filled: true,
              fillColor: Colors.white,
              contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 16),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: Colors.grey[200]!)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: Colors.grey[200]!)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: AppColors.primary)),
            ),
          ),
        ),
        if (_subjects.isNotEmpty)
          SizedBox(
            height: 44,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              children: [
                _subjectChip(null, 'All'),
                ..._subjects.map((s) => _subjectChip(s, s)),
              ],
            ),
          ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
          child: Row(
            children: [
              Text('${_filteredAvailable.length} courses', style: TextStyle(fontSize: 13, color: Colors.grey[500])),
              const Spacer(),
              if (_selectedSubject != null || _searchQuery.isNotEmpty)
                GestureDetector(
                  onTap: () { setState(() { _selectedSubject = null; _searchController.clear(); }); },
                  child: Text('Clear filters', style: TextStyle(fontSize: 12, color: AppColors.primary)),
                ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _subjectChip(String? value, String label) {
    final isSelected = _selectedSubject == value;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Text(label, style: TextStyle(
          fontSize: 12, fontWeight: FontWeight.w600,
          color: isSelected ? Colors.white : Colors.grey[700],
        )),
        selected: isSelected,
        onSelected: (_) { setState(() => _selectedSubject = value); },
        backgroundColor: Colors.white,
        selectedColor: AppColors.primary,
        checkmarkColor: Colors.white,
        side: BorderSide(color: isSelected ? AppColors.primary : Colors.grey[200]!),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        padding: const EdgeInsets.symmetric(horizontal: 4),
      ),
    );
  }

  Widget _buildAvailableCard(dynamic course) {
    final id = course['id']?.toString() ?? '';
    final title = course['title'] as String? ?? 'Course';
    final thumbnail = course['thumbnail'] as String?;
    final subject = course['subject'] as String? ?? '';
    final totalLessons = course['totalLessons'] as int? ?? 0;
    final rating = (course['averageRating'] is num) ? (course['averageRating'] as num).toDouble() : null;
    final totalStudents = course['totalStudents'] as int? ?? 0;
    final teacher = course['teacher'] is Map ? course['teacher'] as Map<String, dynamic>? : null;
    final teacherName = teacher != null ? '${teacher['firstName'] ?? ''} ${teacher['lastName'] ?? ''}'.trim() : '';

    return GestureDetector(
      onTap: () => id.isNotEmpty ? context.push('/courses/$id') : null,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2))],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Thumbnail
            SizedBox(
              height: 110, width: double.infinity,
              child: thumbnail != null && thumbnail.isNotEmpty
                  ? CachedNetworkImage(
                      imageUrl: thumbnail.startsWith('http') ? thumbnail : '${AppConstants.baseHttpUrl}$thumbnail',
                      fit: BoxFit.cover,
                      placeholder: (_, __) => Container(color: AppColors.primary.withValues(alpha: 0.1)),
                      errorWidget: (_, __, ___) => Container(color: AppColors.primary.withValues(alpha: 0.1)),
                    )
                  : Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(colors: [AppColors.primary, AppColors.primary.withValues(alpha: 0.6)]),
                      ),
                      child: const Center(child: Icon(Icons.school_rounded, color: Colors.white38, size: 36)),
                    ),
            ),
            // Details
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (subject.isNotEmpty)
                      Text(subject.toUpperCase(),
                        maxLines: 1, overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.grey[500], letterSpacing: 0.5)),
                    const SizedBox(height: 2),
                    Text(title, maxLines: 2, overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 2),
                    if (teacherName.isNotEmpty)
                      Text(teacherName, maxLines: 1, overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 11, color: Colors.grey[500])),
                    const Spacer(),
                    Row(
                      children: [
                        if (rating != null) ...[
                          Icon(Icons.star_rounded, size: 14, color: Colors.amber[600]),
                          const SizedBox(width: 2),
                          Text('$rating', style: TextStyle(fontSize: 11, color: Colors.amber[700])),
                          const SizedBox(width: 6),
                        ],
                        if (totalLessons > 0)
                          Text('$totalLessons les.', style: TextStyle(fontSize: 10, color: Colors.grey[400])),
                        if (totalStudents > 0) ...[
                          const SizedBox(width: 6),
                          Icon(Icons.people_outline, size: 11, color: Colors.grey[400]),
                          const SizedBox(width: 2),
                          Text('$totalStudents', style: TextStyle(fontSize: 10, color: Colors.grey[400])),
                        ],
                      ],
                    ),
                    const SizedBox(height: 6),
                    SizedBox(
                      width: double.infinity,
                      height: 32,
                      child: ElevatedButton(
                        onPressed: _enrolledIds.contains(id)
                            ? () => context.push('/courses/$id')
                            : () => _enrollInCourse(id, title),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _enrolledIds.contains(id) ? Colors.green : AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: EdgeInsets.zero,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        child: Text(
                          _enrolledIds.contains(id) ? 'Continue' : 'Enroll Now',
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _errorView(String message, VoidCallback onRetry) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline_rounded, size: 64, color: AppColors.onSurfaceVariant.withValues(alpha: 0.3)),
            const SizedBox(height: 16),
            Text(message, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.onSurfaceVariant)),
            const SizedBox(height: 16),
            ElevatedButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }

  Widget _emptyView(IconData icon, String title, String subtitle, Future<void> Function() onRefresh) {
    return RefreshIndicator(
      onRefresh: onRefresh,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: Container(
          height: MediaQuery.of(context).size.height * 0.6,
          alignment: Alignment.center,
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 80, color: AppColors.primary.withValues(alpha: 0.3)),
              const SizedBox(height: 24),
              Text(title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.onSurface)),
              const SizedBox(height: 12),
              Text(subtitle, textAlign: TextAlign.center,
                style: TextStyle(fontSize: 15, color: AppColors.onSurfaceVariant.withValues(alpha: 0.8), height: 1.4)),
            ],
          ),
        ),
      ),
    );
  }
}
