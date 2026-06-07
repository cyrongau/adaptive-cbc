'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { getTheme } from '@/lib/theme';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { ShoppingCart, Plus, Minus, Trash2, BookOpen, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Product {
  id: string;
  title: string;
  productType: string;
  thumbnailUrl: string | null;
}

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  product: Product;
}

interface Cart {
  id: string;
  items: CartItem[];
  totalAmount: number;
}

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);
  const isCandidate = user?.role === 'student' && (Number(user?.grade) === 6 || Number(user?.grade) === 9);
  const theme = getTheme(user?.role || 'student', isCandidate);

  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const res = await api.get('/store/cart');
      setCart(res.data);
    } catch (err) {
      console.error('Failed to load cart:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateCartItem = async (itemId: string, quantity: number) => {
    try {
      const res = await api.put(`/store/cart/items/${itemId}`, { quantity });
      setCart(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update cart');
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const res = await api.delete(`/store/cart/items/${itemId}`);
      setCart(res.data);
      toast.success('Item removed');
    } catch (err: any) {
      toast.error('Failed to remove item');
    }
  };

  if (!isMounted) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[#47a263]/30 border-t-[#47a263] rounded-full animate-spin" />
      </div>
    );
  }

  const cartItemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Your Cart</h1>
          <p className={`${theme.mutedText} mt-1`}>Review your items before checkout</p>
        </div>
      </div>

      {!cart?.items || cart.items.length === 0 ? (
        <div className={`text-center py-20 rounded-xl border ${theme.cardBorder} ${theme.cardBg}`}>
          <ShoppingCart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700">Your cart is empty</h3>
          <p className={`${theme.mutedText} mt-1 mb-4`}>Browse the store to find learning materials</p>
          <Link
            href="/store"
            className="inline-block px-6 py-2.5 bg-[#47a263] text-white rounded-lg font-medium hover:bg-[#3d8c54] transition-all"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <div key={item.id} className={`p-4 rounded-xl border ${theme.cardBorder} ${theme.cardBg} flex gap-4`}>
                <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {item.product.thumbnailUrl ? (
                    <img src={item.product.thumbnailUrl} alt={item.product.title} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <BookOpen className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate">{item.product.title}</h3>
                  <p className="text-sm text-slate-500 capitalize">{item.product.productType.replace('_', ' ')}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateCartItem(item.id, Math.max(1, item.quantity - 1))}
                        className={`w-8 h-8 rounded-lg border ${theme.cardBorder} flex items-center justify-center hover:bg-slate-50`}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateCartItem(item.id, item.quantity + 1)}
                        className={`w-8 h-8 rounded-lg border ${theme.cardBorder} flex items-center justify-center hover:bg-slate-50`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-[#47a263]">KES {(item.unitPrice * item.quantity).toFixed(2)}</span>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={`p-6 rounded-xl border ${theme.cardBorder} ${theme.cardBg} h-fit space-y-4`}>
            <h3 className="text-lg font-bold text-slate-900">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({cartItemCount} items)</span>
                <span>KES {cart.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>VAT (16%)</span>
                <span>KES {(cart.totalAmount * 0.16).toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-[#47a263]">KES {(cart.totalAmount * 1.16).toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => router.push('/store/checkout')}
              className="w-full py-3 bg-[#47a263] text-white rounded-lg font-bold hover:bg-[#3d8c54] transition-all flex items-center justify-center gap-2"
            >
              Proceed to Checkout
              <ArrowRight className="w-5 h-5" />
            </button>
            <Link
              href="/store"
              className="block text-center text-sm font-medium text-slate-500 hover:text-slate-700 transition-all mt-2"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
