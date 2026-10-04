import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../services/tutor_service.dart';

class TutorWithdrawalScreen extends StatefulWidget {
  const TutorWithdrawalScreen({super.key});

  @override
  State<TutorWithdrawalScreen> createState() => _TutorWithdrawalScreenState();
}

class _TutorWithdrawalScreenState extends State<TutorWithdrawalScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TutorService _service = TutorService();
  bool _isLoading = true;
  bool _isSubmitting = false;

  Map<String, dynamic> _wallet = {};
  List<dynamic> _withdrawals = [];
  List<dynamic> _transactions = [];

  final _amountController = TextEditingController();
  final _notesController = TextEditingController();
  String _selectedMethod = 'm_pesa';
  bool _showPayoutForm = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _amountController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final results = await Future.wait([
        _service.getWallet(),
        _service.getWithdrawals(),
        _service.getTransactions(),
      ]);
      if (mounted) {
        setState(() {
          _wallet = results[0] as Map<String, dynamic>;
          _withdrawals = results[1] as List<dynamic>;
          _transactions = results[2] as List<dynamic>;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  double _balance(String key) {
    final v = _wallet[key];
    return (v is num) ? v.toDouble() : 0.0;
  }

  Future<void> _submitWithdrawal() async {
    final amount = double.tryParse(_amountController.text);
    if (amount == null || amount < 1000) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Minimum withdrawal is KSh 1,000'), backgroundColor: Colors.red),
      );
      return;
    }
    if (amount > _balance('availableBalance')) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Insufficient balance'), backgroundColor: Colors.red),
      );
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      await _service.createWithdrawal({
        'amount': amount,
        'method': _selectedMethod,
        'notes': _notesController.text,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Withdrawal request submitted'), backgroundColor: Colors.green),
        );
        _amountController.clear();
        _notesController.clear();
        setState(() => _showPayoutForm = false);
        _loadData();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed: ${e.toString()}'), backgroundColor: Colors.red),
        );
      }
    }
    if (mounted) setState(() => _isSubmitting = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Withdraw Earnings'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppColors.primary,
          unselectedLabelColor: Colors.grey,
          indicatorColor: AppColors.primary,
          tabs: [
            Tab(text: 'Withdraw', icon: Icon(Icons.payments_rounded, size: 18)),
            Tab(text: 'History', icon: Icon(Icons.receipt_long_rounded, size: 18)),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _buildWithdrawTab(),
                _buildHistoryTab(),
              ],
            ),
    );
  }

  Widget _buildWithdrawTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          _buildBalanceCard(),
          const SizedBox(height: 20),
          if (_showPayoutForm) _buildWithdrawalForm() else _buildInitiateButton(),
        ],
      ),
    );
  }

  Widget _buildBalanceCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.primary, Color(0xFF1565C0)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.3), blurRadius: 16, offset: const Offset(0, 6))],
      ),
      child: Column(
        children: [
          const Text('Available Balance', style: TextStyle(color: Colors.white70, fontSize: 14)),
          const SizedBox(height: 8),
          Text('KSh ${_balance('availableBalance').toStringAsFixed(0)}',
            style: const TextStyle(color: Colors.white, fontSize: 40, fontWeight: FontWeight.bold)),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _balanceItem('Pending', 'KSh ${_balance('pendingBalance').toStringAsFixed(0)}'),
              _balanceItem('Earned', 'KSh ${_balance('totalEarnings').toStringAsFixed(0)}'),
              _balanceItem('Withdrawn', 'KSh ${_balance('totalWithdrawn').toStringAsFixed(0)}'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _balanceItem(String label, String value) {
    return Column(
      children: [
        Text(value, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(color: Colors.white60, fontSize: 12)),
      ],
    );
  }

  Widget _buildInitiateButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        onPressed: () => setState(() => _showPayoutForm = true),
        icon: const Icon(Icons.payments_rounded),
        label: const Text('Request Withdrawal'),
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }

  Widget _buildWithdrawalForm() {
    final hasMpesa = _wallet['mpesaDetails'] != null;
    final hasBank = _wallet['bankDetails'] != null;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 12, offset: const Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.account_balance_wallet_rounded, color: AppColors.primary),
              const SizedBox(width: 8),
              const Text('Withdrawal Details', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 20),

          if (!hasMpesa && !hasBank) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.orange.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                  Icon(Icons.warning_amber_rounded, color: Colors.orange[700], size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text('Set your payout details in Wallet Settings to withdraw.',
                      style: TextStyle(color: Colors.orange[800], fontSize: 12)),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
          ],

          TextField(
            controller: _amountController,
            keyboardType: TextInputType.number,
            decoration: InputDecoration(
              labelText: 'Amount (KSh)',
              hintText: 'Minimum KSh 1,000',
              prefixText: 'KSh ',
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
          const SizedBox(height: 16),

          InputDecorator(
            decoration: InputDecoration(
              labelText: 'Payout Method',
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: _selectedMethod,
                isDense: true,
                isExpanded: true,
                items: const [
                  DropdownMenuItem(value: 'm_pesa', child: Text('M-Pesa')),
                  DropdownMenuItem(value: 'bank_transfer', child: Text('Bank Transfer')),
                ],
                onChanged: (v) => setState(() => _selectedMethod = v!),
              ),
            ),
          ),
          const SizedBox(height: 16),

          if (_selectedMethod == 'm_pesa' && hasMpesa)
            _payoutInfo('M-Pesa', _wallet['mpesaDetails']),
          if (_selectedMethod == 'bank_transfer' && hasBank)
            _payoutInfo('Bank', _wallet['bankDetails']),

          TextField(
            controller: _notesController,
            maxLines: 2,
            decoration: InputDecoration(
              labelText: 'Notes (optional)',
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
          const SizedBox(height: 20),

          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => setState(() => _showPayoutForm = false),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Cancel'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: ElevatedButton.icon(
                  onPressed: _isSubmitting ? null : _submitWithdrawal,
                  icon: _isSubmitting
                      ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Icon(Icons.send_rounded, size: 18),
                  label: Text(_isSubmitting ? 'Submitting...' : 'Submit Request'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _payoutInfo(String label, dynamic details) {
    if (details == null) return const SizedBox.shrink();
    final map = details as Map<String, dynamic>;
    final lines = map.entries.map((e) => '${e.key}: ${e.value}').join('\n');
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('$label Details', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary, fontSize: 13)),
          const SizedBox(height: 4),
          Text(lines, style: TextStyle(fontSize: 12, color: Colors.grey[700])),
        ],
      ),
    );
  }

  Widget _buildHistoryTab() {
    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (_withdrawals.isEmpty && _transactions.isEmpty)
            Center(
              child: Padding(
                padding: const EdgeInsets.only(top: 80),
                child: Column(
                  children: [
                    Icon(Icons.receipt_long_rounded, size: 64, color: Colors.grey[300]),
                    const SizedBox(height: 16),
                    Text('No activity yet', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.grey[500])),
                  ],
                ),
              ),
            )
          else ...[
            if (_withdrawals.isNotEmpty) ...[
              _sectionTitle('Withdrawal Requests'),
              const SizedBox(height: 8),
              ..._withdrawals.map((w) => _buildWithdrawalCard(w)),
              const SizedBox(height: 24),
            ],
            if (_transactions.isNotEmpty) ...[
              _sectionTitle('Transaction History'),
              const SizedBox(height: 8),
              ..._transactions.map((t) => _buildTransactionCard(t)),
            ],
          ],
        ],
      ),
    );
  }

  Widget _buildWithdrawalCard(dynamic w) {
    final amount = (w['amount'] is num) ? (w['amount'] as num).toDouble() : 0.0;
    final status = w['status'] as String? ?? 'pending';
    final method = (w['method'] as String? ?? '').replaceAll('_', ' ').toUpperCase();
    final createdAt = DateTime.tryParse(w['createdAt'] as String? ?? '');
    final dateStr = createdAt != null ? DateFormat('MMM d, yyyy · h:mm a').format(createdAt) : '';

    Color statusColor;
    switch (status) {
      case 'completed': statusColor = Colors.green;
      case 'processing': statusColor = Colors.blue;
      case 'rejected':
      case 'failed': statusColor = Colors.red;
      default: statusColor = Colors.orange;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(Icons.payments_rounded, color: statusColor, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('KSh ${amount.toStringAsFixed(0)} via $method',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                Text(dateStr, style: TextStyle(fontSize: 11, color: Colors.grey[500])),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(status[0].toUpperCase() + status.substring(1),
              style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: statusColor)),
          ),
        ],
      ),
    );
  }

  Widget _buildTransactionCard(dynamic t) {
    final amount = (t['amount'] is num) ? (t['amount'] as num).toDouble() : 0.0;
    final type = t['type'] as String? ?? '';
    final status = t['status'] as String? ?? '';
    final desc = t['description'] as String? ?? '';
    final createdAt = DateTime.tryParse(t['createdAt'] as String? ?? '');
    final dateStr = createdAt != null ? DateFormat('MMM d, yyyy').format(createdAt) : '';

    final isCredit = amount > 0;
    final color = isCredit ? Colors.green : Colors.red;

    String icon;
    switch (type) {
      case 'sale_earning': icon = '💰'; break;
      case 'withdrawal': icon = '💸'; break;
      case 'platform_commission': icon = '📊'; break;
      case 'adjustment': icon = '⚙️'; break;
      default: icon = '💳';
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Text(icon, style: const TextStyle(fontSize: 20)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(desc, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
                Text('$dateStr · ${type.replaceAll('_', ' ')}',
                  style: TextStyle(fontSize: 10, color: Colors.grey[500])),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('${isCredit ? '+' : ''}KSh ${amount.abs().toStringAsFixed(0)}',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: color)),
              if (status == 'pending')
                Text('Pending', style: TextStyle(fontSize: 10, color: Colors.orange[600])),
            ],
          ),
        ],
      ),
    );
  }

  Widget _sectionTitle(String title) {
    return Row(
      children: [
        Icon(Icons.circle_rounded, size: 8, color: AppColors.primary),
        const SizedBox(width: 8),
        Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
      ],
    );
  }
}
