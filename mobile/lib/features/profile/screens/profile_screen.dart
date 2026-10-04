import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:dio/dio.dart';
import 'dart:io';
import '../../../core/network/api_client.dart';
import '../../../core/constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../auth/providers/auth_provider.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final ImagePicker _picker = ImagePicker();
  final ApiClient _apiClient = ApiClient();
  File? _selectedImage;
  bool _isUploading = false;

  Future<void> _pickAndUploadImage() async {
    final xFile = await _picker.pickImage(source: ImageSource.gallery, maxWidth: 512, maxHeight: 512);
    if (xFile == null) return;
    setState(() => _selectedImage = File(xFile.path));
    await _uploadImage();
  }

  Future<void> _uploadImage() async {
    if (_selectedImage == null) return;
    setState(() => _isUploading = true);
    try {
      final formData = FormData.fromMap({
        'avatar': await MultipartFile.fromFile(_selectedImage!.path, filename: 'avatar.jpg'),
      });
      final res = await _apiClient.dio.post('${AppConstants.profile}/avatar', data: formData);
      if (res.statusCode == 200 && mounted) {
        final avatarUrl = res.data['avatarUrl'] as String?;
        if (avatarUrl != null) {
          final authProvider = Provider.of<AuthProvider>(context, listen: false);
          final user = Map<String, dynamic>.from(authProvider.currentUser ?? {});
          user['avatar'] = avatarUrl;
          // Refresh provider or update locally
        }
        _showSuccess('Profile picture updated');
      }
    } catch (_) {
      if (mounted) _showError('Failed to upload image');
    }
    if (mounted) setState(() => _isUploading = false);
  }

  void _showError(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: Colors.red));
  }

  void _showSuccess(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: Colors.green));
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.currentUser;

    if (user == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final name = '${user['firstName'] ?? ''} ${user['lastName'] ?? ''}'.trim();
    final email = user['email'] ?? '';
    final role = user['role']?.toString().toUpperCase() ?? 'STUDENT';
    final grade = user['grade'];
    final term = user['term'];
    final avatar = user['avatar'] as String?;

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Profile', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: AppColors.primaryGreen,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            const SizedBox(height: 16),
            Center(
              child: GestureDetector(
                onTap: _isUploading ? null : _pickAndUploadImage,
                child: Stack(
                  children: [
                    CircleAvatar(
                      radius: 50,
                      backgroundColor: AppColors.primaryGreen.withOpacity(0.1),
                      backgroundImage: avatar != null && avatar.isNotEmpty
                          ? NetworkImage('${AppConstants.baseHttpUrl}$avatar')
                          : (_selectedImage != null ? FileImage(_selectedImage!) : null) as ImageProvider?,
                      child: (avatar == null || avatar.isEmpty) && _selectedImage == null
                          ? Text(name.isNotEmpty ? name[0].toUpperCase() : 'U',
                              style: const TextStyle(color: AppColors.primaryGreen, fontSize: 40, fontWeight: FontWeight.bold))
                          : null,
                    ),
                    if (_isUploading)
                      Positioned.fill(
                        child: Container(
                          decoration: BoxDecoration(
                            color: Colors.black26,
                            borderRadius: BorderRadius.circular(50),
                          ),
                          child: const Center(child: CircularProgressIndicator(color: Colors.white)),
                        ),
                      )
                    else
                      Positioned(
                        bottom: 0, right: 0,
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            color: AppColors.primaryGreen,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 2),
                          ),
                          child: const Icon(Icons.camera_alt_rounded, size: 18, color: Colors.white),
                        ),
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 8),
            Text('Tap to change photo', style: TextStyle(fontSize: 12, color: Colors.grey[500])),
            const SizedBox(height: 12),
            Text(name.isNotEmpty ? name : email,
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.black87)),
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.accentGolden.withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(role,
                style: const TextStyle(color: AppColors.primaryGreen, fontWeight: FontWeight.bold, fontSize: 12)),
            ),
            const SizedBox(height: 32),
            const Align(
              alignment: Alignment.centerLeft,
              child: Text('Account Details',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primaryGreen)),
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
            const Align(
              alignment: Alignment.centerLeft,
              child: Text('Settings & Security',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primaryGreen)),
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
            SizedBox(
              width: double.infinity, height: 54,
              child: ElevatedButton.icon(
                onPressed: () async {
                  final ap = Provider.of<AuthProvider>(context, listen: false);
                  await ap.logout();
                },
                icon: const Icon(Icons.logout, color: Colors.white),
                label: const Text('Sign Out of Adaptive CBC',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red[700],
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
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
