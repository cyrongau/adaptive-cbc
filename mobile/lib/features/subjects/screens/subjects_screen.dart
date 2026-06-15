import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:dio/dio.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants.dart';
import '../../../core/theme/app_colors.dart';

class SubjectsScreen extends StatefulWidget {
  const SubjectsScreen({super.key});

  @override
  State<SubjectsScreen> createState() => _SubjectsScreenState();
}

class _SubjectsScreenState extends State<SubjectsScreen> {
  final ApiClient _apiClient = ApiClient();
  List<dynamic> _subjects = [];
  bool _isLoading = true;
  String? _errorMessage;
  String? _expandedSubjectId;
  final Map<String, List<dynamic>> _topicsCache = {};
  final Map<String, bool> _topicsLoading = {};

  @override
  void initState() {
    super.initState();
    _fetchSubjects();
  }

  Future<void> _fetchSubjects() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final user = authProvider.currentUser;
    final int? gradeVal = user?['grade'] != null ? int.tryParse(user!['grade'].toString()) : null;

    try {
      Response response;
      if (gradeVal != null) {
        response = await _apiClient.dio.get(
          '${AppConstants.subjects}/by-grade',
          queryParameters: {'grade': gradeVal},
        );
      } else {
        response = await _apiClient.dio.get(AppConstants.subjects);
      }

      if (response.statusCode == 200) {
        setState(() {
          _subjects = response.data as List? ?? [];
          _isLoading = false;
        });
        
        // If we succeeded but list is empty, fallback to get all subjects
        if (_subjects.isEmpty && gradeVal != null) {
          final allResponse = await _apiClient.dio.get(AppConstants.subjects);
          if (allResponse.statusCode == 200 && mounted) {
            setState(() {
              _subjects = allResponse.data as List? ?? [];
            });
          }
        }
      } else {
        setState(() {
          _errorMessage = response.data['message'] ?? 'Failed to load subjects';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Could not load subjects. Please check connection.';
        _isLoading = false;
      });
    }
  }

  Future<void> _fetchTopics(String subjectId) async {
    if (_topicsCache.containsKey(subjectId)) return;

    setState(() {
      _topicsLoading[subjectId] = true;
    });

    try {
      final response = await _apiClient.dio.get('${AppConstants.subjects}/$subjectId/topics');
      if (response.statusCode == 200) {
        setState(() {
          _topicsCache[subjectId] = response.data as List? ?? [];
          _topicsLoading[subjectId] = false;
        });
      } else {
        setState(() {
          _topicsLoading[subjectId] = false;
        });
      }
    } catch (e) {
      setState(() {
        _topicsLoading[subjectId] = false;
      });
    }
  }

  void _toggleExpand(String subjectId) {
    setState(() {
      if (_expandedSubjectId == subjectId) {
        _expandedSubjectId = null;
      } else {
        _expandedSubjectId = subjectId;
        _fetchTopics(subjectId);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('CBC Curriculum Subjects'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
        centerTitle: false,
      ),
      body: _isLoading
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
                      Icon(Icons.menu_book_rounded, size: 64, color: AppColors.onSurfaceVariant.withOpacity(0.3)),
                      const SizedBox(height: 16),
                      Text(
                        _errorMessage!,
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: AppColors.onSurfaceVariant),
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: _fetchSubjects,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : _subjects.isEmpty
                  ? const Padding(
                      padding: EdgeInsets.all(24.0),
                      child: Center(
                        child: Text(
                          'No subjects registered for your grade yet.',
                          style: TextStyle(color: AppColors.onSurfaceVariant),
                        ),
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _fetchSubjects,
                      color: AppColors.primary,
                      child: ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                        itemCount: _subjects.length,
                        itemBuilder: (context, index) {
                          final subject = _subjects[index];
                          final String id = subject['id']?.toString() ?? '';
                          final String name = subject['name'] ?? 'Subject';
                          final String description = subject['description'] ?? 'CBC Learning Strand';
                          final int grade = subject['grade'] ?? 0;
                          final bool isExpanded = _expandedSubjectId == id;

                          // Curate colors and icons based on subject name
                          Color cardAccentColor = AppColors.primary;
                          IconData subjectIcon = Icons.auto_stories_rounded;

                          final lowerName = name.toLowerCase();
                          if (lowerName.contains('math')) {
                            cardAccentColor = Colors.blue.shade700;
                            subjectIcon = Icons.calculate_rounded;
                          } else if (lowerName.contains('sci') || lowerName.contains('environ')) {
                            cardAccentColor = Colors.teal.shade700;
                            subjectIcon = Icons.science_rounded;
                          } else if (lowerName.contains('kiswahili') || lowerName.contains('language') || lowerName.contains('english')) {
                            cardAccentColor = Colors.orange.shade800;
                            subjectIcon = Icons.translate_rounded;
                          } else if (lowerName.contains('art') || lowerName.contains('music')) {
                            cardAccentColor = Colors.purple.shade700;
                            subjectIcon = Icons.palette_rounded;
                          }

                          return Card(
                            elevation: 0,
                            margin: const EdgeInsets.only(bottom: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                              side: BorderSide(
                                color: isExpanded ? cardAccentColor : AppColors.surfaceContainer,
                                width: isExpanded ? 1.5 : 1.0,
                              ),
                            ),
                            color: Colors.white,
                            clipBehavior: Clip.antiAlias,
                            child: Column(
                              children: [
                                ListTile(
                                  onTap: () => _toggleExpand(id),
                                  contentPadding: const EdgeInsets.all(16),
                                  leading: Container(
                                    width: 48,
                                    height: 48,
                                    decoration: BoxDecoration(
                                      color: cardAccentColor.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Icon(subjectIcon, color: cardAccentColor, size: 28),
                                  ),
                                  title: Text(
                                    name,
                                    style: theme.textTheme.titleMedium?.copyWith(
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.onSurface,
                                    ),
                                  ),
                                  subtitle: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const SizedBox(height: 4),
                                      Text(
                                        'Grade $grade • $description',
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: AppColors.onSurfaceVariant.withOpacity(0.85),
                                        ),
                                      ),
                                    ],
                                  ),
                                  trailing: Icon(
                                    isExpanded ? Icons.expand_less_rounded : Icons.expand_more_rounded,
                                    color: cardAccentColor,
                                  ),
                                ),
                                if (isExpanded) ...[
                                  const Divider(height: 1, indent: 16, endIndent: 16),
                                  _buildTopicsSection(id, name, grade, cardAccentColor),
                                ],
                              ],
                            ),
                          );
                        },
                      ),
                    ),
    );
  }

  Widget _buildTopicsSection(String subjectId, String subjectName, int grade, Color accentColor) {
    final bool isLoading = _topicsLoading[subjectId] ?? false;
    final topics = _topicsCache[subjectId] ?? [];

    if (isLoading) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 24.0),
        child: Center(
          child: SizedBox(
            width: 24,
            height: 24,
            child: CircularProgressIndicator(
              strokeWidth: 2.5,
              valueColor: AlwaysStoppedAnimation<Color>(accentColor),
            ),
          ),
        ),
      );
    }

    if (topics.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(horizontal: 16.0, vertical: 20.0),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.info_outline, size: 16, color: AppColors.onSurfaceVariant),
            SizedBox(width: 8),
            Text(
              'No active study units for this subject yet.',
              style: TextStyle(fontSize: 13, color: AppColors.onSurfaceVariant),
            ),
          ],
        ),
      );
    }

    return Container(
      color: AppColors.background.withOpacity(0.3),
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'STUDY STRANDS / TOPICS',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: AppColors.onSurfaceVariant,
              letterSpacing: 1.1,
            ),
          ),
          const SizedBox(height: 10),
          ...topics.map((topic) {
            final String topicId = topic['id']?.toString() ?? '';
            final String title = topic['title'] ?? 'Study Unit';
            final String desc = topic['description'] ?? 'Strand Content';
            
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.surfaceContainer, width: 0.8),
              ),
              child: ListTile(
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                title: Text(
                  title,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                ),
                subtitle: Text(
                  desc,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 11),
                ),
                trailing: ElevatedButton(
                  onPressed: () {
                    context.push(
                      '/practice/setup',
                      extra: {
                        'subjectId': subjectId,
                        'subjectName': subjectName,
                        'topicId': topicId,
                        'topicName': title,
                        'grade': grade,
                      },
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: accentColor,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 0),
                    minimumSize: const Size(0, 32),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: const Text('Start', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                ),
              ),
            );
          }),
        ],
      ),
    );
  }

  // Mockup dialog removed
}
