import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../auth/providers/auth_provider.dart';
import 'package:provider/provider.dart';
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
    setState(() => _isLoading = true);
    
    try {
      final responses = await Future.wait([
        _apiClient.dio.get(AppConstants.classes),
        _apiClient.dio.get(AppConstants.tutors),
      ]);
      
      if (mounted) {
        setState(() {
          // NestJS might return an array or an object like { data: [...] }
          _classes = responses[0].data is List ? responses[0].data : (responses[0].data['data'] ?? []);
          _tutors = responses[1].data is List ? responses[1].data : (responses[1].data['data'] ?? []);
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load marketplace data.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Live Marketplace'),
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
            padding: const EdgeInsets.all(32.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.video_call_rounded, size: 80, color: AppColors.primary.withOpacity(0.3)),
                const SizedBox(height: 24),
                const Text(
                  'No Live Classes',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AppColors.onSurface,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'There are no upcoming live classes scheduled for your grade at the moment. Pull down to refresh.',
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
      onRefresh: _fetchData,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _classes.length,
        itemBuilder: (context, index) {
          final cls = _classes[index];
          final teacherName = cls['teacher'] != null 
              ? '${cls['teacher']['firstName']} ${cls['teacher']['lastName']}'
              : 'Unknown Instructor';
              
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
                          cls['name'] ?? 'Unnamed Class',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: AppColors.onSurface,
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          cls['subject'] ?? 'General',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    cls['description'] ?? 'No description provided.',
                    style: const TextStyle(
                      fontSize: 14,
                      color: AppColors.onSurfaceVariant,
                    ),
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
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppColors.onSurface,
                        ),
                      ),
                      const Spacer(),
                      if (cls['recordingUrl'] != null && cls['status'] == 'completed')
                        ElevatedButton.icon(
                          onPressed: () async {
                            final url = Uri.parse(cls['recordingUrl']);
                            if (await canLaunchUrl(url)) {
                              await launchUrl(url);
                            } else {
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Could not open recording link.')),
                                );
                              }
                            }
                          },
                          icon: const Icon(Icons.download_rounded, size: 16),
                          label: const Text('Download'),
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
                                  context.push(
                                    '/live/studio',
                                    extra: {
                                      'roomId': cls['id'],
                                      'roomName': cls['name'],
                                    },
                                  );
                                } else {
                                  context.push(
                                    '/live/meeting',
                                    extra: {
                                      'roomId': cls['id'],
                                      'roomName': cls['name'],
                                      'hostName': teacherName,
                                    },
                                  );
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
      return const Center(
        child: Text('No tutors available right now.', style: TextStyle(color: AppColors.onSurfaceVariant)),
      );
    }

    return RefreshIndicator(
      onRefresh: _fetchData,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _tutors.length,
        itemBuilder: (context, index) {
          final tutor = _tutors[index];
          final user = tutor['user'] ?? {};
          final name = '${user['firstName'] ?? ''} ${user['lastName'] ?? ''}'.trim();
          final subjects = (tutor['subjects'] as List<dynamic>? ?? [])
              .map((s) => s['subjectName'])
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
                name.isEmpty ? 'Unknown Tutor' : name,
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 4),
                  Text(tutor['bio'] ?? 'Experienced Tutor', maxLines: 2, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 8),
                  if (subjects.isNotEmpty)
                    Text('Expert in: $subjects', style: const TextStyle(fontSize: 12, color: AppColors.primary, fontWeight: FontWeight.w600)),
                ],
              ),
              isThreeLine: true,
              trailing: const Icon(Icons.chevron_right, color: AppColors.onSurfaceVariant),
              onTap: () {
                // Future: View Tutor Profile or Request Session
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Tutor profile view coming soon!')),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
