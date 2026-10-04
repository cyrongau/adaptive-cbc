import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../services/tutor_service.dart';

class TutorEarningsScreen extends StatefulWidget {
  const TutorEarningsScreen({super.key});

  @override
  State<TutorEarningsScreen> createState() => _TutorEarningsScreenState();
}

class _TutorEarningsScreenState extends State<TutorEarningsScreen> {
  final TutorService _service = TutorService();
  bool _isLoading = true;

  Map<String, dynamic> _stats = {};
  List<dynamic> _completedSessions = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final results = await Future.wait([
        _service.getStats(),
        _service.getSessions(status: 'completed'),
      ]);
      if (mounted) {
        setState(() {
          _stats = results[0] as Map<String, dynamic>;
          _completedSessions = results[1] as List<dynamic>;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  double _getStat(String key) {
    final v = _stats[key];
    return (v is num) ? v.toDouble() : 0.0;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Earnings'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  _buildSummaryCards(),
                  const SizedBox(height: 24),
                  _buildBreakdown(),
                  const SizedBox(height: 24),
                  _buildTransactionHistory(),
                  const SizedBox(height: 24),
                  _buildWithdrawButton(),
                ],
              ),
            ),
    );
  }

  Widget _buildSummaryCards() {
    return Column(
      children: [
        // Main earnings card
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 24),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [AppColors.primary, Color(0xFF1565C0)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(color: AppColors.primary.withValues(alpha: 0.3), blurRadius: 16, offset: const Offset(0, 6)),
            ],
          ),
          child: Column(
            children: [
              const Text('Total Earnings', style: TextStyle(color: Colors.white70, fontSize: 14)),
              const SizedBox(height: 8),
              Text('KSh ${_getStat('totalEarnings').toStringAsFixed(0)}',
                style: const TextStyle(color: Colors.white, fontSize: 40, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _miniStat('This Month', 'KSh ${_getStat('earningsThisMonth').toStringAsFixed(0)}'),
                  const SizedBox(width: 40),
                  _miniStat('Pending', 'KSh ${_getStat('pendingEarnings').toStringAsFixed(0)}'),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            _statCard(Icons.school_rounded, 'Sessions', '${_getStat('totalSessions').toInt()}', Colors.blue),
            const SizedBox(width: 12),
            _statCard(Icons.people_rounded, 'Students', '${_getStat('totalStudents').toInt()}', Colors.green),
            const SizedBox(width: 12),
            _statCard(Icons.star_rounded, 'Rating', _getStat('averageRating').toStringAsFixed(1), Colors.orange),
          ],
        ),
      ],
    );
  }

  Widget _miniStat(String label, String value) {
    return Column(
      children: [
        Text(value, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(color: Colors.white60, fontSize: 12)),
      ],
    );
  }

  Widget _statCard(IconData icon, String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2))],
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 22),
            const SizedBox(height: 6),
            Text(value, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: color)),
            const SizedBox(height: 2),
            Text(label, style: TextStyle(fontSize: 11, color: Colors.grey[600])),
          ],
        ),
      ),
    );
  }

  Widget _buildBreakdown() {
    final total = _getStat('totalEarnings');
    final thisMonth = _getStat('earningsThisMonth');
    final pending = _getStat('pendingEarnings');
    final paid = total - pending;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionTitle('Earnings Breakdown', Icons.pie_chart_rounded),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2))],
          ),
          child: Column(
            children: [
              _breakdownRow('Paid', paid, total, Colors.green),
              const SizedBox(height: 10),
              _breakdownRow('Pending', pending, total, Colors.orange),
              const SizedBox(height: 10),
              _breakdownRow('This Month', thisMonth, total, Colors.blue),
              const Divider(height: 20),
              _breakdownRow('Total', total, total, AppColors.primary),
            ],
          ),
        ),
      ],
    );
  }

  Widget _breakdownRow(String label, double amount, double total, Color color) {
    final fraction = total > 0 ? amount / total : 0.0;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: TextStyle(fontSize: 13, color: Colors.grey[700])),
            Text('KSh ${amount.toStringAsFixed(0)}',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: color)),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: fraction,
            backgroundColor: Colors.grey[200],
            valueColor: AlwaysStoppedAnimation<Color>(color),
            minHeight: 6,
          ),
        ),
      ],
    );
  }

  Widget _buildTransactionHistory() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionTitle('Transaction History', Icons.receipt_long_rounded),
        const SizedBox(height: 12),
        if (_completedSessions.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              children: [
                Icon(Icons.receipt_long_rounded, size: 48, color: Colors.grey[300]),
                const SizedBox(height: 12),
                Text('No transactions yet',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.grey[500])),
                Text('Completed sessions with payments will appear here.',
                  style: TextStyle(fontSize: 12, color: Colors.grey[400])),
              ],
            ),
          )
        else
          ..._completedSessions.map((s) => _buildTransactionCard(s)),
      ],
    );
  }

  Widget _buildTransactionCard(dynamic session) {
    final student = session['student'] as Map<String, dynamic>? ?? {};
    final studentName = '${student['firstName'] ?? ''} ${student['lastName'] ?? ''}'.trim();
    final subject = session['subjectName'] as String? ?? 'General';
    final price = (session['price'] is num) ? (session['price'] as num).toDouble() : 0.0;
    final paymentStatus = session['paymentStatus'] as String? ?? 'pending';
    final createdAt = session['createdAt'] as String? ?? '';
    final date = DateTime.tryParse(createdAt);
    final dateStr = date != null ? DateFormat('MMM d, yyyy').format(date) : '';
    final timeStr = date != null ? DateFormat('h:mm a').format(date) : '';

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 20,
            backgroundColor: AppColors.primary.withValues(alpha: 0.1),
            child: Text(studentName.isNotEmpty ? studentName[0].toUpperCase() : '?',
              style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(studentName.isNotEmpty ? studentName : 'Student',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                Text(subject, style: TextStyle(fontSize: 11, color: Colors.grey[600])),
                const SizedBox(height: 2),
                Text('$dateStr · $timeStr',
                  style: TextStyle(fontSize: 10, color: Colors.grey[400])),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('KSh ${price.toStringAsFixed(0)}',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppColors.primary)),
              const SizedBox(height: 2),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: paymentStatus == 'paid' ? Colors.green.withValues(alpha: 0.1) : Colors.orange.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(paymentStatus == 'paid' ? 'Paid' : 'Pending',
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold,
                    color: paymentStatus == 'paid' ? Colors.green : Colors.orange)),
              ),
            ],
          ),
        ],
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

  Widget _buildWithdrawButton() {
    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: () => context.push('/tutor/earnings/withdraw'),
            icon: const Icon(Icons.payments_rounded),
            label: const Text('Withdraw Earnings'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            onPressed: () => context.push('/tutor/earnings/wallet-settings'),
            icon: const Icon(Icons.settings_rounded),
            label: const Text('Wallet Settings'),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.primary,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
          ),
        ),
      ],
    );
  }
}
