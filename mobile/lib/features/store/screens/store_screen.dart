import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants.dart';
import '../../../core/theme/app_colors.dart';
import 'package:cached_network_image/cached_network_image.dart';

class StoreScreen extends StatefulWidget {
  const StoreScreen({super.key});

  @override
  State<StoreScreen> createState() => _StoreScreenState();
}

class _StoreScreenState extends State<StoreScreen> {
  final ApiClient _apiClient = ApiClient();
  final TextEditingController _searchController = TextEditingController();

  List<dynamic> _allProducts = [];
  List<dynamic> _filteredProducts = [];
  bool _isLoading = true;

  String? _selectedCategory;
  String _searchQuery = '';
  String _sortBy = 'newest';

  // Cart state (basic in-memory cart)
  final Map<String, int> _cart = {};
  int _cartTotal = 0;

  List<String> get _categories {
    final cats = _allProducts
        .map((p) => p['category'] as String? ?? '')
        .where((c) => c.isNotEmpty)
        .toSet()
        .toList();
    cats.sort();
    return cats;
  }

  List<dynamic> get _featuredProducts =>
      _allProducts.where((p) => p['isFeatured'] == true || (p['rating'] is num && (p['rating'] as num) >= 4.0)).toList();

  @override
  void initState() {
    super.initState();
    _fetch();
    _searchController.addListener(() {
      setState(() => _searchQuery = _searchController.text.trim().toLowerCase());
      _applyFilters();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _fetch() async {
    setState(() => _isLoading = true);
    try {
      final res = await _apiClient.dio.get(AppConstants.storeProducts, queryParameters: {'limit': 100});
      if (res.statusCode == 200 && mounted) {
        final data = res.data;
        final products = (data is List) ? data : ((data['products'] as List?) ?? (data['data'] as List?) ?? []);
        setState(() {
          _allProducts = products;
          _isLoading = false;
        });
        _applyFilters();
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _applyFilters() {
    var filtered = List<dynamic>.from(_allProducts);

    if (_selectedCategory != null) {
      filtered = filtered.where((p) => (p['category'] as String? ?? '') == _selectedCategory).toList();
    }

    if (_searchQuery.isNotEmpty) {
      filtered = filtered.where((p) {
        final title = (p['title'] as String? ?? '').toLowerCase();
        final desc = (p['description'] as String? ?? '').toLowerCase();
        final tags = (p['tags'] as List? ?? []).map((t) => t.toString().toLowerCase());
        return title.contains(_searchQuery) || desc.contains(_searchQuery) || tags.any((t) => t.contains(_searchQuery));
      }).toList();
    }

    switch (_sortBy) {
      case 'price_low':
        filtered.sort((a, b) => ((a['price'] is num) ? (a['price'] as num).toDouble() : 0)
            .compareTo((b['price'] is num) ? (b['price'] as num).toDouble() : 0));
        break;
      case 'price_high':
        filtered.sort((a, b) => ((b['price'] is num) ? (b['price'] as num).toDouble() : 0)
            .compareTo((a['price'] is num) ? (a['price'] as num).toDouble() : 0));
        break;
      case 'rating':
        filtered.sort((a, b) => ((b['rating'] is num) ? (b['rating'] as num).toDouble() : 0)
            .compareTo((a['rating'] is num) ? (a['rating'] as num).toDouble() : 0));
        break;
      case 'popular':
        filtered.sort((a, b) => ((b['salesCount'] as int? ?? 0)).compareTo((a['salesCount'] as int? ?? 0)));
        break;
      default:
        filtered.sort((a, b) {
          final aCreated = a['createdAt'] as String? ?? '';
          final bCreated = b['createdAt'] as String? ?? '';
          return bCreated.compareTo(aCreated);
        });
    }

    setState(() => _filteredProducts = filtered);
  }

  void _addToCart(dynamic product) {
    final id = product['id']?.toString() ?? '';
    setState(() {
      _cart[id] = (_cart[id] ?? 0) + 1;
      _cartTotal = _cart.values.fold(0, (sum, qty) => sum + qty);
    });
    HapticFeedback.lightImpact();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${product['title'] ?? 'Product'} added to cart'),
        duration: const Duration(seconds: 1),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _showProductDetail(dynamic product) {
    final title = product['title'] as String? ?? 'Product';
    final description = product['description'] as String? ?? '';
    final price = (product['price'] is num) ? (product['price'] as num).toDouble() : 0.0;
    final originalPrice = (product['originalPrice'] is num) ? (product['originalPrice'] as num).toDouble() : null;
    final thumbnail = _getThumbnail(product);
    final images = product['images'] as List? ?? [];
    final category = product['category'] as String? ?? '';
    final rating = (product['rating'] is num) ? (product['rating'] as num).toDouble() : null;
    final sales = product['salesCount'] as int? ?? 0;
    final stock = product['stock'] as int? ?? 0;
    final tags = product['tags'] as List? ?? [];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        height: MediaQuery.of(ctx).size.height * 0.85,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          children: [
            Container(
              margin: const EdgeInsets.only(top: 12),
              width: 40, height: 4,
              decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2)),
            ),
            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Image area
                    SizedBox(
                      height: 280,
                      width: double.infinity,
                      child: images.isNotEmpty || thumbnail.isNotEmpty
                          ? PageView.builder(
                              itemCount: images.isNotEmpty ? images.length : 1,
                              itemBuilder: (_, i) {
                                final url = images.isNotEmpty ? images[i] as String? : thumbnail;
                                return _productImage(url, fit: BoxFit.cover);
                              },
                            )
                          : Container(
                              color: Colors.grey[100],
                              child: Center(child: Icon(Icons.image_outlined, size: 80, color: Colors.grey[300])),
                            ),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: Text(title, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                              ),
                              if (stock > 0)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.green.withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text('In Stock', style: TextStyle(fontSize: 11, color: Colors.green[700], fontWeight: FontWeight.bold)),
                                )
                              else
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.red.withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text('Out of Stock', style: TextStyle(fontSize: 11, color: Colors.red[700], fontWeight: FontWeight.bold)),
                                ),
                            ],
                          ),
                          if (category.isNotEmpty) ...[
                            const SizedBox(height: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppColors.primary.withValues(alpha: 0.08),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(category.replaceAll('_', ' ').toUpperCase(),
                                style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primary)),
                            ),
                          ],
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Text(price > 0 ? 'KSh ${price.toStringAsFixed(price == price.roundToDouble() ? 0 : 2)}' : 'Free',
                                style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: AppColors.primary)),
                              if (originalPrice != null && originalPrice > price) ...[
                                const SizedBox(width: 8),
                                Text('KSh ${originalPrice.toStringAsFixed(0)}',
                                  style: TextStyle(fontSize: 16, color: Colors.grey[400], decoration: TextDecoration.lineThrough)),
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: Colors.red.withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text('-${((1 - price / originalPrice) * 100).round()}%',
                                    style: TextStyle(fontSize: 11, color: Colors.red[700], fontWeight: FontWeight.bold)),
                                ),
                              ],
                            ],
                          ),
                          if (rating != null || sales > 0) ...[
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                if (rating != null) ...[
                                  Icon(Icons.star_rounded, size: 18, color: Colors.amber[600]),
                                  Text(' $rating', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.amber[700])),
                                  const SizedBox(width: 12),
                                ],
                                if (sales > 0)
                                  Text('$sales sold', style: TextStyle(fontSize: 12, color: Colors.grey[500])),
                              ],
                            ),
                          ],
                          if (tags.isNotEmpty) ...[
                            const SizedBox(height: 12),
                            Wrap(
                              spacing: 6, runSpacing: 4,
                              children: tags.map<Widget>((t) => Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: Colors.grey[100],
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(t.toString(), style: TextStyle(fontSize: 11, color: Colors.grey[600])),
                              )).toList(),
                            ),
                          ],
                          const SizedBox(height: 16),
                          const Text('Description', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 8),
                          Text(description.isNotEmpty ? description : 'No description available.',
                            style: TextStyle(fontSize: 14, color: Colors.grey[700], height: 1.5)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Container(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, -2))],
              ),
              child: SafeArea(
                child: SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton.icon(
                    onPressed: stock > 0 ? () { _addToCart(product); Navigator.pop(ctx); } : null,
                    icon: const Icon(Icons.shopping_cart_outlined),
                    label: Text(stock > 0 ? 'Add to Cart - KSh ${price.toStringAsFixed(price == price.roundToDouble() ? 0 : 2)}' : 'Out of Stock'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _resolveImageUrl(String? url) {
    if (url == null || url.isEmpty) return '';
    final trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      if (trimmed.contains('localhost') || trimmed.contains('minio') || trimmed.contains('0.0.0.0')) {
        final path = trimmed.replaceFirst(RegExp(r'^https?://[^/]+'), '');
        return '${AppConstants.baseHttpUrl}$path';
      }
      return trimmed;
    }
    return '${AppConstants.baseHttpUrl}$trimmed';
  }

  String _getThumbnail(dynamic product) {
    final thumb = product['thumbnailUrl'] as String?;
    if (thumb != null && thumb.isNotEmpty) return thumb;
    final images = product['images'] as List?;
    if (images != null && images.isNotEmpty) {
      final first = images[0] as String?;
      if (first != null && first.isNotEmpty) return first;
    }
    final alt = product['imageUrl'] as String? ?? product['image'] as String?;
    return alt ?? '';
  }

  Widget _productImage(String? url, {BoxFit fit = BoxFit.cover}) {
    final resolved = _resolveImageUrl(url);
    if (resolved.isEmpty) {
      return Container(color: Colors.grey[100], child: Center(child: Icon(Icons.image_outlined, size: 48, color: Colors.grey[300])));
    }
    return ClipRRect(
      borderRadius: BorderRadius.circular(0),
      child: CachedNetworkImage(
        imageUrl: resolved,
        fit: fit,
        placeholder: (_, __) => Container(color: Colors.grey[100], child: const Center(child: CircularProgressIndicator(strokeWidth: 2))),
        errorWidget: (_, __, ___) => Container(color: Colors.grey[100], child: Icon(Icons.broken_image, color: Colors.grey[300])),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Reward Store'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
        actions: [
          if (_cartTotal > 0)
            Stack(
              clipBehavior: Clip.none,
              children: [
                IconButton(icon: const Icon(Icons.shopping_cart_rounded), onPressed: _showCart),
                Positioned(
                  right: 4, top: 4,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                    child: Text('$_cartTotal', style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            )
          else
            IconButton(icon: const Icon(Icons.shopping_cart_outlined), onPressed: _showCart),
          IconButton(icon: const Icon(Icons.refresh_rounded), onPressed: _fetch),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _allProducts.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.storefront_outlined, size: 80, color: AppColors.primary.withValues(alpha: 0.3)),
                      const SizedBox(height: 16),
                      const Text('No products yet', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      Text('Products will appear here once added to the store.',
                        style: TextStyle(color: AppColors.onSurfaceVariant)),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _fetch,
                  child: CustomScrollView(
                    slivers: [
                      // Search bar
                      SliverToBoxAdapter(child: _buildSearchBar()),
                      // Categories
                      if (_categories.isNotEmpty)
                        SliverToBoxAdapter(child: _buildCategoryChips()),
                      // Sort bar
                      SliverToBoxAdapter(child: _buildSortBar()),
                      // Featured products
                      if (_featuredProducts.isNotEmpty && _selectedCategory == null && _searchQuery.isEmpty)
                        SliverToBoxAdapter(child: _buildFeaturedSection()),
                      // Product count
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                          child: Text('${_filteredProducts.length} products',
                            style: TextStyle(fontSize: 13, color: Colors.grey[500])),
                        ),
                      ),
                      // Product grid
                      _filteredProducts.isEmpty
                          ? SliverToBoxAdapter(
                              child: SizedBox(
                                height: 200,
                                child: Center(
                                  child: Text('No products match your search.',
                                    style: TextStyle(color: Colors.grey[500])),
                                ),
                              ),
                            )
                          : SliverPadding(
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              sliver: SliverGrid(
                                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                  crossAxisCount: 2,
                                  childAspectRatio: 0.58,
                                  crossAxisSpacing: 12,
                                  mainAxisSpacing: 12,
                                ),
                                delegate: SliverChildBuilderDelegate(
                                  (context, index) => _buildGridCard(_filteredProducts[index]),
                                  childCount: _filteredProducts.length,
                                ),
                              ),
                            ),
                      const SliverToBoxAdapter(child: SizedBox(height: 24)),
                    ],
                  ),
                ),
    );
  }

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      child: TextField(
        controller: _searchController,
        decoration: InputDecoration(
          hintText: 'Search products...',
          prefixIcon: Icon(Icons.search_rounded, color: Colors.grey[400]),
          suffixIcon: _searchQuery.isNotEmpty
              ? IconButton(icon: const Icon(Icons.clear_rounded, size: 18), onPressed: () { _searchController.clear(); })
              : null,
          filled: true,
          fillColor: Colors.white,
          contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 16),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: BorderSide(color: Colors.grey[200]!),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: BorderSide(color: Colors.grey[200]!),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: BorderSide(color: AppColors.primary),
          ),
        ),
      ),
    );
  }

  Widget _buildCategoryChips() {
    return SizedBox(
      height: 44,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        children: [
          _categoryChip(null, 'All'),
          ..._categories.map((c) => _categoryChip(c, c.replaceAll('_', ' ').toUpperCase())),
        ],
      ),
    );
  }

  Widget _categoryChip(String? value, String label) {
    final isSelected = _selectedCategory == value;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Text(label, style: TextStyle(
          fontSize: 12, fontWeight: FontWeight.w600,
          color: isSelected ? Colors.white : Colors.grey[700],
        )),
        selected: isSelected,
        onSelected: (_) {
          setState(() => _selectedCategory = value);
          _applyFilters();
        },
        backgroundColor: Colors.white,
        selectedColor: AppColors.primary,
        checkmarkColor: Colors.white,
        side: BorderSide(color: isSelected ? AppColors.primary : Colors.grey[200]!),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        padding: const EdgeInsets.symmetric(horizontal: 4),
      ),
    );
  }

  Widget _buildSortBar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Row(
        children: [
          Icon(Icons.sort_rounded, size: 16, color: Colors.grey[500]),
          const SizedBox(width: 6),
          Text('Sort:', style: TextStyle(fontSize: 12, color: Colors.grey[500])),
          const SizedBox(width: 8),
          DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: _sortBy,
              isDense: true,
              style: TextStyle(fontSize: 12, color: AppColors.primary, fontWeight: FontWeight.w600),
              items: const [
                DropdownMenuItem(value: 'newest', child: Text('Newest')),
                DropdownMenuItem(value: 'price_low', child: Text('Price: Low to High')),
                DropdownMenuItem(value: 'price_high', child: Text('Price: High to Low')),
                DropdownMenuItem(value: 'rating', child: Text('Top Rated')),
                DropdownMenuItem(value: 'popular', child: Text('Most Popular')),
              ],
              onChanged: (v) {
                if (v != null) { setState(() => _sortBy = v); _applyFilters(); }
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFeaturedSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: Row(
            children: [
              Icon(Icons.star_rounded, size: 18, color: Colors.amber[600]),
              const SizedBox(width: 6),
              const Text('Featured Products', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ],
          ),
        ),
        SizedBox(
          height: 220,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            itemCount: _featuredProducts.length,
            itemBuilder: (_, i) {
              final p = _featuredProducts[i];
              final title = p['title'] as String? ?? '';
              final price = (p['price'] is num) ? (p['price'] as num).toDouble() : 0.0;
              final thumbnail = _getThumbnail(p);
              final rating = (p['rating'] is num) ? (p['rating'] as num).toDouble() : null;

              return GestureDetector(
                onTap: () => _showProductDetail(p),
                child: Container(
                  width: 160,
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2))],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      ClipRRect(
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                        child: SizedBox(
                          height: 120, width: double.infinity,
                          child: _productImage(thumbnail),
                        ),
                      ),
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.all(10),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(title, maxLines: 2, overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                              if (rating != null) ...[
                                const SizedBox(height: 2),
                                Row(
                                  children: [
                                    Icon(Icons.star_rounded, size: 14, color: Colors.amber[600]),
                                    const SizedBox(width: 2),
                                    Text('$rating', style: TextStyle(fontSize: 11, color: Colors.amber[700])),
                                  ],
                                ),
                              ],
                              const Spacer(),
                              Text('KSh ${price.toStringAsFixed(0)}',
                                style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.primary)),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildGridCard(dynamic p) {
    final title = p['title'] as String? ?? '';
    final price = (p['price'] is num) ? (p['price'] as num).toDouble() : 0.0;
    final originalPrice = (p['originalPrice'] is num) ? (p['originalPrice'] as num).toDouble() : null;
    final thumbnail = _getThumbnail(p);
    final category = p['category'] as String? ?? '';
    final rating = (p['rating'] is num) ? (p['rating'] as num).toDouble() : null;
    final sales = p['salesCount'] as int? ?? 0;
    final stock = p['stock'] as int? ?? 0;

    final hasDiscount = originalPrice != null && originalPrice > price;

    return GestureDetector(
      onTap: () => _showProductDetail(p),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2))],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
              child: SizedBox(
                height: 150, width: double.infinity,
                child: Stack(
                  children: [
                    _productImage(thumbnail),
                    // Discount badge
                    if (hasDiscount)
                      Positioned(
                        top: 8, left: 8,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.red,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text('-${((1 - price / originalPrice) * 100).round()}%',
                            style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                        ),
                      ),
                    // Out of stock overlay
                    if (stock == 0)
                      Positioned.fill(
                        child: Container(
                          color: Colors.black.withValues(alpha: 0.4),
                          child: const Center(
                            child: Text('Out of Stock', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
            // Details
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (category.isNotEmpty)
                      Text(category.replaceAll('_', ' ').toUpperCase(),
                        maxLines: 1, overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.grey[500], letterSpacing: 0.5)),
                    const SizedBox(height: 2),
                    Text(title, maxLines: 2, overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Text('KSh ${price.toStringAsFixed(price == price.roundToDouble() ? 0 : 2)}',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primary)),
                        if (hasDiscount) ...[
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text('KSh ${originalPrice.toStringAsFixed(0)}',
                              maxLines: 1, overflow: TextOverflow.ellipsis,
                              style: TextStyle(fontSize: 11, color: Colors.grey[400], decoration: TextDecoration.lineThrough)),
                          ),
                        ],
                      ],
                    ),
                    const Spacer(),
                    Row(
                      children: [
                        if (rating != null) ...[
                          Icon(Icons.star_rounded, size: 14, color: Colors.amber[600]),
                          Text('$rating', style: TextStyle(fontSize: 11, color: Colors.amber[700])),
                        ],
                        const Spacer(),
                        if (sales > 0)
                          Text('$sales', style: TextStyle(fontSize: 10, color: Colors.grey[400])),
                      ],
                    ),
                    const SizedBox(height: 4),
                    SizedBox(
                      width: double.infinity,
                      height: 34,
                      child: ElevatedButton(
                        onPressed: stock > 0 ? () => _addToCart(p) : null,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: stock > 0 ? AppColors.primary : Colors.grey[300],
                          foregroundColor: stock > 0 ? Colors.white : Colors.grey[500],
                          padding: EdgeInsets.zero,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        child: const Text('Add to Cart', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _showCart() async {
    if (_cart.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Your cart is empty'), behavior: SnackBarBehavior.floating),
      );
      return;
    }

    final updatedCart = await context.push<Map<String, int>>('/cart', extra: {
      'cart': Map.from(_cart),
      'products': _allProducts,
    });

    if (updatedCart != null && mounted) {
      setState(() {
        _cart
          ..clear()
          ..addAll(updatedCart);
        _cartTotal = _cart.values.fold(0, (s, q) => s + q);
      });
    }
  }
}
