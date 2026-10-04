import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants.dart';
import '../../../core/theme/app_colors.dart';

class LibraryScreen extends StatefulWidget {
  const LibraryScreen({super.key});

  @override
  State<LibraryScreen> createState() => _LibraryScreenState();
}

class _LibraryScreenState extends State<LibraryScreen> {
  final ApiClient _apiClient = ApiClient();
  List<dynamic> _papers = [];
  bool _isLoading = true;
  String _section = 'featured';

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  Future<void> _fetch() async {
    setState(() => _isLoading = true);
    try {
      final uri = '${AppConstants.libraryPapers}/$_section';
      final res = await _apiClient.dio.get(uri, queryParameters: {'limit': 20});
      if (res.statusCode == 200 && mounted) {
        final data = res.data;
        final papers = (data is List) ? data : ((data['papers'] as List?) ?? (data['data'] as List?) ?? []);
        setState(() { _papers = papers; _isLoading = false; });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Digital Library'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
        actions: [IconButton(icon: const Icon(Icons.refresh_rounded), onPressed: _fetch)],
      ),
      body: Column(
        children: [
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
            child: Row(
              children: ['featured', 'recent', 'popular'].map((s) {
                final active = _section == s;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(s[0].toUpperCase() + s.substring(1),
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600,
                        color: active ? Colors.white : AppColors.onSurfaceVariant)),
                    selected: active,
                    selectedColor: AppColors.primary,
                    backgroundColor: Colors.grey[100],
                    onSelected: (_) => setState(() { _section = s; _fetch(); }),
                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    visualDensity: VisualDensity.compact,
                  ),
                );
              }).toList(),
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _papers.isEmpty
                    ? Center(child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.library_books_outlined, size: 72, color: AppColors.primary.withValues(alpha: 0.3)),
                          const SizedBox(height: 16),
                          const Text('No papers yet', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                        ],
                      ))
                    : RefreshIndicator(
                        onRefresh: _fetch,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _papers.length,
                          itemBuilder: (_, i) => _buildCard(_papers[i]),
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildCard(dynamic p) {
    final title = p['title'] as String? ?? 'Untitled';
    final paperType = p['paperType'] as String? ?? '';
    final year = p['year'];
    final term = p['term'];
    final downloads = p['downloadCount'] as int? ?? 0;
    final isPremium = p['isPremium'] == true;

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      elevation: 0,
      color: Colors.white,
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: Container(
          width: 44, height: 44,
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(Icons.picture_as_pdf_rounded, color: AppColors.primary),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
        subtitle: Row(
          children: [
            if (paperType.isNotEmpty)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(color: Colors.grey[100], borderRadius: BorderRadius.circular(4)),
                child: Text(paperType.replaceAll('_', ' '), style: TextStyle(fontSize: 9, color: Colors.grey[600])),
              ),
            if (year != null) ...[const SizedBox(width: 6), Text('$year', style: TextStyle(fontSize: 11, color: Colors.grey[500]))],
            if (term != null) ...[const SizedBox(width: 6), Text('Term $term', style: TextStyle(fontSize: 11, color: Colors.grey[500]))],
            if (downloads > 0) ...[const SizedBox(width: 6), Icon(Icons.download_rounded, size: 12, color: Colors.grey[400]), Text('$downloads', style: TextStyle(fontSize: 11, color: Colors.grey[500]))],
          ],
        ),
        trailing: isPremium
            ? Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(color: Colors.amber.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(6)),
                child: const Text('Premium', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.amber)),
              )
            : const Icon(Icons.chevron_right_rounded, color: Colors.grey),
      ),
    );
  }
}
