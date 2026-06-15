import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../auth/providers/auth_provider.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.currentUser;

    if (user == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final name = '${user['firstName'] ?? ''} ${user['lastName'] ?? ''}'.trim();
    final email = user['email'] ?? '';
    final role = user['role']?.toString().toUpperCase() ?? 'STUDENT';
    final grade = user['grade'];
    final term = user['term'];

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'My Profile',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: AppColors.primaryGreen,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            const SizedBox(height: 16),
            
            // Profile Card Header
            Center(
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 50,
                    backgroundColor: AppColors.primaryGreen.withOpacity(0.1),
                    child: Text(
                      name.isNotEmpty ? name[0].toUpperCase() : 'U',
                      style: const TextStyle(
                        color: AppColors.primaryGreen,
                        fontSize: 40,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    name.isNotEmpty ? name : email,
                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.black87),
                  ),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.accentGolden.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      role,
                      style: const TextStyle(
                        color: AppColors.primaryGreen,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),

            // Profile info items list
            const Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'Account Details',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primaryGreen),
              ),
            ),
            const SizedBox(height: 12),
            Card(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    _buildInfoRow(Icons.email, 'Email Address', email),
                    if (grade != null) ...[
                      const Divider(height: 24),
                      _buildInfoRow(Icons.grade, 'CBC Grade', 'Grade $grade'),
                    ],
                    if (term != null) ...[
                      const Divider(height: 24),
                      _buildInfoRow(Icons.calendar_today, 'School Term', 'Term $term'),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // App Settings
            const Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'Settings & Security',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primaryGreen),
              ),
            ),
            const SizedBox(height: 12),
            Card(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.notifications_active, color: AppColors.primaryGreen),
                    title: const Text('Push Notifications'),
                    trailing: Switch(
                      value: true,
                      activeThumbColor: AppColors.primaryGreen,
                      onChanged: (val) {},
                    ),
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.fingerprint, color: AppColors.primaryGreen),
                    title: const Text('Biometric Authentication'),
                    trailing: Switch(
                      value: false,
                      activeThumbColor: AppColors.primaryGreen,
                      onChanged: (val) {},
                    ),
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.info_outline, color: AppColors.primaryGreen),
                    title: const Text('App Version'),
                    trailing: const Text('1.0.0 (Adaptive CBC)', style: TextStyle(color: Colors.grey)),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 36),

            // Logout Action Button
            SizedBox(
              width: double.infinity,
              height: 54,
              child: ElevatedButton.icon(
                onPressed: () async {
                  final authProvider = Provider.of<AuthProvider>(context, listen: false);
                  await authProvider.logout();
                },
                icon: const Icon(Icons.logout, color: Colors.white),
                label: const Text(
                  'Sign Out of Adaptive CBC',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red[700],
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  elevation: 2,
                ),
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppColors.primaryGreen.withOpacity(0.05),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: AppColors.primaryGreen, size: 20),
        ),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
            const SizedBox(height: 2),
            Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.black87)),
          ],
        ),
      ],
    );
  }
}
