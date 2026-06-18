import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../auth/providers/auth_provider.dart';

class FullScreenMenu extends StatelessWidget {
  const FullScreenMenu({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final user = Provider.of<AuthProvider>(context).currentUser;
    final firstName = user?['firstName'] ?? 'Student';
    final initial = firstName.isNotEmpty ? firstName[0].toUpperCase() : 'S';

    return Scaffold(
      backgroundColor: AppColors.primary,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close_rounded, color: Colors.white, size: 32),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            const SizedBox(height: 20),
            // User Header
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                CircleAvatar(
                  radius: 36,
                  backgroundColor: Colors.white,
                  child: Text(
                    initial,
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Hello, $firstName!',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      'Adaptive CBC',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.8),
                        fontSize: 16,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 48),
            
            // Menu Items
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                children: [
                  _buildMenuItem(
                    context, 
                    icon: Icons.dashboard_rounded, 
                    title: 'Dashboard', 
                    onTap: () {
                      Navigator.pop(context);
                      context.go('/home');
                    }
                  ),
                  _buildMenuItem(
                    context, 
                    icon: Icons.book_rounded, 
                    title: 'Subjects & Units', 
                    onTap: () {
                      Navigator.pop(context);
                      context.push('/subjects');
                    }
                  ),
                  _buildMenuItem(
                    context, 
                    icon: Icons.video_camera_front_rounded, 
                    title: 'Live Classes', 
                    onTap: () {
                      Navigator.pop(context);
                      context.push('/live-classes');
                    }
                  ),
                  _buildMenuItem(
                    context, 
                    icon: Icons.assignment_rounded, 
                    title: 'Practice & Quizzes', 
                    onTap: () {
                      Navigator.pop(context);
                      context.push('/practice');
                    }
                  ),
                  _buildMenuItem(
                    context, 
                    icon: Icons.emoji_events_rounded, 
                    title: 'Gamification & Rewards', 
                    onTap: () {
                      Navigator.pop(context);
                      context.push('/gamification');
                    }
                  ),
                  _buildMenuItem(
                    context, 
                    icon: Icons.bar_chart_rounded, 
                    title: 'Learning Analytics', 
                    onTap: () {
                      Navigator.pop(context);
                      context.push('/analytics');
                    }
                  ),
                  _buildMenuItem(
                    context, 
                    icon: Icons.chat_bubble_rounded, 
                    title: 'Chat & Tutors', 
                    onTap: () {
                      Navigator.pop(context);
                      context.push('/chat');
                    }
                  ),
                  _buildMenuItem(
                    context, 
                    icon: Icons.library_books_rounded, 
                    title: 'Digital Library', 
                    onTap: () {
                      Navigator.pop(context);
                      context.push('/library');
                    }
                  ),
                  _buildMenuItem(
                    context, 
                    icon: Icons.quiz_rounded, 
                    title: 'Question Bank', 
                    onTap: () {
                      Navigator.pop(context);
                      context.push('/questions');
                    }
                  ),
                  _buildMenuItem(
                    context, 
                    icon: Icons.menu_book_rounded, 
                    title: 'Learning Materials', 
                    onTap: () {
                      Navigator.pop(context);
                      context.push('/materials');
                    }
                  ),
                  _buildMenuItem(
                    context, 
                    icon: Icons.account_balance_rounded, 
                    title: 'School Details', 
                    onTap: () {
                      Navigator.pop(context);
                      context.push('/school');
                    }
                  ),
                  _buildMenuItem(
                    context, 
                    icon: Icons.people_rounded, 
                    title: 'Teachers & Tutors', 
                    onTap: () {
                      Navigator.pop(context);
                      context.push('/teachers');
                    }
                  ),
                  _buildMenuItem(
                    context, 
                    icon: Icons.storefront_rounded, 
                    title: 'Reward Store', 
                    onTap: () {
                      Navigator.pop(context);
                      context.push('/store');
                    }
                  ),
                  _buildMenuItem(
                    context, 
                    icon: Icons.calendar_month_rounded, 
                    title: 'My Schedule', 
                    onTap: () {
                      Navigator.pop(context);
                      context.push('/schedule');
                    }
                  ),
                  _buildMenuItem(
                    context, 
                    icon: Icons.trending_up_rounded, 
                    title: 'My Progress', 
                    onTap: () {
                      Navigator.pop(context);
                      context.push('/progress');
                    }
                  ),
                  _buildMenuItem(
                    context, 
                    icon: Icons.leaderboard_rounded, 
                    title: 'Leaderboard', 
                    onTap: () {
                      Navigator.pop(context);
                      context.push('/leaderboard');
                    }
                  ),
                  const Divider(color: Colors.white24, height: 48),
                  _buildMenuItem(
                    context, 
                    icon: Icons.person_rounded, 
                    title: 'Profile & Settings', 
                    onTap: () {
                      Navigator.pop(context);
                      context.push('/profile');
                    }
                  ),
                  _buildMenuItem(
                    context, 
                    icon: Icons.logout_rounded, 
                    title: 'Logout', 
                    onTap: () {
                      Navigator.pop(context);
                      Provider.of<AuthProvider>(context, listen: false).logout();
                    }
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuItem(BuildContext context, {required IconData icon, required String title, required VoidCallback onTap}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24.0),
      child: GestureDetector(
        onTap: onTap,
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: Colors.white, size: 28),
            ),
            const SizedBox(width: 20),
            Expanded(
              child: Text(
                title,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.5,
                ),
              ),
            ),
            const Icon(Icons.chevron_right_rounded, color: Colors.white54),
          ],
        ),
      ),
    );
  }
}
