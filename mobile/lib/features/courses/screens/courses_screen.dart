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
  List<dynamic> _courses = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _fetchCourses();
  }

  Future<void> _fetchCourses() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final response = await _apiClient.dio.get('${AppConstants.courses}/published');
      
      if (response.statusCode == 200) {
        setState(() {
          _courses = response.data['data'] as List? ?? response.data as List? ?? [];
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = response.data['message'] ?? 'Failed to load courses';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Could not load courses. Please check your connection.';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Available Courses'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
        centerTitle: false,
      ),
      body: Column(
        children: [
          const OfflineIndicator(),
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
                    ),
                  )
                : _errorMessage != null
                    ? Padding(
                        padding: const EdgeInsets.all(24.0),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.error_outline_rounded, size: 64, color: AppColors.onSurfaceVariant.withOpacity(0.3)),
                            const SizedBox(height: 16),
                            Text(
                              _errorMessage!,
                              textAlign: TextAlign.center,
                              style: const TextStyle(color: AppColors.onSurfaceVariant),
                            ),
                            const SizedBox(height: 24),
                            ElevatedButton(
                              onPressed: _fetchCourses,
                              child: const Text('Retry'),
                            ),
                          ],
                        ),
                      )
                    : _courses.isEmpty
                        ? const Padding(
                            padding: EdgeInsets.all(24.0),
                            child: Center(
                              child: Text(
                                'No courses available at the moment.',
                                style: TextStyle(color: AppColors.onSurfaceVariant),
                              ),
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: _fetchCourses,
                            color: AppColors.primary,
                            child: ListView.builder(
                              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                              itemCount: _courses.length,
                              itemBuilder: (context, index) {
                                final course = _courses[index];
                                return _buildCourseCard(course, theme);
                              },
                            ),
                          ),
          ),
        ],
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
