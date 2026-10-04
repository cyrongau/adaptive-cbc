import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants.dart';
import '../services/tutor_service.dart';

class TutorProfileScreen extends StatefulWidget {
  const TutorProfileScreen({super.key});

  @override
  State<TutorProfileScreen> createState() => _TutorProfileScreenState();
}

class _TutorProfileScreenState extends State<TutorProfileScreen> {
  final TutorService _service = TutorService();
  final ApiClient _apiClient = ApiClient();
  bool _isLoading = true;
  bool _isSaving = false;

  // Page state
  String _pageState = 'loading'; // loading, noProfile, apply, pending, approved

  // Form controllers
  final _bioController = TextEditingController();
  final _qualificationsController = TextEditingController();
  final _headlineController = TextEditingController();
  final _aboutMeController = TextEditingController();
  final _methodologyController = TextEditingController();
  final _locationController = TextEditingController();
  final _experienceController = TextEditingController();

  // Notification preferences
  bool _notifyBookingRequest = true;
  bool _notifySessionReminder = true;
  bool _notifyNewStudent = true;
  bool _notifyWithdrawal = true;

  // Subjects
  List<dynamic> _allSubjects = [];
  List<Map<String, dynamic>> _selectedSubjects = [];
  bool _isOnline = false;
  bool _isInPerson = false;

  // Existing data
  Map<String, dynamic> _profileData = {};

  @override
  void initState() {
    super.initState();
    _init();
  }

  @override
  void dispose() {
    _bioController.dispose();
    _qualificationsController.dispose();
    _headlineController.dispose();
    _aboutMeController.dispose();
    _methodologyController.dispose();
    _locationController.dispose();
    _experienceController.dispose();
    super.dispose();
  }

  Future<void> _init() async {
    setState(() => _isLoading = true);
    try {
      _allSubjects = await _fetchSubjects();
      _profileData = await _service.getProfile();
      _populateForm(_profileData);
      setState(() => _pageState = 'approved');
    } catch (_) {
      // Profile not found — try application
      try {
        final app = await _service.getApplication();
        if (app['id'] != null) {
          setState(() => _pageState = 'pending');
        } else {
          setState(() => _pageState = 'noProfile');
        }
      } catch (_) {
        if (mounted) setState(() => _pageState = 'noProfile');
      }
    }
    if (mounted) setState(() => _isLoading = false);
  }

  Future<List<dynamic>> _fetchSubjects() async {
    try {
      final res = await _apiClient.dio.get(AppConstants.subjects);
      final data = res.data;
      if (data is List) return data;
      if (data is Map && data['data'] is List) return data['data'] as List;
      return [];
    } catch (_) {
      return [];
    }
  }

  void _populateForm(Map<String, dynamic> profile) {
    _bioController.text = profile['bio'] as String? ?? '';
    _qualificationsController.text = profile['qualifications'] as String? ?? '';
    _headlineController.text = profile['headline'] as String? ?? '';
    _aboutMeController.text = profile['aboutMe'] as String? ?? '';
    _methodologyController.text = profile['teachingMethodology'] as String? ?? '';
    _locationController.text = profile['location'] as String? ?? '';
    _experienceController.text = (profile['experienceYears'] as num?)?.toString() ?? '';
    _isOnline = profile['isAvailableForOnline'] as bool? ?? false;
    _isInPerson = profile['isAvailableForInPerson'] as bool? ?? false;
    final subjects = profile['subjects'] as List<dynamic>? ?? [];
    _selectedSubjects = subjects.map((s) => Map<String, dynamic>.from(s as Map)).toList();
  }

  Future<void> _submitApplication() async {
    setState(() => _isSaving = true);
    try {
      await _service.apply({
        'bio': _bioController.text,
        'qualifications': _qualificationsController.text,
        'experienceYears': int.tryParse(_experienceController.text) ?? 0,
        'subjects': _selectedSubjects.map((s) => {
          'subjectId': s['subjectId'],
          'subjectName': s['subjectName'],
          'hourlyRate': s['hourlyRate'],
        }).toList(),
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Application submitted for review'), backgroundColor: Colors.green),
        );
        setState(() => _pageState = 'pending');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to submit application'), backgroundColor: Colors.red),
        );
      }
    }
    if (mounted) setState(() => _isSaving = false);
  }

  Future<void> _saveProfile() async {
    setState(() => _isSaving = true);
    try {
      await _service.updateProfile({
        'bio': _bioController.text,
        'qualifications': _qualificationsController.text,
        'headline': _headlineController.text,
        'aboutMe': _aboutMeController.text,
        'teachingMethodology': _methodologyController.text,
        'location': _locationController.text,
        'experienceYears': int.tryParse(_experienceController.text) ?? 0,
        'isAvailableForOnline': _isOnline,
        'isAvailableForInPerson': _isInPerson,
        'subjects': _selectedSubjects.map((s) => {
          'subjectId': s['subjectId'],
          'subjectName': s['subjectName'],
          'hourlyRate': s['hourlyRate'],
        }).toList(),
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Profile updated'), backgroundColor: Colors.green),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to update profile'), backgroundColor: Colors.red),
        );
      }
    }
    if (mounted) setState(() => _isSaving = false);
  }

  void _addSubject() {
    final available = _allSubjects.where((s) => !_selectedSubjects.any((sel) => sel['subjectId'] == s['id']?.toString())).toList();
    if (available.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('All subjects already added'), backgroundColor: Colors.orange),
      );
      return;
    }

    showDialog(
      context: context,
      builder: (ctx) {
        String? selectedId = available.first['id']?.toString();
        final rateController = TextEditingController(text: '500');
        return StatefulBuilder(
          builder: (ctx, setDialogState) => AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            title: const Text('Add Subject'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                InputDecorator(
                  decoration: const InputDecoration(labelText: 'Subject', border: OutlineInputBorder()),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: selectedId,
                      isDense: true,
                      isExpanded: true,
                      items: available.map((s) => DropdownMenuItem(
                        value: s['id']?.toString(),
                        child: Text(s['name'] as String? ?? ''),
                      )).toList(),
                      onChanged: (v) => setDialogState(() => selectedId = v),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: rateController,
                  decoration: const InputDecoration(
                    labelText: 'Hourly Rate (KSh)',
                    border: OutlineInputBorder(),
                    prefixText: 'KSh ',
                  ),
                  keyboardType: TextInputType.number,
                ),
              ],
            ),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
              ElevatedButton(
                onPressed: () {
                  final subject = available.firstWhere((s) => s['id']?.toString() == selectedId);
                  setState(() {
                    _selectedSubjects.add({
                      'subjectId': selectedId,
                      'subjectName': subject['name'] as String? ?? '',
                      'hourlyRate': int.tryParse(rateController.text) ?? 500,
                    });
                  });
                  Navigator.pop(ctx);
                },
                child: const Text('Add'),
              ),
            ],
          ),
        );
      },
    );
  }

  void _removeSubject(int index) {
    setState(() => _selectedSubjects.removeAt(index));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(_pageState == 'noProfile' ? 'Become a Tutor' : 'Tutor Profile'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
        actions: [
          if (_pageState == 'approved')
            TextButton.icon(
              onPressed: _isSaving ? null : _saveProfile,
              icon: _isSaving
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.save_rounded),
              label: const Text('Save'),
            ),
          if (_pageState == 'noProfile')
            TextButton.icon(
              onPressed: _isSaving ? null : _submitApplication,
              icon: _isSaving
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.send_rounded),
              label: const Text('Submit'),
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_pageState == 'pending') {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.hourglass_top_rounded, size: 80, color: Colors.orange[300]),
              const SizedBox(height: 24),
              const Text('Application Pending', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              Text('Your tutor application is under review.\nYou\'ll be notified once it\'s approved.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 14, color: Colors.grey[600], height: 1.5)),
              const SizedBox(height: 32),
              OutlinedButton.icon(
                onPressed: _init,
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('Check Status'),
              ),
            ],
          ),
        ),
      );
    }

    if (_pageState == 'noProfile') {
      return _buildForm(showAllFields: false);
    }

    if (_pageState == 'approved') {
      return _buildForm(showAllFields: true);
    }

    return const Center(child: Text('Something went wrong'));
  }

  Widget _buildForm({required bool showAllFields}) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (_pageState == 'approved') ...[
            _profileHeader(),
            const SizedBox(height: 24),
          ],
          _sectionTitle('Basic Info', Icons.person_rounded),
          const SizedBox(height: 12),
          if (showAllFields) ...[
            _buildField(_headlineController, 'Headline', 'e.g. Expert Mathematics Tutor', maxLines: 1),
            const SizedBox(height: 12),
          ],
          _buildField(_bioController, 'Bio', 'Tell students about yourself...'),
          const SizedBox(height: 12),
          if (showAllFields) ...[
            _buildField(_aboutMeController, 'About Me', 'Detailed description...', maxLines: 4),
            const SizedBox(height: 12),
            _buildField(_methodologyController, 'Teaching Methodology', 'Your teaching approach...', maxLines: 3),
            const SizedBox(height: 12),
          ],
          _buildField(_qualificationsController, 'Qualifications', 'Credentials, certifications...'),
          const SizedBox(height: 12),
          _buildField(_experienceController, 'Experience (Years)', 'e.g. 5', maxLines: 1, keyboardType: TextInputType.number),
          const SizedBox(height: 20),

          _sectionTitle('Subjects', Icons.menu_book_rounded),
          const SizedBox(height: 12),
          ..._selectedSubjects.asMap().entries.map((e) => _subjectChip(e.key, e.value)),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: _addSubject,
            icon: const Icon(Icons.add_rounded, size: 18),
            label: const Text('Add Subject'),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.primary,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
          if (showAllFields) ...[
            const SizedBox(height: 24),
            _sectionTitle('Settings', Icons.settings_rounded),
            const SizedBox(height: 12),
            _buildToggle('Available for online tutoring', _isOnline, (v) => setState(() => _isOnline = v)),
            const SizedBox(height: 8),
            _buildToggle('Available for in-person tutoring', _isInPerson, (v) => setState(() => _isInPerson = v)),
            const SizedBox(height: 12),
            _buildField(_locationController, 'Location', 'City / Area', maxLines: 1),
            const SizedBox(height: 24),
            _sectionTitle('Notifications', Icons.notifications_rounded),
            const SizedBox(height: 12),
            _buildToggle('Booking requests', _notifyBookingRequest, (v) => setState(() => _notifyBookingRequest = v)),
            const SizedBox(height: 8),
            _buildToggle('Session reminders', _notifySessionReminder, (v) => setState(() => _notifySessionReminder = v)),
            const SizedBox(height: 8),
            _buildToggle('New student enrolled', _notifyNewStudent, (v) => setState(() => _notifyNewStudent = v)),
            const SizedBox(height: 8),
            _buildToggle('Withdrawal updates', _notifyWithdrawal, (v) => setState(() => _notifyWithdrawal = v)),
            const SizedBox(height: 24),
          ],
          if (_pageState == 'noProfile')
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _isSaving ? null : _submitApplication,
                icon: _isSaving
                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.send_rounded),
                label: Text(_isSaving ? 'Submitting...' : 'Submit Application'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
              ),
            ),
          if (_pageState == 'approved')
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _isSaving ? null : _saveProfile,
                icon: _isSaving
                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.save_rounded),
                label: Text(_isSaving ? 'Saving...' : 'Save Profile'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
              ),
            ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _profileHeader() {
    final name = '${_profileData['user']?['firstName'] ?? ''} ${_profileData['user']?['lastName'] ?? ''}'.trim();
    final status = _profileData['status'] as String? ?? '';
    final rating = (_profileData['rating'] is num) ? (_profileData['rating'] as num).toDouble() : 0.0;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.primary, Color(0xFF1565C0)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 32,
            backgroundColor: Colors.white.withValues(alpha: 0.2),
            child: Text(name.isNotEmpty ? name[0].toUpperCase() : 'T',
              style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold)),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name.isNotEmpty ? name : 'Tutor', style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(Icons.star_rounded, size: 16, color: Colors.amber[300]),
                    const SizedBox(width: 4),
                    Text(rating.toStringAsFixed(1), style: const TextStyle(color: Colors.white70, fontSize: 13)),
                    const SizedBox(width: 16),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: status == 'approved' ? Colors.green.withValues(alpha: 0.2) : Colors.orange.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(status.isNotEmpty ? status[0].toUpperCase() + status.substring(1) : 'N/A',
                        style: TextStyle(color: status == 'approved' ? Colors.green[200] : Colors.orange[200], fontSize: 11, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _subjectChip(int index, Map<String, dynamic> subject) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Row(
        children: [
          Icon(Icons.menu_book_rounded, size: 18, color: AppColors.primary),
          const SizedBox(width: 10),
          Expanded(child: Text(subject['subjectName'] as String? ?? '',
            style: const TextStyle(fontWeight: FontWeight.w500))),
          Text('KSh ${subject['hourlyRate'] ?? ''}/hr',
            style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 13)),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: () => _removeSubject(index),
            child: Icon(Icons.close_rounded, size: 20, color: Colors.red[400]),
          ),
        ],
      ),
    );
  }

  Widget _buildField(TextEditingController controller, String label, String hint,
      {int maxLines = 3, TextInputType? keyboardType}) {
    return TextField(
      controller: controller,
      maxLines: maxLines,
      keyboardType: keyboardType,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        filled: true,
        fillColor: Colors.white,
      ),
    );
  }

  Widget _buildToggle(String label, bool value, ValueChanged<bool> onChanged) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: SwitchListTile(
        title: Text(label, style: const TextStyle(fontSize: 14)),
        value: value,
        onChanged: onChanged,
        activeThumbColor: AppColors.primary,
        contentPadding: EdgeInsets.zero,
      ),
    );
  }

  Widget _sectionTitle(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 20, color: AppColors.primary),
        const SizedBox(width: 8),
        Text(title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
      ],
    );
  }
}
