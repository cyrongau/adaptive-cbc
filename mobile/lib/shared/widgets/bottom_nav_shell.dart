import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../core/theme/app_colors.dart';

class BottomNavShell extends StatelessWidget {
  final Widget child;

  const BottomNavShell({super.key, required this.child});

  int _calculateSelectedIndex(BuildContext context, String role) {
    final String location = GoRouterState.of(context).uri.toString();
    
    if (role == 'parent') {
      if (location.startsWith('/parent')) return 0;
      if (location.startsWith('/chat')) return 1;
      if (location.startsWith('/profile')) return 2;
      return 0;
    } else {
      // Default: Student / Staff
      if (location.startsWith('/home')) return 0;
      if (location.startsWith('/subjects')) return 1;
      if (location.startsWith('/courses')) return 2;
      if (location.startsWith('/live')) return 3;
      if (location.startsWith('/analytics')) return 4;
      if (location.startsWith('/chat')) return 5;
      if (location.startsWith('/profile')) return 6;
      return 0;
    }
  }

  void _onItemTapped(int index, BuildContext context, String role) {
    if (role == 'parent') {
      switch (index) {
        case 0:
          context.go('/parent');
          break;
        case 1:
          context.go('/chat');
          break;
        case 2:
          context.go('/profile');
          break;
      }
    } else {
      switch (index) {
        case 0:
          context.go('/home');
          break;
        case 1:
          context.go('/subjects');
          break;
        case 2:
          context.go('/courses');
          break;
        case 3:
          context.go('/live');
          break;
        case 4:
          context.go('/analytics');
          break;
        case 5:
          context.go('/chat');
          break;
        case 6:
          context.go('/profile');
          break;
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.currentUser;
    final role = user?['role'] ?? 'student';

    final int currentIndex = _calculateSelectedIndex(context, role);

    List<BottomNavigationBarItem> navItems = [];
    if (role == 'parent') {
      navItems = const [
        BottomNavigationBarItem(
          icon: Icon(Icons.family_restroom_outlined),
          activeIcon: Icon(Icons.family_restroom),
          label: 'Portal',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.chat_bubble_outline_rounded),
          activeIcon: Icon(Icons.chat_bubble_rounded),
          label: 'Chat',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.person_outline_rounded),
          activeIcon: Icon(Icons.person_rounded),
          label: 'Profile',
        ),
      ];
    } else {
      navItems = const [
        BottomNavigationBarItem(
          icon: Icon(Icons.home_outlined),
          activeIcon: Icon(Icons.home_rounded),
          label: 'Home',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.menu_book_outlined),
          activeIcon: Icon(Icons.menu_book_rounded),
          label: 'Subjects',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.play_lesson_outlined),
          activeIcon: Icon(Icons.play_lesson_rounded),
          label: 'Courses',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.videocam_outlined),
          activeIcon: Icon(Icons.videocam_rounded),
          label: 'Live',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.bar_chart_outlined),
          activeIcon: Icon(Icons.bar_chart_rounded),
          label: 'Analytics',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.chat_bubble_outline_rounded),
          activeIcon: Icon(Icons.chat_bubble_rounded),
          label: 'Chat',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.person_outline_rounded),
          activeIcon: Icon(Icons.person_rounded),
          label: 'Profile',
        ),
      ];
    }

    return Scaffold(
      body: child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: currentIndex,
        onTap: (index) => _onItemTapped(index, context, role),
        type: BottomNavigationBarType.fixed,
        backgroundColor: Colors.white,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: AppColors.onSurfaceVariant.withOpacity(0.6),
        selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
        unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.normal, fontSize: 12),
        items: navItems,
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          context.push('/ai-chat');
        },
        backgroundColor: AppColors.primary,
        icon: const Icon(Icons.auto_awesome, color: Colors.white),
        label: const Text('Ask AI', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
    );
  }
}
