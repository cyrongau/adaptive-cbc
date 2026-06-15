import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants.dart';
import '../../../core/theme/app_colors.dart';
import 'package:go_router/go_router.dart';
import '../../gamification/widgets/streak_progress_card.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final ApiClient _apiClient = ApiClient();
  Map<String, dynamic>? _dashboardData;
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _fetchDashboard();
  }

  Future<void> _fetchDashboard() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final response = await _apiClient.dio.get(AppConstants.dashboard);
      if (response.statusCode == 200) {
        setState(() {
          _dashboardData = response.data;
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = response.data['message'] ?? 'Failed to load dashboard';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Could not connect to the server. Please swipe down to refresh.';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.currentUser;
    final theme = Theme.of(context);

    final String firstName = user?['firstName'] ?? 'Student';
    final String lastName = user?['lastName'] ?? '';
    final String grade = user?['grade'] != null ? 'Grade ${user!['grade']}' : 'CBC Learner';
    final String initial = firstName.isNotEmpty ? firstName[0].toUpperCase() : 'S';

    return Scaffold(
      backgroundColor: AppColors.background,
      body: RefreshIndicator(
        onRefresh: _fetchDashboard,
        color: AppColors.primary,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            // Custom Header
            SliverAppBar(
              expandedHeight: 180,
              pinned: true,
              backgroundColor: AppColors.primary,
              flexibleSpace: FlexibleSpaceBar(
                background: Stack(
                  fit: StackFit.expand,
                  children: [
                    // Accent subtle shapes in header
                    Positioned(
                      right: -30,
                      top: -30,
                      child: Container(
                        width: 150,
                        height: 150,
                        decoration: BoxDecoration(
                          color: AppColors.accent.withOpacity(0.2),
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                    Positioned(
                      left: -20,
                      bottom: -20,
                      child: Container(
                        width: 100,
                        height: 100,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.05),
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                    SafeArea(
                      child: Padding(
                        padding: const EdgeInsets.all(20.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            Row(
                              children: [
                                CircleAvatar(
                                  radius: 28,
                                  backgroundColor: Colors.white,
                                  child: Text(
                                    initial,
                                    style: const TextStyle(
                                      color: AppColors.primary,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 24,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Hello, $firstName!',
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 22,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        grade,
                                        style: TextStyle(
                                          color: Colors.white.withOpacity(0.85),
                                          fontSize: 14,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                // Streak Badge
                                GestureDetector(
                                  onTap: () => _showStreakBottomSheet(
                                    context, 
                                    _dashboardData?['streak'] ?? user?['streakDays'] ?? 0
                                  ),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 12,
                                      vertical: 6,
                                    ),
                                    decoration: BoxDecoration(
                                      color: AppColors.accent,
                                      borderRadius: BorderRadius.circular(20),
                                      boxShadow: [
                                        BoxShadow(
                                          color: AppColors.accent.withOpacity(0.5),
                                          blurRadius: 10,
                                          offset: const Offset(0, 4),
                                        )
                                      ],
                                    ),
                                    child: Row(
                                      children: [
                                        TweenAnimationBuilder<double>(
                                          tween: Tween<double>(begin: 0.8, end: 1.1),
                                          duration: const Duration(seconds: 1),
                                          curve: Curves.easeInOut,
                                          builder: (context, value, child) {
                                            return Transform.scale(
                                              scale: value,
                                              child: child,
                                            );
                                          },
                                          child: const Icon(
                                            Icons.local_fire_department_rounded,
                                            color: Colors.white,
                                            size: 20,
                                          ),
                                        ),
                                        const SizedBox(width: 4),
                                        Text(
                                          '${_dashboardData?['streak'] ?? user?['streakDays'] ?? 0} Days',
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 13,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            
            // Content
            if (_isLoading)
              const SliverFillRemaining(
                child: Center(
                  child: CircularProgressIndicator(
                    valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
                  ),
                ),
              )
            else if (_errorMessage != null)
              SliverFillRemaining(
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.wifi_off_rounded, size: 64, color: AppColors.onSurfaceVariant.withOpacity(0.4)),
                      const SizedBox(height: 16),
                      Text(
                        _errorMessage!,
                        textAlign: TextAlign.center,
                        style: TextStyle(color: AppColors.onSurfaceVariant.withOpacity(0.8)),
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: _fetchDashboard,
                        child: const Text('Try Again'),
                      ),
                    ],
                  ),
                ),
              )
            else
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Quick stats grid
                      Text(
                        'Your Dashboard',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary,
                        ),
                      ),
                      const SizedBox(height: 12),
                      
                      _buildStatsGrid(),
                      
                      const SizedBox(height: 24),
                      
                      // Upcoming tasks
                      _buildUpcomingTasks(theme),
                      
                      const SizedBox(height: 24),
                      
                      // Recent sessions
                      _buildRecentActivities(theme),
                      
                      const SizedBox(height: 80), // bottom nav buffer
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  void _showStreakBottomSheet(BuildContext context, int currentStreak) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 5,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.5),
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              StreakProgressCard(
                currentStreak: currentStreak,
                onViewAchievements: () {
                  Navigator.pop(context);
                  context.push('/achievements');
                },
              ),
              const SizedBox(height: 24),
            ],
          ),
        );
      },
    );
  }

  Widget _buildStatsGrid() {
    final metrics = _dashboardData?['metrics'] ?? {};
    final successRate = metrics['successRate'] ?? 0;
    final practiceSessions = metrics['practiceSessions'] ?? 0;
    final totalTimeMinutes = metrics['totalTimeMinutes'] ?? 0;
    final totalCorrect = metrics['totalCorrect'] ?? 0;
    final totalAttempted = metrics['totalAttempted'] ?? 0;

    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.5,
      children: [
        _buildStatCard(
          title: 'Success Rate',
          value: '$successRate%',
          icon: Icons.emoji_events_outlined,
          color: Colors.orange,
        ),
        _buildStatCard(
          title: 'Practice Time',
          value: '$totalTimeMinutes Min',
          icon: Icons.timer_outlined,
          color: Colors.blue,
        ),
        _buildStatCard(
          title: 'Sessions Run',
          value: '$practiceSessions',
          icon: Icons.fitness_center_outlined,
          color: AppColors.primary,
        ),
        _buildStatCard(
          title: 'Correct Answers',
          value: '$totalCorrect / $totalAttempted',
          icon: Icons.done_all_rounded,
          color: Colors.green,
        ),
      ],
    );
  }

  Widget _buildStatCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
  }) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: AppColors.surfaceContainer, width: 1),
      ),
      color: Colors.white,
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Row(
              children: [
                Icon(icon, color: color, size: 22),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.onSurfaceVariant,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              value,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.onSurface,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildUpcomingTasks(ThemeData theme) {
    final upcomingTasks = _dashboardData?['upcomingTasks'] as List? ?? [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Upcoming Schedule & Tasks',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: AppColors.onSurface,
              ),
            ),
            if (upcomingTasks.isNotEmpty)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${upcomingTasks.length} pending',
                  style: const TextStyle(
                    color: AppColors.primary,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 12),
        if (upcomingTasks.isEmpty)
          Card(
            elevation: 0,
            color: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: BorderSide(color: AppColors.surfaceContainer),
            ),
            child: const Padding(
              padding: EdgeInsets.all(20.0),
              child: Row(
                children: [
                  Icon(Icons.celebration_rounded, color: AppColors.accent, size: 36),
                  SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'All caught up!',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'No upcoming assignments or scheduled lessons.',
                          style: TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant),
                        ),
                      ],
                    ),
                  )
                ],
              ),
            ),
          )
        else
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: upcomingTasks.length,
            separatorBuilder: (context, index) => const SizedBox(height: 8),
            itemBuilder: (context, index) {
              final task = upcomingTasks[index];
              final String type = task['type'] ?? 'task';
              final String title = task['title'] ?? 'CBC Lesson';
              final String subject = task['subject'] ?? 'General';
              final String dueStr = task['due'] ?? '';
              final String priority = task['priority'] ?? 'medium';

              Color priorityColor = Colors.blue;
              if (priority == 'high') priorityColor = AppColors.error;
              if (priority == 'low') priorityColor = Colors.green;

              DateTime? dueDateTime;
              try {
                dueDateTime = DateTime.parse(dueStr);
              } catch (_) {}

              final String formattedTime = dueDateTime != null
                  ? DateFormat('EEE, MMM d, h:mm a').format(dueDateTime)
                  : dueStr;

              return Card(
                elevation: 0,
                color: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: BorderSide(color: AppColors.surfaceContainer),
                ),
                child: ListTile(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  leading: CircleAvatar(
                    backgroundColor: type == 'assignment'
                        ? Colors.amber.shade100
                        : Colors.green.shade100,
                    child: Icon(
                      type == 'assignment' ? Icons.assignment_turned_in : Icons.video_camera_front,
                      color: type == 'assignment' ? Colors.amber.shade900 : Colors.green.shade900,
                    ),
                  ),
                  title: Text(
                    title,
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 4),
                      Text('$subject • $formattedTime', style: const TextStyle(fontSize: 12)),
                    ],
                  ),
                  trailing: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: priorityColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      priority.toUpperCase(),
                      style: TextStyle(
                        color: priorityColor,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
      ],
    );
  }

  Widget _buildRecentActivities(ThemeData theme) {
    final recentActivities = _dashboardData?['recentActivities'] as List? ?? [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Recent Activities',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
            color: AppColors.onSurface,
          ),
        ),
        const SizedBox(height: 12),
        if (recentActivities.isEmpty)
          Card(
            elevation: 0,
            color: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: BorderSide(color: AppColors.surfaceContainer),
            ),
            child: const Padding(
              padding: EdgeInsets.all(20.0),
              child: Center(
                child: Text(
                  'No recent sessions. Tap Subjects below to start practicing.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.onSurfaceVariant),
                ),
              ),
            ),
          )
        else
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: recentActivities.length,
            separatorBuilder: (context, index) => const SizedBox(height: 8),
            itemBuilder: (context, index) {
              final act = recentActivities[index];
              final String subject = act['subject'] ?? 'Quiz';
              final String topic = act['topic'] ?? 'General';
              final int score = act['score'] ?? 0;
              final int attempted = act['questionsAttempted'] ?? 0;
              final int correct = act['correctAnswers'] ?? 0;
              final String type = act['type'] ?? 'practice';

              return Card(
                elevation: 0,
                color: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: BorderSide(color: AppColors.surfaceContainer),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(12.0),
                  child: Row(
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: AppColors.primary.withOpacity(0.08),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(
                          Icons.play_circle_filled_rounded,
                          color: AppColors.primary,
                          size: 28,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              subject,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              topic,
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.onSurfaceVariant,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            '$score%',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                              color: score >= 70 ? Colors.green : (score >= 40 ? Colors.orange : Colors.red),
                            ),
                          ),
                          Text(
                            '$correct/$attempted correct',
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppColors.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
      ],
    );
  }
}
