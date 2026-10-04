import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../auth/providers/auth_provider.dart';
import 'package:url_launcher/url_launcher.dart';

class LiveClassesScreen extends StatefulWidget {
  const LiveClassesScreen({super.key});

  @override
  State<LiveClassesScreen> createState() => _LiveClassesScreenState();
}

class _LiveClassesScreenState extends State<LiveClassesScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final ApiClient _apiClient = ApiClient();

  bool _isLoading = true;
  String? _errorMessage;
  List<dynamic> _classes = [];
  List<dynamic> _tutors = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _fetchData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final userRole = Provider.of<AuthProvider>(context, listen: false).currentUser?['role'] ?? 'student';
      final isTeacher = userRole == 'teacher' || userRole == 'tutor';

      // Use appropriate endpoint: enrolled classes for students, my-classes for teachers
      String classesEndpoint;
      if (isTeacher) {
        classesEndpoint = '${AppConstants.classes}/my-classes';
      } else {
        classesEndpoint = '${AppConstants.classes}/my-enrollments';
      }

      final responses = await Future.wait([
        _apiClient.dio.get(classesEndpoint).catchError((_) {
          // Fallback: try all classes if enrolled endpoint fails
          return _apiClient.dio.get(AppConstants.classes);
        }),
        _apiClient.dio.get(AppConstants.tutors, queryParameters: {'limit': 50}),
      ]);

      if (mounted) {
        setState(() {
          _classes = responses[0].data is List ? responses[0].data : (responses[0].data['data'] ?? responses[0].data['classes'] ?? []);
          _tutors = responses[1].data is List ? responses[1].data : (responses[1].data['data'] ?? responses[1].data['tutors'] ?? []);
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = 'Could not load marketplace. Check your connection and try again.';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Live Classes'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.onSurfaceVariant,
          indicatorColor: AppColors.primary,
          tabs: const [
            Tab(text: 'Live Classes'),
            Tab(text: 'Available Tutors'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.cloud_off_rounded, size: 72, color: AppColors.onSurfaceVariant.withValues(alpha: 0.4)),
                        const SizedBox(height: 16),
                        Text(_errorMessage!, textAlign: TextAlign.center,
                          style: TextStyle(color: AppColors.onSurfaceVariant)),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: _fetchData,
                          icon: const Icon(Icons.refresh_rounded),
                          label: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                )
              : TabBarView(
                  controller: _tabController,
                  children: [
                    _buildClassesTab(),
                    _buildTutorsTab(),
                  ],
                ),
    );
  }

  Widget _buildClassesTab() {
    if (_classes.isEmpty) {
      return RefreshIndicator(
        onRefresh: _fetchData,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Container(
            height: MediaQuery.of(context).size.height * 0.6,
            alignment: Alignment.center,
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.video_call_rounded, size: 80, color: AppColors.primary.withValues(alpha: 0.3)),
                const SizedBox(height: 24),
                const Text(
                  'No Live Classes',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.onSurface),
                ),
                const SizedBox(height: 12),
                Text(
                  'You have no upcoming live classes. They will appear here once your teacher schedules one.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 15, color: AppColors.onSurfaceVariant.withValues(alpha: 0.8), height: 1.4),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _fetchData,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _classes.length,
        itemBuilder: (context, index) {
          final cls = _classes[index];
          final teacherRaw = cls['teacher'];
          String teacherName = 'Instructor';
          if (teacherRaw is Map) {
            teacherName = '${teacherRaw['firstName'] ?? ''} ${teacherRaw['lastName'] ?? ''}'.trim();
            if (teacherName.isEmpty) teacherName = teacherRaw['name'] ?? 'Instructor';
          } else if (teacherRaw is String) {
            teacherName = teacherRaw;
          }

          return Card(
            margin: const EdgeInsets.only(bottom: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            elevation: 0,
            color: Colors.white,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          cls['name'] ?? cls['title'] ?? 'Live Class',
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.onSurface),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          cls['subject'] ?? cls['subjectName'] ?? 'General',
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    cls['description'] ?? 'No description provided.',
                    style: const TextStyle(fontSize: 14, color: AppColors.onSurfaceVariant),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      CircleAvatar(
                        backgroundColor: Colors.blue.shade100,
                        radius: 16,
                        child: Text(
                          teacherName.isNotEmpty ? teacherName[0] : '?',
                          style: TextStyle(color: Colors.blue.shade800, fontSize: 12, fontWeight: FontWeight.bold),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        teacherName,
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.onSurface),
                      ),
                      const Spacer(),
                      if (cls['recordingUrl'] != null && cls['status'] == 'completed')
                        ElevatedButton.icon(
                          onPressed: () async {
                            final url = cls['recordingUrl'] as String;
                            final uri = Uri.tryParse(url);
                            if (uri != null && await canLaunchUrl(uri)) {
                              await launchUrl(uri);
                            } else if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Could not open recording link.')),
                              );
                            }
                          },
                          icon: const Icon(Icons.download_rounded, size: 16),
                          label: const Text('Recording'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.white,
                            foregroundColor: AppColors.primary,
                            side: const BorderSide(color: AppColors.primary),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        )
                      else ...[
                        Builder(
                          builder: (context) {
                            final userRole = Provider.of<AuthProvider>(context, listen: false).currentUser?['role'] ?? 'student';
                            final isTeacher = userRole == 'teacher' || userRole == 'tutor';
                            return ElevatedButton(
                              onPressed: () {
                                if (isTeacher) {
                                  context.push('/live/studio', extra: {
                                    'roomId': cls['id'],
                                    'roomName': cls['name'] ?? cls['title'] ?? 'Live Session',
                                  });
                                } else {
                                  context.push('/live/meeting', extra: {
                                    'roomId': cls['id'],
                                    'roomName': cls['name'] ?? cls['title'] ?? 'Live Session',
                                    'hostName': teacherName,
                                  });
                                }
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: isTeacher ? AppColors.accent : AppColors.primary,
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                              child: Text(isTeacher ? 'Start Session' : 'Join Class'),
                            );
                          }
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildTutorsTab() {
    if (_tutors.isEmpty) {
      return RefreshIndicator(
        onRefresh: _fetchData,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Container(
            height: MediaQuery.of(context).size.height * 0.6,
            alignment: Alignment.center,
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.people_outline_rounded, size: 80, color: AppColors.primary.withValues(alpha: 0.3)),
                const SizedBox(height: 24),
                const Text(
                  'No Tutors Available',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.onSurface),
                ),
                const SizedBox(height: 12),
                Text(
                  'There are no approved tutors available at the moment. Check back later or visit the Teachers & Tutors section.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 15, color: AppColors.onSurfaceVariant.withValues(alpha: 0.8), height: 1.4),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _fetchData,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _tutors.length,
        itemBuilder: (context, index) {
          final tutor = _tutors[index];
          final user = tutor['user'] is Map ? tutor['user'] as Map<String, dynamic> : <String, dynamic>{};
          final name = '${user['firstName'] ?? ''} ${user['lastName'] ?? ''}'.trim();
          final subjects = (tutor['subjects'] as List<dynamic>? ?? [])
              .map((s) => s is String ? s : (s['subjectName'] as String? ?? ''))
              .where((s) => s.isNotEmpty)
              .join(', ');

          return Card(
            margin: const EdgeInsets.only(bottom: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            elevation: 0,
            color: Colors.white,
            child: ListTile(
              contentPadding: const EdgeInsets.all(16),
              leading: CircleAvatar(
                radius: 28,
                backgroundColor: Colors.purple.shade100,
                child: Text(
                  name.isNotEmpty ? name[0] : 'T',
                  style: TextStyle(color: Colors.purple.shade800, fontSize: 20, fontWeight: FontWeight.bold),
                ),
              ),
              title: Text(
                name.isEmpty ? 'Tutor' : name,
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 4),
                  Text(tutor['bio'] ?? 'Available for tutoring', maxLines: 2, overflow: TextOverflow.ellipsis),
                  if (subjects.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text('Expert in: $subjects',
                      style: const TextStyle(fontSize: 12, color: AppColors.primary, fontWeight: FontWeight.w600)),
                  ],
                ],
              ),
              isThreeLine: subjects.isNotEmpty,
              trailing: const Icon(Icons.chevron_right, color: AppColors.onSurfaceVariant),
              onTap: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Contact ${name.isEmpty ? "tutor" : name} via Chat & Tutors.')),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
