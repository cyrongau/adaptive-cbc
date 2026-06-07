'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { getTheme } from '@/lib/theme';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Truck, CreditCard, Building, Smartphone, Loader2, CheckCircle, ArrowLeft, MapPin } from 'lucide-react';
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

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);
  const isCandidate = user?.role === 'student' && (Number(user?.grade) === 6 || Number(user?.grade) === 9);
  const theme = getTheme(user?.role || 'student', isCandidate);

  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const [step, setStep] = useState<'address' | 'payment' | 'review'>('address');
  const [selectedPayment, setSelectedPayment] = useState<string>('m_pesa');
  
  // Form states
  const [shippingAddress, setShippingAddress] = useState({
    name: user?.firstName ? `${user.firstName} ${user.lastName || ''}` : '',
    phone: user?.phone || '',
    street: '',
    city: '',
    county: '',
    postalCode: ''
  });

  useEffect(() => {
    setIsMounted(true);
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const res = await api.get('/store/cart');
      setCart(res.data);
      
      // If no physical products, skip address step
      const hasPhysical = res.data?.items?.some((item: CartItem) => item.product.productType === 'physical_book' || item.product.productType === 'learning_tool');
      if (!hasPhysical) {
        setStep('payment');
      }
    } catch (err) {
      console.error('Failed to load cart:', err);
    } finally {
      setLoading(false);
    }
  };

  const hasPhysicalItems = cart?.items?.some(item => item.product.productType === 'physical_book' || item.product.productType === 'learning_tool');

  const proceedToPayment = () => {
    if (hasPhysicalItems) {
      if (!shippingAddress.name || !shippingAddress.phone || !shippingAddress.street || !shippingAddress.city) {
        toast.error('Please fill in all required shipping details');
        return;
      }
    }
    setStep('payment');
  };

  const proceedToReview = () => {
    setStep('review');
  };

  const placeOrder = async () => {
    setCheckoutLoading(true);
    try {
      const payload: any = { paymentMethod: selectedPayment };
      if (hasPhysicalItems) {
        payload.shippingAddress = shippingAddress;
      }
      
      const res = await api.post('/store/orders', payload);
      toast.success('Order placed successfully!');
      router.push('/store?tab=orders');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Checkout failed');
    } finally {
      setCheckoutLoading(false);
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

  if (!cart?.items || cart.items.length === 0) {
    return (
      <div className={`text-center py-20 rounded-xl border ${theme.cardBorder} ${theme.cardBg}`}>
        <h3 className="text-lg font-semibold text-slate-700">Your cart is empty</h3>
        <p className={`${theme.mutedText} mt-1 mb-4`}>You need items in your cart to checkout.</p>
        <Link href="/store" className="px-6 py-2.5 bg-[#47a263] text-white rounded-lg font-medium hover:bg-[#3d8c54]">
          Return to Store
        </Link>
      </div>
    );
  }

  const subtotal = cart.totalAmount;
  const vat = subtotal * 0.16;
  // Basic shipping cost logic
  const shippingCost = hasPhysicalItems ? 500 : 0; 
  const total = subtotal + vat + shippingCost;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <button onClick={() => router.push('/store/cart')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-all mb-2 text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to Cart
          </button>
          <h1 className="text-3xl font-bold text-slate-900">Checkout</h1>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        {hasPhysicalItems && (
          <>
            <div className={`flex flex-col items-center ${step === 'address' ? 'text-[#47a263]' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-1 ${step === 'address' ? 'bg-[#47a263] text-white' : 'bg-slate-200 text-slate-500'}`}>1</div>
              <span className="text-xs font-medium">Shipping</span>
            </div>
            <div className={`w-16 h-1 mx-2 ${step !== 'address' ? 'bg-[#47a263]' : 'bg-slate-200'}`} />
          </>
        )}
        <div className={`flex flex-col items-center ${step === 'payment' ? 'text-[#47a263]' : 'text-slate-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-1 ${step === 'payment' ? 'bg-[#47a263] text-white' : (step === 'review' ? 'bg-[#47a263] text-white' : 'bg-slate-200 text-slate-500')}`}>{hasPhysicalItems ? '2' : '1'}</div>
          <span className="text-xs font-medium">Payment</span>
        </div>
        <div className={`w-16 h-1 mx-2 ${step === 'review' ? 'bg-[#47a263]' : 'bg-slate-200'}`} />
        <div className={`flex flex-col items-center ${step === 'review' ? 'text-[#47a263]' : 'text-slate-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-1 ${step === 'review' ? 'bg-[#47a263] text-white' : 'bg-slate-200 text-slate-500'}`}>{hasPhysicalItems ? '3' : '2'}</div>
          <span className="text-xs font-medium">Review</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {step === 'address' && hasPhysicalItems && (
            <div className={`p-6 rounded-xl border ${theme.cardBorder} ${theme.cardBg} space-y-4`}>
              <h2 className="text-xl font-bold flex items-center gap-2"><MapPin className="w-5 h-5 text-[#47a263]" /> Shipping Address</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                  <input type="text" value={shippingAddress.name} onChange={e => setShippingAddress({...shippingAddress, name: e.target.value})} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-[#47a263]/30" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number *</label>
                  <input type="text" value={shippingAddress.phone} onChange={e => setShippingAddress({...shippingAddress, phone: e.target.value})} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-[#47a263]/30" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Street Address *</label>
                  <input type="text" value={shippingAddress.street} onChange={e => setShippingAddress({...shippingAddress, street: e.target.value})} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-[#47a263]/30" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">County/State</label>
                  <input type="text" value={shippingAddress.county} onChange={e => setShippingAddress({...shippingAddress, county: e.target.value})} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-[#47a263]/30" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">City *</label>
                  <input type="text" value={shippingAddress.city} onChange={e => setShippingAddress({...shippingAddress, city: e.target.value})} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-[#47a263]/30" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Postal Code</label>
                  <input type="text" value={shippingAddress.postalCode} onChange={e => setShippingAddress({...shippingAddress, postalCode: e.target.value})} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-[#47a263]/30" />
                </div>
              </div>
              <button onClick={proceedToPayment} className="w-full py-3 bg-[#47a263] text-white rounded-lg font-bold hover:bg-[#3d8c54] transition-all">
                Continue to Payment
              </button>
            </div>
          )}

          {step === 'payment' && (
            <div className={`p-6 rounded-xl border ${theme.cardBorder} ${theme.cardBg} space-y-4`}>
              <h2 className="text-xl font-bold flex items-center gap-2"><CreditCard className="w-5 h-5 text-[#47a263]" /> Payment Method</h2>
              <div className="space-y-3">
                {[
                  { value: 'm_pesa', label: 'M-Pesa STK Push', icon: Smartphone, desc: 'Pay instantly via Safaricom M-Pesa' },
                  { value: 'card', label: 'Credit/Debit Card', icon: CreditCard, desc: 'Visa, Mastercard, etc.' },
                  { value: 'bank_transfer', label: 'Bank Transfer', icon: Building, desc: 'Direct bank transfer' },
                ].map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.value}
                      onClick={() => setSelectedPayment(method.value)}
                      className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all ${
                        selectedPayment === method.value
                          ? 'border-[#47a263] bg-[#47a263]/5'
                          : `border-slate-200 hover:border-[#47a263]/50 hover:bg-slate-50`
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${selectedPayment === method.value ? 'bg-[#47a263]/10 text-[#47a263]' : 'bg-slate-100 text-slate-500'}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="text-left flex-1">
                        <h4 className="font-bold text-slate-900">{method.label}</h4>
                        <p className="text-sm text-slate-500">{method.desc}</p>
                      </div>
                      {selectedPayment === method.value && <CheckCircle className="w-6 h-6 text-[#47a263] self-center" />}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-4 pt-4">
                {hasPhysicalItems && (
                  <button onClick={() => setStep('address')} className="px-6 py-3 border border-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-50 transition-all">
                    Back
                  </button>
                )}
                <button onClick={proceedToReview} className="flex-1 py-3 bg-[#47a263] text-white rounded-lg font-bold hover:bg-[#3d8c54] transition-all">
                  Review Order
                </button>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className={`p-6 rounded-xl border ${theme.cardBorder} ${theme.cardBg} space-y-6`}>
              <h2 className="text-xl font-bold flex items-center gap-2"><CheckCircle className="w-5 h-5 text-[#47a263]" /> Review Your Order</h2>
              
              <div>
                <h3 className="font-bold text-slate-700 mb-3 border-b pb-2">Items</h3>
                <div className="space-y-3">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{item.quantity}x</span>
                        <span className="text-slate-700">{item.product.title}</span>
                      </div>
                      <span className="font-medium text-slate-900">KES {(item.unitPrice * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {hasPhysicalItems && (
                <div>
                  <div className="flex items-center justify-between mb-2 border-b pb-2">
                    <h3 className="font-bold text-slate-700">Shipping Details</h3>
                    <button onClick={() => setStep('address')} className="text-[#47a263] text-sm font-medium hover:underline">Edit</button>
                  </div>
                  <p className="text-sm text-slate-600">{shippingAddress.name}</p>
                  <p className="text-sm text-slate-600">{shippingAddress.street}, {shippingAddress.city} {shippingAddress.county} {shippingAddress.postalCode}</p>
                  <p className="text-sm text-slate-600">{shippingAddress.phone}</p>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2 border-b pb-2">
                  <h3 className="font-bold text-slate-700">Payment Method</h3>
                  <button onClick={() => setStep('payment')} className="text-[#47a263] text-sm font-medium hover:underline">Edit</button>
                </div>
                <p className="text-sm text-slate-600 capitalize">{selectedPayment.replace('_', ' ')}</p>
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={() => setStep('payment')} className="px-6 py-3 border border-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-50 transition-all">
                  Back
                </button>
                <button onClick={placeOrder} disabled={checkoutLoading} className="flex-1 py-3 bg-[#47a263] text-white rounded-lg font-bold hover:bg-[#3d8c54] transition-all flex items-center justify-center gap-2">
                  {checkoutLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm & Place Order'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={`p-6 rounded-xl border ${theme.cardBorder} ${theme.cardBg} h-fit space-y-4`}>
          <h3 className="text-lg font-bold text-slate-900">Order Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>KES {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>VAT (16%)</span>
              <span>KES {vat.toFixed(2)}</span>
            </div>
            {hasPhysicalItems && (
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span>KES {shippingCost.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-[#47a263]">KES {total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
