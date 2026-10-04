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
import 'features/assignments/screens/assignments_screen.dart';
import 'features/assignments/screens/assignment_detail_screen.dart';
import 'features/history/screens/attempt_history_screen.dart';
import 'features/teacher/screens/reviews_screen.dart';
import 'features/teacher/screens/author_studio_screen.dart';
import 'features/materials/screens/materials_screen.dart';
import 'features/school/screens/school_screen.dart';
import 'features/teachers/screens/teachers_screen.dart';
import 'features/tutor/screens/tutor_dashboard_screen.dart';
import 'features/tutor/screens/tutor_sessions_screen.dart';
import 'features/tutor/screens/tutor_session_screen.dart';
import 'features/tutor/screens/tutor_session_detail_screen.dart';
import 'features/tutor/screens/tutor_bookings_screen.dart';
import 'features/tutor/screens/tutor_availability_screen.dart';
import 'features/tutor/screens/tutor_earnings_screen.dart';
import 'features/tutor/screens/tutor_profile_screen.dart';
import 'features/tutor/screens/tutor_students_screen.dart';
import 'features/tutor/screens/tutor_browse_screen.dart';
import 'features/tutor/screens/tutor_detail_screen.dart';
import 'features/tutor/screens/tutor_booking_screen.dart';
import 'features/tutor/screens/tutor_withdrawal_screen.dart';
import 'features/tutor/screens/tutor_wallet_settings_screen.dart';
import 'shared/widgets/tutor_nav_shell.dart';
import 'features/store/screens/store_screen.dart';
import 'features/store/screens/cart_screen.dart';
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
          if (role == 'parent') return '/parent';
          if (role == 'teacher' || role == 'tutor' || role == 'super_admin' || role == 'institution_admin') return '/tutor/dashboard';
          return '/home';
        }

        final role = authProvider.currentUser?['role'] ?? 'student';
        final path = state.uri.toString();

        // 3. If parent but not on a parent route, redirect to parent dashboard
        if (role == 'parent' && 
            !path.startsWith('/parent') && 
            !path.startsWith('/chat') && 
            !path.startsWith('/profile')) {
          return '/parent';
        }

        // 4. If student but on parent route, redirect to home
        if (role != 'parent' && path.startsWith('/parent')) {
          return '/home';
        }

        // 5. Block non-tutors from accessing tutor-only routes
        final isTutorRole = role == 'teacher' || role == 'tutor' || role == 'super_admin' || role == 'institution_admin';
        if (!isTutorRole && path.startsWith('/tutor/') && !path.startsWith('/tutors') && path != '/tutors') {
          return '/home';
        }

        // 6. Redirect teachers from student-only routes
        if (isTutorRole) {
          final studentOnly = path == '/home' || path == '/subjects' || path.startsWith('/subjects?') ||
              path.startsWith('/achievements') || path.startsWith('/analytics') ||
              path.startsWith('/attempt-history') || path.startsWith('/questions') ||
              path.startsWith('/store') || path.startsWith('/schedule') ||
              path.startsWith('/progress') || path.startsWith('/leaderboard') ||
              path.startsWith('/courses') || path.startsWith('/practice/') ||
              path.startsWith('/assignments');
          if (studentOnly) return '/tutor/dashboard';
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
        // Student-facing tutor browsing (no bottom nav needed)
        GoRoute(
          path: '/tutors',
          builder: (context, state) => const TutorBrowseScreen(),
        ),
        GoRoute(
          path: '/tutors/:id',
          builder: (context, state) {
            final id = state.pathParameters['id']!;
            return TutorDetailScreen(tutorId: id);
          },
          routes: [
            GoRoute(
              path: 'book',
              builder: (context, state) {
                final id = state.pathParameters['id']!;
                final data = state.extra as Map<String, dynamic>? ?? {};
                return TutorBookingScreen(tutorId: id, tutorData: data);
              },
            ),
          ],
        ),
        // Live session room (fullscreen, no bottom nav)
        GoRoute(
          path: '/tutor/session/:id',
          builder: (context, state) {
            final id = state.pathParameters['id']!;
            final extra = state.extra is Map ? state.extra as Map<String, dynamic> : <String, dynamic>{};
            return TutorSessionScreen(
              sessionId: id,
              role: extra['role'] as String? ?? 'tutor',
            );
          },
        ),
        // Tutor main screens with bottom nav shell
        ShellRoute(
          builder: (context, state, child) => TutorNavShell(child: child),
          routes: [
            GoRoute(
              path: '/tutor/dashboard',
              builder: (context, state) => const TutorDashboardScreen(),
            ),
            GoRoute(
              path: '/tutor/sessions',
              builder: (context, state) => const TutorSessionsScreen(),
              routes: [
                GoRoute(
                  path: ':id',
                  builder: (context, state) {
                    final id = state.pathParameters['id']!;
                    return TutorSessionDetailScreen(sessionId: id);
                  },
                ),
              ],
            ),
            GoRoute(
              path: '/tutor/bookings',
              builder: (context, state) => const TutorBookingsScreen(),
            ),
            GoRoute(
              path: '/tutor/availability',
              builder: (context, state) => const TutorAvailabilityScreen(),
            ),
            GoRoute(
              path: '/tutor/earnings',
              builder: (context, state) => const TutorEarningsScreen(),
              routes: [
                GoRoute(
                  path: 'withdraw',
                  builder: (context, state) => const TutorWithdrawalScreen(),
                ),
                GoRoute(
                  path: 'wallet-settings',
                  builder: (context, state) => const TutorWalletSettingsScreen(),
                ),
              ],
            ),
            GoRoute(
              path: '/tutor/profile',
              builder: (context, state) => const TutorProfileScreen(),
            ),
            GoRoute(
              path: '/tutor/students',
              builder: (context, state) => const TutorStudentsScreen(),
            ),
          ],
        ),
        GoRoute(
          path: '/store',
          builder: (context, state) => const StoreScreen(),
        ),
        GoRoute(
          path: '/cart',
          builder: (context, state) {
            final extra = state.extra is Map ? state.extra as Map<String, dynamic> : <String, dynamic>{};
            Map<String, int> cart;
            final rawCart = extra['cart'];
            if (rawCart is Map) {
              cart = rawCart.map((k, v) => MapEntry(k.toString(), (v is int) ? v : int.tryParse(v.toString()) ?? 0));
            } else {
              cart = <String, int>{};
            }
            return CartScreen(
              cart: cart,
              allProducts: extra['products'] is List ? extra['products'] as List<dynamic> : <dynamic>[],
            );
          },
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
        GoRoute(
          path: '/assignments',
          builder: (context, state) => const AssignmentsScreen(),
          routes: [
            GoRoute(
              path: ':id',
              builder: (context, state) {
                final id = state.pathParameters['id']!;
                return AssignmentDetailScreen(assignmentId: id);
              },
            ),
          ],
        ),
        GoRoute(
          path: '/attempt-history',
          builder: (context, state) => const AttemptHistoryScreen(),
        ),
        GoRoute(
          path: '/reviews',
          builder: (context, state) => const ReviewsScreen(),
        ),
        GoRoute(
          path: '/author-studio',
          builder: (context, state) => const AuthorStudioScreen(),
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
              builder: (context, state) => SubjectsScreen(mode: state.uri.queryParameters['mode']),
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
