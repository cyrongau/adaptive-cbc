import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/auth/screens/otp_screen.dart';
import 'features/onboarding/screens/onboarding_screen.dart';
import 'features/home/screens/home_screen.dart';
import 'features/subjects/screens/subjects_screen.dart';
import 'features/analytics/screens/analytics_screen.dart';
import 'features/chat/screens/chat_list_screen.dart';
import 'features/chat/screens/chat_detail_screen.dart';
import 'features/parent/screens/parent_dashboard_screen.dart';
import 'features/profile/screens/profile_screen.dart';
import 'features/courses/screens/courses_screen.dart';
import 'features/courses/screens/course_detail_screen.dart';
import 'features/courses/screens/lesson_player_screen.dart';
import 'features/practice/screens/practice_setup_screen.dart';
import 'features/practice/screens/quiz_session_screen.dart';
import 'features/practice/screens/quiz_results_screen.dart';
import 'features/classes/screens/live_classes_screen.dart';
import 'features/classes/screens/live_meeting_screen.dart';
import 'features/classes/screens/teacher_cockpit_screen.dart';
import 'features/ai/screens/ai_chat_screen.dart';
import 'features/parent/screens/parent_report_detail_screen.dart';
import 'features/gamification/screens/achievements_screen.dart';
import 'features/library/screens/library_screen.dart';
import 'features/questions/screens/questions_screen.dart';
import 'features/materials/screens/materials_screen.dart';
import 'features/school/screens/school_screen.dart';
import 'features/teachers/screens/teachers_screen.dart';
import 'features/store/screens/store_screen.dart';
import 'features/schedule/screens/schedule_screen.dart';
import 'features/progress/screens/progress_screen.dart';
import 'features/leaderboard/screens/leaderboard_screen.dart';
import 'shared/widgets/bottom_nav_shell.dart';

class AdaptiveCBCApp extends StatefulWidget {
  const AdaptiveCBCApp({super.key});

  @override
  State<AdaptiveCBCApp> createState() => _AdaptiveCBCAppState();
}

class _AdaptiveCBCAppState extends State<AdaptiveCBCApp> {
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    
    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    _router = GoRouter(
      initialLocation: '/home',
      refreshListenable: authProvider,
      redirect: (context, state) {
        final isAuthenticated = authProvider.currentUser != null;
        final isTwoFactorPending = authProvider.isTwoFactorPending;
        final hasSeenOnboarding = authProvider.hasSeenOnboarding;
        final goingToLogin = state.uri.toString() == '/login';
        final goingToOtp = state.uri.toString() == '/otp';
        final goingToOnboarding = state.uri.toString() == '/onboarding';

        // 1. If not authenticated, force login/otp/onboarding
        if (!isAuthenticated) {
          if (!hasSeenOnboarding) {
            if (goingToOnboarding) return null;
            return '/onboarding';
          }
          if (isTwoFactorPending) {
            if (goingToOtp) return null;
            return '/otp';
          }
          if (goingToLogin) return null;
          return '/login';
        }

        // 2. If authenticated and trying to go to auth or onboarding screens, redirect to correct landing
        if (goingToLogin || goingToOtp || goingToOnboarding) {
          final role = authProvider.currentUser?['role'] ?? 'student';
          return role == 'parent' ? '/parent' : '/home';
        }

        // 3. If parent but not on a parent route, redirect to parent dashboard
        final role = authProvider.currentUser?['role'] ?? 'student';
        if (role == 'parent' && 
            !state.uri.toString().startsWith('/parent') && 
            !state.uri.toString().startsWith('/chat') && 
            !state.uri.toString().startsWith('/profile')) {
          return '/parent';
        }

        // 4. If student but on parent route, redirect to home
        if (role != 'parent' && state.uri.toString().startsWith('/parent')) {
          return '/home';
        }

        return null;
      },
      routes: [
        GoRoute(
          path: '/onboarding',
          builder: (context, state) => const OnboardingScreen(),
        ),
        GoRoute(
          path: '/login',
          builder: (context, state) => const LoginScreen(),
        ),
        GoRoute(
          path: '/otp',
          builder: (context, state) => const OtpScreen(),
        ),
        GoRoute(
          path: '/practice/setup',
          builder: (context, state) {
            final args = state.extra as Map<String, dynamic>;
            return PracticeSetupScreen(
              subjectId: args['subjectId'] as String,
              subjectName: args['subjectName'] as String,
              topicId: args['topicId'] as String,
              topicName: args['topicName'] as String,
              grade: args['grade'] as int,
            );
          },
        ),
        GoRoute(
          path: '/practice/session',
          builder: (context, state) {
            final args = state.extra as Map<String, dynamic>;
            return QuizSessionScreen(
              sessionId: args['sessionId'] as String?,
              quizData: args['quizData'] as Map<String, dynamic>?,
              subjectName: args['subjectName'] as String,
              topicName: args['topicName'] as String,
              isFallback: args['isFallback'] as bool,
            );
          },
        ),
        GoRoute(
          path: '/practice/results',
          builder: (context, state) {
            final args = state.extra as Map<String, dynamic>;
            return QuizResultsScreen(
              score: args['score'] as int,
              total: args['total'] as int,
              xpAwarded: args['xpAwarded'] as int,
              subjectName: args['subjectName'] as String,
              topicName: args['topicName'] as String,
            );
          },
        ),
        GoRoute(
          path: '/live/meeting',
          builder: (context, state) {
            final args = state.extra as Map<String, dynamic>;
            return LiveMeetingScreen(
              roomId: args['roomId'] as String,
              roomName: args['roomName'] as String,
              hostName: args['hostName'] as String,
            );
          },
        ),
        GoRoute(
          path: '/live/studio',
          builder: (context, state) {
            final args = state.extra as Map<String, dynamic>;
            return TeacherCockpitScreen(
              roomId: args['roomId'] as String,
              roomName: args['roomName'] as String,
            );
          },
        ),
        GoRoute(
          path: '/ai-chat',
          builder: (context, state) => const AiChatScreen(),
        ),
        GoRoute(
          path: '/parent/report-detail',
          builder: (context, state) {
            final extra = state.extra as Map<String, dynamic>? ?? {};
            return ParentReportDetailScreen(
              report: extra['report'] as Map<String, dynamic>? ?? {},
              childName: extra['childName'] as String? ?? 'Student',
            );
          },
        ),
        GoRoute(
          path: '/achievements',
          builder: (context, state) => const AchievementsScreen(),
        ),
        GoRoute(
          path: '/library',
          builder: (context, state) => const LibraryScreen(),
        ),
        GoRoute(
          path: '/questions',
          builder: (context, state) => const QuestionsScreen(),
        ),
        GoRoute(
          path: '/materials',
          builder: (context, state) => const MaterialsScreen(),
        ),
        GoRoute(
          path: '/school',
          builder: (context, state) => const SchoolScreen(),
        ),
        GoRoute(
          path: '/teachers',
          builder: (context, state) => const TeachersScreen(),
        ),
        GoRoute(
          path: '/store',
          builder: (context, state) => const StoreScreen(),
        ),
        GoRoute(
          path: '/schedule',
          builder: (context, state) => const ScheduleScreen(),
        ),
        GoRoute(
          path: '/progress',
          builder: (context, state) => const ProgressScreen(),
        ),
        GoRoute(
          path: '/leaderboard',
          builder: (context, state) => const LeaderboardScreen(),
        ),
        ShellRoute(
          builder: (context, state, child) {
            return BottomNavShell(child: child);
          },
          routes: [
            GoRoute(
              path: '/home',
              builder: (context, state) => const HomeScreen(),
            ),
            GoRoute(
              path: '/subjects',
              builder: (context, state) => const SubjectsScreen(),
            ),
            GoRoute(
              path: '/courses',
              builder: (context, state) => const CoursesScreen(),
              routes: [
                GoRoute(
                  path: ':id',
                  builder: (context, state) {
                    final courseId = state.pathParameters['id']!;
                    return CourseDetailScreen(courseId: courseId);
                  },
                ),
                GoRoute(
                  path: 'lesson/:lessonId',
                  builder: (context, state) {
                    final lesson = state.extra as Map<String, dynamic>;
                    return LessonPlayerScreen(lesson: lesson);
                  },
                ),
              ],
            ),
            GoRoute(
              path: '/analytics',
              builder: (context, state) => const AnalyticsScreen(),
            ),
            GoRoute(
              path: '/chat',
              builder: (context, state) => const ChatListScreen(),
              routes: [
                GoRoute(
                  path: ':id',
                  builder: (context, state) {
                    final conversationId = state.pathParameters['id']!;
                    final extra = state.extra as Map<String, dynamic>?;
                    final recipientName = extra?['name'] ?? 'Chat';
                    final recipientRole = extra?['role'] ?? '';
                    return ChatDetailScreen(
                      conversationId: conversationId,
                      recipientName: recipientName,
                      recipientRole: recipientRole,
                    );
                  },
                ),
              ],
            ),
            GoRoute(
              path: '/parent',
              builder: (context, state) => const ParentDashboardScreen(),
            ),
            GoRoute(
              path: '/profile',
              builder: (context, state) => const ProfileScreen(),
            ),
            GoRoute(
              path: '/live',
              builder: (context, state) => const LiveClassesScreen(),
            ),
          ],
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Adaptive CBC',
      theme: AppTheme.lightTheme,
      routerConfig: _router,
      debugShowCheckedModeBanner: false,
    );
  }
}
