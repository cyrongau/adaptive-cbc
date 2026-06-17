import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/offline_indicator.dart';

class CourseDetailScreen extends StatefulWidget {
  final String courseId;

  const CourseDetailScreen({super.key, required this.courseId});

  @override
  State<CourseDetailScreen> createState() => _CourseDetailScreenState();
}

class _CourseDetailScreenState extends State<CourseDetailScreen> {
  final ApiClient _apiClient = ApiClient();
  Map<String, dynamic>? _course;
  bool _isLoading = true;
  bool _isDownloading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _fetchCourseDetails();
  }

  Future<void> _fetchCourseDetails() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final response = await _apiClient.dio.get('${AppConstants.courses}/${widget.courseId}');
      
      if (response.statusCode == 200) {
        setState(() {
          _course = response.data['data'] ?? response.data;
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = response.data['message'] ?? 'Failed to load course details';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Could not load course details. Please check connection.';
        _isLoading = false;
      });
    }
  }

  Future<void> _downloadForOffline() async {
    if (_course == null) return;
    
    setState(() {
      _isDownloading = true;
    });

    try {
      final List<dynamic> modules = _course!['modules'] ?? [];
      
      // Fetch and cache every lesson silently
      for (var module in modules) {
        final List<dynamic> lessons = module['lessons'] ?? [];
        for (var lesson in lessons) {
          final String lessonId = lesson['id'] ?? '';
          if (lessonId.isNotEmpty) {
            await _apiClient.dio.get('\${AppConstants.lessons}/$lessonId');
          }
        }
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Course downloaded for offline use!')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Some lessons could not be downloaded.')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isDownloading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Course Details'), backgroundColor: Colors.white, foregroundColor: AppColors.primary),
        body: const Center(
          child: CircularProgressIndicator(valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary)),
        ),
      );
    }

    if (_errorMessage != null || _course == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Course Details'), backgroundColor: Colors.white, foregroundColor: AppColors.primary),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.grey),
              const SizedBox(height: 16),
              Text(_errorMessage ?? 'Course not found'),
              const SizedBox(height: 16),
              ElevatedButton(onPressed: _fetchCourseDetails, child: const Text('Retry')),
            ],
          ),
        ),
      );
    }

    final String title = _course!['title'] ?? 'Course Title';
    final String description = _course!['description'] ?? 'No description provided.';
    final String? thumbnail = _course!['thumbnail'];
    final String level = _course!['level'] ?? 'beginner';
    final List<dynamic> modules = _course!['modules'] ?? [];
    
    // Sort modules by order if present
    modules.sort((a, b) => (a['order'] ?? 0).compareTo(b['order'] ?? 0));

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          const OfflineIndicator(),
          Expanded(
            child: CustomScrollView(
              slivers: [
                SliverAppBar(
                  expandedHeight: 200.0,
                  floating: false,
                  pinned: true,
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
            flexibleSpace: FlexibleSpaceBar(
              background: thumbnail != null && thumbnail.isNotEmpty
                  ? Image.network(
                      '${AppConstants.baseHttpUrl}$thumbnail',
                      fit: BoxFit.cover,
                      color: Colors.black.withOpacity(0.4),
                      colorBlendMode: BlendMode.darken,
                    )
                  : Container(
                      color: AppColors.primary,
                      child: const Center(
                        child: Icon(Icons.school, size: 64, color: Colors.white38),
                      ),
                    ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.accent.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      level.toUpperCase(),
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: AppColors.accent,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    title,
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: AppColors.onSurface,
                    ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _isDownloading ? null : _downloadForOffline,
                      icon: _isDownloading 
                        ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                        : const Icon(Icons.download_for_offline),
                      label: Text(_isDownloading ? 'Downloading...' : 'Download for Offline Use'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary.withOpacity(0.1),
                        foregroundColor: AppColors.primary,
                        elevation: 0,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'About this course',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppColors.onSurface,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    description,
                    style: TextStyle(
                      fontSize: 14,
                      color: AppColors.onSurfaceVariant.withOpacity(0.9),
                      height: 1.5,
                    ),
                  ),
                  const SizedBox(height: 24),
                  const Text(
                    'Curriculum',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppColors.onSurface,
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
              ),
            ),
          ),
          SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                final module = modules[index];
                return _buildModuleCard(module, theme, index);
              },
              childCount: modules.length,
            ),
          ),
                  const SliverToBoxAdapter(child: SizedBox(height: 40)),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildModuleCard(Map<String, dynamic> module, ThemeData theme, int moduleIndex) {
    final String moduleTitle = module['title'] ?? 'Module ${moduleIndex + 1}';
    final List<dynamic> lessons = module['lessons'] ?? [];
    
    // Sort lessons by order
    lessons.sort((a, b) => (a['order'] ?? 0).compareTo(b['order'] ?? 0));

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: AppColors.surfaceContainer),
      ),
      child: ExpansionTile(
        title: Text(
          moduleTitle,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
        ),
        subtitle: Text(
          '${lessons.length} lessons',
          style: TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant),
        ),
        children: lessons.map((lesson) {
          final String lessonId = lesson['id'] ?? '';
          final String title = lesson['title'] ?? 'Lesson';
          final String type = lesson['content_type'] ?? lesson['contentType'] ?? 'video';
          
          IconData icon;
          switch (type) {
            case 'video':
              icon = Icons.play_circle_fill_rounded;
              break;
            case 'article':
            case 'document':
              icon = Icons.article_rounded;
              break;
            case 'quiz':
            case 'assessment':
              icon = Icons.quiz_rounded;
              break;
            default:
              icon = Icons.play_circle_fill_rounded;
          }

          return ListTile(
            leading: Icon(icon, color: AppColors.primary, size: 28),
            title: Text(title, style: const TextStyle(fontSize: 14)),
            trailing: const Icon(Icons.chevron_right, size: 20),
            onTap: () {
              context.push('/courses/lesson/$lessonId', extra: lesson);
            },
          );
        }).toList(),
      ),
    );
  }
}
