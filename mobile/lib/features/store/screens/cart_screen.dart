import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/constants.dart';
import '../../../core/theme/app_colors.dart';

class CartScreen extends StatefulWidget {
  final Map<String, int> cart;
  final List<dynamic> allProducts;

  const CartScreen({
    super.key,
    required this.cart,
    required this.allProducts,
  });

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  late Map<String, int> _cart;

  @override
  void initState() {
    super.initState();
    _cart = Map.from(widget.cart);
  }

  String _resolveImageUrl(String? url) {
    if (url == null || url.isEmpty) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return '${AppConstants.baseHttpUrl}$url';
  }

  void _updateQuantity(String productId, int delta) {
    setState(() {
      final current = _cart[productId] ?? 0;
      final updated = current + delta;
      if (updated <= 0) {
        _cart.remove(productId);
      } else {
        _cart[productId] = updated;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final cartItems = _cart.entries.toList();
    double total = 0;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) Navigator.pop(context, _cart);
      },
      child: Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Shopping Cart'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () { Navigator.pop(context, _cart); },
        ),
        actions: [
          if (cartItems.isNotEmpty)
            TextButton(
              onPressed: () {
                _cart.clear();
                Navigator.pop(context, _cart);
              },
              child: Text('Clear', style: TextStyle(color: Colors.red[400])),
            ),
        ],
      ),
      body: cartItems.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.shopping_cart_outlined, size: 80, color: AppColors.primary.withValues(alpha: 0.3)),
                  const SizedBox(height: 16),
                  const Text('Your cart is empty', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Text('Browse the store and add items to your cart.',
                    style: TextStyle(color: AppColors.onSurfaceVariant)),
                ],
              ),
            )
          : Column(
              children: [
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: cartItems.length,
                    itemBuilder: (_, i) {
                      final entry = cartItems[i];
                      final product = widget.allProducts.firstWhere(
                        (p) => p['id'].toString() == entry.key,
                        orElse: () => <String, dynamic>{},
                      );
                      final title = product['title'] as String? ?? 'Product';
                      final price = (product['price'] is num) ? (product['price'] as num).toDouble() : 0.0;
                      final thumbnail = product['thumbnailUrl'] as String?;
                      final subtotal = price * entry.value;
                      total += subtotal;

                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2))],
                        ),
                        child: Row(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: SizedBox(
                                width: 80, height: 80,
                                child: thumbnail != null && thumbnail.isNotEmpty
                                    ? CachedNetworkImage(
                                        imageUrl: _resolveImageUrl(thumbnail),
                                        fit: BoxFit.cover,
                                        placeholder: (_, __) => Container(color: Colors.grey[100]),
                                        errorWidget: (_, __, ___) => Icon(Icons.image, color: Colors.grey[300]),
                                      )
                                    : Container(color: Colors.grey[100], child: Icon(Icons.shopping_bag_outlined, color: Colors.grey[300])),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                                  const SizedBox(height: 4),
                                  Text('KSh ${price.toStringAsFixed(0)} each',
                                    style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      _qtyButton(Icons.remove_rounded, () => _updateQuantity(entry.key, -1)),
                                      Padding(
                                        padding: const EdgeInsets.symmetric(horizontal: 12),
                                        child: Text('${entry.value}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                      ),
                                      _qtyButton(Icons.add_rounded, () => _updateQuantity(entry.key, 1)),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            Column(
                              children: [
                                Text('KSh ${subtotal.toStringAsFixed(0)}',
                                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.primary)),
                                const SizedBox(height: 4),
                                GestureDetector(
                                  onTap: () => _updateQuantity(entry.key, -entry.value),
                                  child: Icon(Icons.delete_outline, size: 20, color: Colors.red[300]),
                                ),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
                // Bottom checkout bar
                Container(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, -2))],
                  ),
                  child: SafeArea(
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text('Total (${_cart.values.fold(0, (s, q) => s + q)} items)',
                                style: TextStyle(fontSize: 12, color: Colors.grey[500])),
                              Text('KSh ${total.toStringAsFixed(0)}',
                                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.primary)),
                            ],
                          ),
                        ),
                        SizedBox(
                          height: 52,
                          child: ElevatedButton.icon(
                            onPressed: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Checkout coming soon!'), behavior: SnackBarBehavior.floating),
                              );
                            },
                            icon: const Icon(Icons.shopping_cart_checkout_rounded),
                            label: const Text('Checkout'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                              textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                            ),
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

  Widget _qtyButton(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 32, height: 32,
        decoration: BoxDecoration(
          color: AppColors.primary.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, size: 16, color: AppColors.primary),
      ),
    );
  }
}
