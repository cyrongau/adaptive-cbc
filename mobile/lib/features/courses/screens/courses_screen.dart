import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/offline_indicator.dart';

class CoursesScreen extends StatefulWidget {
  const CoursesScreen({super.key});

  @override
  State<CoursesScreen> createState() => _CoursesScreenState();
}

class _CoursesScreenState extends State<CoursesScreen> {
  final ApiClient _apiClient = ApiClient();
  List<dynamic> _myCourses = [];
  List<dynamic> _availableCourses = [];
  bool _isLoadingMy = true;
  bool _isLoadingAvail = true;
  String? _errorMessageMy;
  String? _errorMessageAvail;

  @override
  void initState() {
    super.initState();
    _fetchMyCourses();
    _fetchAvailableCourses();
  }

  Future<void> _fetchMyCourses() async {
    setState(() {
      _isLoadingMy = true;
      _errorMessageMy = null;
    });

    try {
      final response = await _apiClient.dio.get(AppConstants.enrollments);
      if (response.statusCode == 200) {
        final enrollments = response.data['data'] as List? ?? response.data as List? ?? [];
        // Map enrollments to extract the nested course object
        final mappedCourses = enrollments.map((e) => e['course']).where((c) => c != null).toList();
        setState(() {
          _myCourses = mappedCourses;
          _isLoadingMy = false;
        });
      } else {
        setState(() {
          _errorMessageMy = response.data['message'] ?? 'Failed to load enrollments';
          _isLoadingMy = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessageMy = 'Could not load enrollments. Please check your connection.';
        _isLoadingMy = false;
      });
    }
  }

  Future<void> _fetchAvailableCourses() async {
    setState(() {
      _isLoadingAvail = true;
      _errorMessageAvail = null;
    });

    try {
      final response = await _apiClient.dio.get(AppConstants.courses);
      if (response.statusCode == 200) {
        setState(() {
          _availableCourses = response.data['data'] as List? ?? response.data as List? ?? [];
          _isLoadingAvail = false;
        });
      } else {
        setState(() {
          _errorMessageAvail = response.data['message'] ?? 'Failed to load courses';
          _isLoadingAvail = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessageAvail = 'Could not load courses. Please check your connection.';
        _isLoadingAvail = false;
      });
    }
  }

  Widget _buildCourseList(List<dynamic> courses, bool isLoading, String? errorMessage, Future<void> Function() onRefresh, String emptyMessage, ThemeData theme) {
    if (isLoading) {
      return const Center(
        child: CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
        ),
      );
    }
    if (errorMessage != null) {
      return Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline_rounded, size: 64, color: AppColors.onSurfaceVariant.withOpacity(0.3)),
            const SizedBox(height: 16),
            Text(
              errorMessage,
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.onSurfaceVariant),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: onRefresh,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }
    if (courses.isEmpty) {
      return RefreshIndicator(
        onRefresh: onRefresh,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Container(
            height: MediaQuery.of(context).size.height * 0.6,
            alignment: Alignment.center,
            padding: const EdgeInsets.all(32.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.school_rounded, size: 80, color: AppColors.primary.withOpacity(0.3)),
                const SizedBox(height: 24),
                const Text(
                  'No Courses Found',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AppColors.onSurface,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  emptyMessage,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 15,
                    color: AppColors.onSurfaceVariant.withOpacity(0.8),
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: onRefresh,
      color: AppColors.primary,
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
        itemCount: courses.length,
        itemBuilder: (context, index) {
          final course = courses[index];
          return _buildCourseCard(course, theme);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: const Text('Courses'),
          backgroundColor: Colors.white,
          foregroundColor: AppColors.primary,
          elevation: 0,
          centerTitle: false,
          bottom: const TabBar(
            labelColor: AppColors.primary,
            unselectedLabelColor: AppColors.onSurfaceVariant,
            indicatorColor: AppColors.primary,
            tabs: [
              Tab(text: 'My Courses'),
              Tab(text: 'Available Courses'),
            ],
          ),
        ),
        body: Column(
          children: [
            const OfflineIndicator(),
            Expanded(
              child: TabBarView(
                children: [
                  _buildCourseList(
                    _myCourses, 
                    _isLoadingMy, 
                    _errorMessageMy, 
                    _fetchMyCourses, 
                    'You are not enrolled in any courses yet. Check available courses!', 
                    theme
                  ),
                  _buildCourseList(
                    _availableCourses, 
                    _isLoadingAvail, 
                    _errorMessageAvail, 
                    _fetchAvailableCourses, 
                    'There are no published courses available right now. Pull down to refresh.', 
                    theme
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCourseCard(Map<String, dynamic> course, ThemeData theme) {
    final String id = course['id']?.toString() ?? '';
    final String title = course['title'] ?? 'Course Title';
    final String description = course['description'] ?? 'Course Description';
    final String? thumbnail = course['thumbnail'];
    final String level = course['level'] ?? 'beginner';
    final int lessons = course['total_lessons'] ?? course['totalLessons'] ?? 0;

    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: AppColors.surfaceContainer, width: 1.0),
      ),
      color: Colors.white,
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () {
          context.push('/courses/$id');
        },
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (thumbnail != null && thumbnail.isNotEmpty)
              Container(
                height: 140,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: AppColors.surfaceContainer.withOpacity(0.5),
                  image: DecorationImage(
                    image: NetworkImage('${AppConstants.baseHttpUrl}$thumbnail'),
                    fit: BoxFit.cover,
                    onError: (e, s) {},
                  ),
                ),
              )
            else
              Container(
                height: 120,
                width: double.infinity,
                color: AppColors.primary.withOpacity(0.1),
                child: const Icon(Icons.school_rounded, size: 48, color: AppColors.primary),
              ),
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.accent.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          level.toUpperCase(),
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: AppColors.accent.withOpacity(0.8),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '$lessons Lessons',
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    title,
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: AppColors.onSurface,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    description,
                    style: TextStyle(
                      fontSize: 13,
                      color: AppColors.onSurfaceVariant.withOpacity(0.85),
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
