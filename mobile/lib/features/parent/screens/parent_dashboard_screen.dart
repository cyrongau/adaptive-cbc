import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../auth/providers/auth_provider.dart';
import 'package:go_router/go_router.dart';
import 'dart:async';
import '../../../core/services/notification_service.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

class ParentDashboardScreen extends StatefulWidget {
  const ParentDashboardScreen({super.key});

  @override
  State<ParentDashboardScreen> createState() => _ParentDashboardScreenState();
}

class _ParentDashboardScreenState extends State<ParentDashboardScreen> {
  final ApiClient _apiClient = ApiClient();
  bool _isLoading = false;
  List<dynamic> _children = [];
  List<dynamic> _reports = [];
  List<dynamic> _pendingDevices = [];

  // PIN reset dialog state
  String _selectedChildId = '';
  final TextEditingController _otpController = TextEditingController();
  final List<TextEditingController> _pinControllers = List.generate(4, (_) => TextEditingController());
  final List<FocusNode> _pinFocusNodes = List.generate(4, (_) => FocusNode());

  StreamSubscription<RemoteMessage>? _alertSubscription;

  @override
  void initState() {
    super.initState();
    _loadParentData();

    // Listen for real-time parent alerts
    _alertSubscription = NotificationService().onAlertReceived.listen((message) {
      if (mounted) {
        // Automatically refresh dashboard when a notification is received
        _loadParentData();
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(message.notification?.title ?? 'New Alert Received!'),
            backgroundColor: AppColors.primaryGreen,
            duration: const Duration(seconds: 4),
          ),
        );
      }
    });
  }

  @override
  void dispose() {
    _alertSubscription?.cancel();
    _otpController.dispose();
    for (var controller in _pinControllers) {
      controller.dispose();
    }
    for (var node in _pinFocusNodes) {
      node.dispose();
    }
    super.dispose();
  }

  Future<void> _loadParentData() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final responses = await Promise.all([
        _apiClient.dio.get('/auth/parent/profile'),
        _apiClient.dio.get('/analytics/parent/reports'),
        _apiClient.dio.get('/students/pending-approvals'),
      ]);

      setState(() {
        _children = responses[0].data['children'] as List? ?? [];
        _reports = responses[1].data as List? ?? [];
        _pendingDevices = responses[2].data as List? ?? [];
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to load parent portal: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _generateReport(String childId) async {
    setState(() {
      _isLoading = true;
    });

    try {
      final response = await _apiClient.dio.post(
        '/analytics/parent/report/generate',
        data: {'childId': childId},
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Report generated successfully!'),
            backgroundColor: Colors.green,
          ),
        );
        _loadParentData();
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Report generation failed: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _approveDevice(String studentId, String deviceId) async {
    try {
      final response = await _apiClient.dio.post(
        '/students/approve-device',
        data: {'studentId': studentId, 'deviceId': deviceId},
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Device approved!'),
            backgroundColor: Colors.green,
          ),
        );
        _loadParentData();
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Device approval failed: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _resetChildPin() async {
    final pin = _pinControllers.map((c) => c.text).join();
    final otp = _otpController.text.trim();

    if (pin.length < 4 || otp.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter 4-digit PIN and OTP')),
      );
      return;
    }

    try {
      final response = await _apiClient.dio.post(
        '/students/parent-pin-reset',
        data: {
          'studentId': _selectedChildId,
          'otp': otp,
          'newPin': pin,
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Child PIN reset successfully!'),
            backgroundColor: Colors.green,
          ),
        );
        _otpController.clear();
        for (var c in _pinControllers) {
          c.clear();
        }
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('PIN reset failed: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _showPinResetDialog(String childId, String childName) {
    _selectedChildId = childId;
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Text('Reset PIN for $childName'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Enter the verification OTP sent to your email and set a new 4-digit PIN.',
                  style: TextStyle(color: Colors.grey, fontSize: 13),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _otpController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'Verification OTP Code',
                    hintText: 'e.g. 123456',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'New 4-digit PIN:',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: List.generate(4, (index) {
                    return SizedBox(
                      width: 50,
                      child: TextField(
                        controller: _pinControllers[index],
                        focusNode: _pinFocusNodes[index],
                        keyboardType: TextInputType.number,
                        textAlign: TextAlign.center,
                        maxLength: 1,
                        style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                        decoration: const InputDecoration(
                          counterText: '',
                          border: OutlineInputBorder(),
                        ),
                        onChanged: (value) {
                          if (value.isNotEmpty && index < 3) {
                            FocusScope.of(context).requestFocus(_pinFocusNodes[index + 1]);
                          }
                          if (value.isEmpty && index > 0) {
                            FocusScope.of(context).requestFocus(_pinFocusNodes[index - 1]);
                          }
                        },
                      ),
                    );
                  }),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: _resetChildPin,
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryGreen),
              child: const Text('Save PIN', style: TextStyle(color: Colors.white)),
            ),
          ],
        );
      },
    );
  }

  // _showReportDetails removed in favor of navigating to ParentReportDetailScreen


  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Parent Portal',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: AppColors.primaryGreen,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadParentData,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(AppColors.primaryGreen),
              ),
            )
          : RefreshIndicator(
              onRefresh: _loadParentData,
              color: AppColors.primaryGreen,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header card
                    _buildWelcomeHeader(),
                    const SizedBox(height: 24),

                    // Children section
                    const Text(
                      'Linked Students',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primaryGreen),
                    ),
                    const SizedBox(height: 12),
                    _children.isEmpty
                        ? const Card(
                            child: Padding(
                              padding: EdgeInsets.all(16.0),
                              child: Text('No student accounts linked to your parent email. Contact institution admin.', style: TextStyle(color: Colors.grey)),
                            ),
                          )
                        : Column(
                            children: _children.map((c) => _buildChildCard(c)).toList(),
                          ),
                    const SizedBox(height: 24),

                    // Reports section
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Performance Reports',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primaryGreen),
                        ),
                        if (_children.isNotEmpty)
                          TextButton.icon(
                            icon: const Icon(Icons.add, size: 16, color: AppColors.accentGolden),
                            label: const Text('Generate Report', style: TextStyle(color: AppColors.accentGolden, fontWeight: FontWeight.bold)),
                            onPressed: () {
                              if (_children.length == 1) {
                                _generateReport(_children[0]['id']);
                              } else {
                                // Select child sheet
                                showModalBottomSheet(
                                  context: context,
                                  builder: (context) {
                                    return Container(
                                      padding: const EdgeInsets.all(16),
                                      child: Column(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          const Text('Select Child to Generate Report', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                          const SizedBox(height: 16),
                                          ..._children.map((c) => ListTile(
                                            title: Text('${c['firstName']} ${c['lastName']}'),
                                            trailing: const Icon(Icons.chevron_right),
                                            onTap: () {
                                              Navigator.pop(context);
                                              _generateReport(c['id']);
                                            },
                                          )),
                                        ],
                                      ),
                                    );
                                  },
                                );
                              }
                            },
                          ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    _reports.isEmpty
                        ? const Card(
                            child: Padding(
                              padding: EdgeInsets.all(16.0),
                              child: Text('No academic reports generated yet. Tap "Generate Report" above.', style: TextStyle(color: Colors.grey)),
                            ),
                          )
                        : Column(
                            children: _reports.map((r) => _buildReportTile(r)).toList(),
                          ),
                    const SizedBox(height: 24),

                    // Pending approvals
                    if (_pendingDevices.isNotEmpty) ...[
                      const Text(
                        'Pending Device Registrations',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.red),
                      ),
                      const SizedBox(height: 12),
                      Column(
                        children: _pendingDevices.map((d) => _buildDeviceCard(d)).toList(),
                      ),
                    ],
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildWelcomeHeader() {
    final parent = Provider.of<AuthProvider>(context).currentUser;
    final parentName = parent != null ? '${parent['firstName'] ?? ''} ${parent['lastName'] ?? ''}'.trim() : 'Parent';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.primaryGreen, Color(0xdd006a34)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.primaryGreen.withOpacity(0.3),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Welcome, $parentName',
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
          ),
          const SizedBox(height: 8),
          Text(
            'Keep track of your child\'s real-time CBC classroom activities, curriculum strengths, and approve security device authorization keys.',
            style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 13, height: 1.4),
          ),
        ],
      ),
    );
  }

  Widget _buildChildCard(dynamic child) {
    final name = '${child['firstName'] ?? ''} ${child['lastName'] ?? ''}'.trim();
    final grade = child['grade'] ?? 1;

    return Card(
      margin: const EdgeInsets.symmetric(vertical: 6),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                CircleAvatar(
                  backgroundColor: AppColors.accentGolden.withOpacity(0.2),
                  child: const Icon(Icons.person, color: AppColors.accentGolden),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                    const SizedBox(height: 4),
                    Text(
                      'CBC Grade $grade • ${child['status'] ?? 'Active'}',
                      style: const TextStyle(color: Colors.grey, fontSize: 12),
                    ),
                  ],
                ),
              ],
            ),
            IconButton(
              icon: const Icon(Icons.lock_reset, color: AppColors.primaryGreen),
              tooltip: 'Reset Child PIN',
              onPressed: () => _showPinResetDialog(child['id'], name),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReportTile(dynamic report) {
    final summary = report['summary'] ?? {};
    final progress = summary['overallProgress'] ?? 0;
    final sessions = summary['sessionsCompleted'] ?? 0;
    
    final child = _children.firstWhere(
      (c) => c['id'] == report['childId'],
      orElse: () => null,
    );
    final childName = child != null ? '${child['firstName']} ${child['lastName']}' : 'Student';

    final createdDate = DateTime.tryParse(report['createdAt'] ?? '');
    final dateStr = createdDate != null ? DateFormat('MMM d, y').format(createdDate) : 'Report';

    return Card(
      margin: const EdgeInsets.symmetric(vertical: 4),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppColors.primaryGreen.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: const Icon(Icons.assessment, color: AppColors.primaryGreen),
        ),
        title: Text('$childName Report', style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text('Score: $progress% • $sessions sessions completed'),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(dateStr, style: const TextStyle(color: Colors.grey, fontSize: 12)),
            const SizedBox(width: 4),
            const Icon(Icons.chevron_right),
          ],
        ),
        onTap: () {
          context.push(
            '/parent/report-detail',
            extra: {
              'report': report,
              'childName': childName,
            },
          );
        },
      ),
    );
  }

  Widget _buildDeviceCard(dynamic device) {
    final studentId = device['userId'] ?? '';
    final child = _children.firstWhere(
      (c) => c['id'] == studentId,
      orElse: () => null,
    );
    final childName = child != null ? '${child['firstName']} ${child['lastName']}' : 'Child';

    return Card(
      margin: const EdgeInsets.symmetric(vertical: 6),
      color: Colors.red[50],
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.red[100]!),
      ),
      child: ListTile(
        leading: const Icon(Icons.smartphone, color: Colors.red),
        title: Text('New Device Approval for $childName', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
        subtitle: Text(
          'Signature: ${device['browserSignature'] ?? 'Unknown device'}',
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontSize: 12),
        ),
        trailing: ElevatedButton(
          onPressed: () => _approveDevice(studentId, device['deviceId']),
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.green,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            minimumSize: Size.zero,
          ),
          child: const Text('Approve', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
        ),
      ),
    );
  }
}

// Simple Promise helper mirroring JavaScript's Promise.all for futures
class Promise {
  static Future<List<T>> all<T>(Iterable<Future<T>> futures) {
    return Future.wait(futures);
  }
}
