import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants.dart';
import '../../../core/theme/app_colors.dart';

class MaterialsScreen extends StatefulWidget {
  const MaterialsScreen({super.key});

  @override
  State<MaterialsScreen> createState() => _MaterialsScreenState();
}

class _MaterialsScreenState extends State<MaterialsScreen> {
  final ApiClient _apiClient = ApiClient();
  List<dynamic> _materials = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  Future<void> _fetch() async {
    setState(() => _isLoading = true);
    try {
      final res = await _apiClient.dio.get(AppConstants.materials, queryParameters: {'limit': 50});
      if (res.statusCode == 200 && mounted) {
        final data = res.data;
        final materials = (data is List) ? data : ((data['materials'] as List?) ?? (data['data'] as List?) ?? []);
        setState(() { _materials = materials; _isLoading = false; });
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
        title: const Text('Learning Materials'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
        actions: [IconButton(icon: const Icon(Icons.refresh_rounded), onPressed: _fetch)],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _materials.isEmpty
              ? Center(child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.menu_book_outlined, size: 72, color: AppColors.primary.withValues(alpha: 0.3)),
                    const SizedBox(height: 16),
                    const Text('No materials yet', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  ],
                ))
              : RefreshIndicator(
                  onRefresh: _fetch,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _materials.length,
                    itemBuilder: (_, i) => _buildCard(_materials[i]),
                  ),
                ),
    );
  }

  Widget _buildCard(dynamic m) {
    final title = m['title'] as String? ?? 'Untitled';
    final type = m['type'] as String? ?? '';
    final category = m['category'] as String? ?? '';
    final fileSize = m['fileSize'];
    final downloads = m['downloadCount'] as int? ?? 0;
    final creator = m['createdByUser'] as Map<String, dynamic>?;
    final creatorName = creator != null ? '${creator['firstName'] ?? ''} ${creator['lastName'] ?? ''}' : '';

    final IconData icon;
    switch (type.toLowerCase()) {
      case 'pdf': icon = Icons.picture_as_pdf_rounded; break;
      case 'video': icon = Icons.video_file_rounded; break;
      case 'image': icon = Icons.image_rounded; break;
      default: icon = Icons.insert_drive_file_rounded;
    }

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
            color: AppColors.primary.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: AppColors.primary),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (category.isNotEmpty)
              Text(category, style: TextStyle(fontSize: 11, color: Colors.grey[500])),
            Row(
              children: [
                if (fileSize != null)
                  Text(_formatSize(fileSize), style: TextStyle(fontSize: 11, color: Colors.grey[500])),
                if (fileSize != null && downloads > 0) const SizedBox(width: 8),
                if (downloads > 0)
                  Text('$downloads downloads', style: TextStyle(fontSize: 11, color: Colors.grey[500])),
              ],
            ),
          ],
        ),
        trailing: creatorName.isNotEmpty
            ? Text(creatorName, style: TextStyle(fontSize: 10, color: Colors.grey[400]))
            : null,
      ),
    );
  }

  String _formatSize(dynamic size) {
    if (size == null) return '';
    final bytes = double.tryParse(size.toString()) ?? 0;
    if (bytes < 1024) return '${bytes.toStringAsFixed(0)} B';
    if (bytes < 1048576) return '${(bytes / 1024).toStringAsFixed(0)} KB';
    return '${(bytes / 1048576).toStringAsFixed(1)} MB';
  }
}
