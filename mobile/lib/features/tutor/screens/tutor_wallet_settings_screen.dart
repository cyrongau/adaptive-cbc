import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../services/tutor_service.dart';

class TutorWalletSettingsScreen extends StatefulWidget {
  const TutorWalletSettingsScreen({super.key});

  @override
  State<TutorWalletSettingsScreen> createState() => _TutorWalletSettingsScreenState();
}

class _TutorWalletSettingsScreenState extends State<TutorWalletSettingsScreen> {
  final TutorService _service = TutorService();
  bool _isLoading = true;
  bool _isSaving = false;

  String _payoutMethod = 'mobile_money';
  final _mobileProviderController = TextEditingController(text: 'Safaricom');
  final _mobileNumberController = TextEditingController();
  final _bankNameController = TextEditingController();
  final _bankAccountController = TextEditingController();
  final _bankBranchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _mobileProviderController.dispose();
    _mobileNumberController.dispose();
    _bankNameController.dispose();
    _bankAccountController.dispose();
    _bankBranchController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final wallet = await _service.getWallet();
      if (mounted) {
        final details = wallet['details'] as Map<String, dynamic>? ?? wallet;
        setState(() {
          _payoutMethod = details['payoutMethod'] as String? ?? 'mobile_money';
          _mobileProviderController.text = details['mobileProvider'] as String? ?? 'Safaricom';
          _mobileNumberController.text = details['mobileNumber'] as String? ?? '';
          _bankNameController.text = details['bankName'] as String? ?? '';
          _bankAccountController.text = details['bankAccount'] as String? ?? '';
          _bankBranchController.text = details['bankBranch'] as String? ?? '';
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _save() async {
    setState(() => _isSaving = true);
    try {
      await _service.updateWalletDetails({
        'payoutMethod': _payoutMethod,
        'mobileProvider': _mobileProviderController.text,
        'mobileNumber': _mobileNumberController.text,
        'bankName': _bankNameController.text,
        'bankAccount': _bankAccountController.text,
        'bankBranch': _bankBranchController.text,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Payout details saved'), backgroundColor: Colors.green),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to save: ${e.toString()}'), backgroundColor: Colors.red),
        );
      }
    }
    if (mounted) setState(() => _isSaving = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Wallet Settings'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
        actions: [
          TextButton.icon(
            onPressed: _isSaving ? null : _save,
            icon: _isSaving
                ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                : const Icon(Icons.save_rounded),
            label: const Text('Save'),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [AppColors.primary, AppColors.primary.withValues(alpha: 0.8)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Payout Method', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 8),
                        Text('Choose how you receive your earnings', style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontSize: 12)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  const Text('Payment Method', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 12),
                  _methodSelector(
                    'Mobile Money (M-Pesa)',
                    Icons.phone_android_rounded,
                    _payoutMethod == 'mobile_money',
                    () => setState(() => _payoutMethod = 'mobile_money'),
                  ),
                  if (_payoutMethod == 'mobile_money') ...[
                    const SizedBox(height: 12),
                    _buildField(_mobileProviderController, 'Mobile Provider', 'e.g. Safaricom'),
                    const SizedBox(height: 12),
                    _buildField(_mobileNumberController, 'Mobile Number', 'e.g. 0712345678', keyboardType: TextInputType.phone),
                  ],
                  const SizedBox(height: 12),
                  _methodSelector(
                    'Bank Transfer',
                    Icons.account_balance_rounded,
                    _payoutMethod == 'bank',
                    () => setState(() => _payoutMethod = 'bank'),
                  ),
                  if (_payoutMethod == 'bank') ...[
                    const SizedBox(height: 12),
                    _buildField(_bankNameController, 'Bank Name', 'e.g. Equity Bank'),
                    const SizedBox(height: 12),
                    _buildField(_bankAccountController, 'Account Number', 'e.g. 1234567890'),
                    const SizedBox(height: 12),
                    _buildField(_bankBranchController, 'Branch', 'e.g. Nairobi Branch'),
                  ],
                  const SizedBox(height: 32),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _isSaving ? null : _save,
                      icon: _isSaving
                          ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Icon(Icons.save_rounded),
                      label: Text(_isSaving ? 'Saving...' : 'Save Payout Details'),
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
            ),
    );
  }

  Widget _methodSelector(String label, IconData icon, bool selected, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: selected ? AppColors.primary : Colors.grey[200]!, width: selected ? 2 : 1),
        ),
        child: Row(
          children: [
            Icon(icon, color: selected ? AppColors.primary : Colors.grey[400], size: 24),
            const SizedBox(width: 12),
            Expanded(child: Text(label, style: TextStyle(fontWeight: selected ? FontWeight.bold : FontWeight.normal, fontSize: 14))),
            if (selected) Icon(Icons.check_circle_rounded, color: AppColors.primary, size: 22),
          ],
        ),
      ),
    );
  }

  Widget _buildField(TextEditingController controller, String label, String hint, {TextInputType? keyboardType}) {
    return TextField(
      controller: controller,
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
}
