'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  ShoppingCart, Search, Filter, Eye, Trash2, Star, Edit3, CheckCircle, XCircle,
  BookOpen, Package, Wrench, GraduationCap, FileText, Download, RefreshCw,
  Loader2, Tag, TrendingUp, DollarSign, BarChart3,
} from 'lucide-react';

interface Product {
  id: string;
  title: string;
  description: string;
  productType: string;
  category: string;
  price: number;
  originalPrice: number | null;
  stock: number;
  status: string;
  thumbnailUrl: string | null;
  tags: string[] | null;
  grade: number | null;
  subject: string | null;
  publisher: string | null;
  salesCount: number;
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  createdAt: string;
  creator: { id: string; firstName: string; lastName: string; email: string; role: string } | null;
}

const CARD = 'bg-[#171f33] border border-[#2a3550]';
const INPUT = 'bg-[#0f1729] border border-[#2a3550] text-[#dae2fd] placeholder-[#6b7a99] focus:outline-none focus:ring-2 focus:ring-[#47a263]/30';
const TEXT_PRIMARY = 'text-[#dae2fd]';
const TEXT_MUTED = 'text-[#8899bb]';
const TEXT_BRIGHT = 'text-[#ffffff]';

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'textbooks', label: 'Textbooks' },
  { value: 'revision_materials', label: 'Revision Materials' },
  { value: 'stationery', label: 'Stationery' },
  { value: 'science_kits', label: 'Science Kits' },
  { value: 'digital_resources', label: 'Digital Resources' },
  { value: 'exam_prep', label: 'Exam Prep' },
];

const PRODUCT_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'e_book', label: 'E-Books' },
  { value: 'physical_book', label: 'Physical Books' },
  { value: 'learning_tool', label: 'Learning Tools' },
  { value: 'revision_kit', label: 'Revision Kits' },
  { value: 'course_access', label: 'Course Access' },
];

const STATUSES = [
  { value: 'all', label: 'All Status' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
];

export default function AdminStorePage() {
  const { user } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'analytics'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({ title: '', price: 0, stock: 0, status: 'published', isFeatured: false });
  const [saving, setSaving] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => { setIsMounted(true); }, []);
  useEffect(() => { if (isMounted) loadProducts(); }, [isMounted, activeTab, categoryFilter, typeFilter, statusFilter]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (typeFilter !== 'all') params.productType = typeFilter;
      if (searchQuery) params.search = searchQuery;

      const res = await api.get('/store/products', { params });
      let filtered = res.data;
      if (statusFilter !== 'all') {
        filtered = filtered.filter((p: Product) => p.status === statusFilter);
      }
      setProducts(filtered);
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    setUpdatingId(id);
    try {
      await api.put(`/store/products/${id}`, { isFeatured: !current });
      toast.success(current ? 'Removed from featured' : 'Added to featured');
      loadProducts();
    } catch (err) {
      toast.error('Failed to update product');
    } finally {
      setUpdatingId(null);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      await api.put(`/store/products/${id}`, { status });
      toast.success(`Product ${status}`);
      loadProducts();
    } catch (err) {
      toast.error('Failed to update product');
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteProduct = async (id: string) => {
    setDeletingId(id);
    try {
      await api.delete(`/store/products/${id}`);
      toast.success('Product deleted');
      setShowDeleteConfirm(false);
      loadProducts();
    } catch (err) {
      toast.error('Failed to delete product');
    } finally {
      setDeletingId(null);
    }
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setEditForm({
      title: product.title,
      price: product.price,
      stock: product.stock,
      status: product.status,
      isFeatured: product.isFeatured,
    });
    setShowEditModal(true);
  };

  const saveEdit = async () => {
    if (!editingProduct) return;
    setSaving(true);
    try {
      await api.put(`/store/products/${editingProduct.id}`, editForm);
      toast.success('Product updated');
      setShowEditModal(false);
      loadProducts();
    } catch (err) {
      toast.error('Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => `KES ${amount.toFixed(2)}`;
  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'e_book': return Download;
      case 'physical_book': return BookOpen;
      case 'learning_tool': return Wrench;
      case 'revision_kit': return FileText;
      case 'course_access': return GraduationCap;
      default: return Package;
    }
  };

  const totalRevenue = products.reduce((sum, p) => sum + p.price * p.salesCount, 0);
  const totalSales = products.reduce((sum, p) => sum + p.salesCount, 0);
  const publishedCount = products.filter((p) => p.status === 'published').length;

  if (!isMounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[#47a263]/30 border-t-[#47a263] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#dae2fd]">Store Management</h1>
          <p className={`${TEXT_MUTED} mt-1`}>Manage products, orders, and marketplace analytics</p>
        </div>
        <button onClick={loadProducts} className={`flex items-center gap-2 px-4 py-2 rounded-lg border border-[#2a3550] ${CARD} ${TEXT_PRIMARY} hover:border-[#3a4a6a]`}>
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {activeTab === 'products' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Products', value: products.length, icon: ShoppingCart, color: 'text-[#89ceff]', bg: 'bg-[#89ceff]/10' },
              { label: 'Published', value: publishedCount, icon: CheckCircle, color: 'text-[#47a263]', bg: 'bg-[#47a263]/10' },
              { label: 'Total Sales', value: totalSales, icon: TrendingUp, color: 'text-[#f0b860]', bg: 'bg-[#f0b860]/10' },
              { label: 'Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'text-[#47a263]', bg: 'bg-[#47a263]/10' },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`p-4 rounded-xl border border-[#2a3550] ${CARD}`}>
                  <div className={`p-2 rounded-lg w-fit ${stat.bg}`}><Icon className={`w-5 h-5 ${stat.color}`} /></div>
                  <p className="text-xl font-bold text-[#dae2fd] mt-3">{stat.value}</p>
                  <p className={`text-xs ${TEXT_MUTED} mt-1`}>{stat.label}</p>
                </motion.div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b7a99]" />
              <input type="text" placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadProducts()} className={`w-full pl-10 pr-4 py-2.5 rounded-lg ${INPUT}`} />
            </div>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={`px-3 py-2.5 rounded-lg ${INPUT}`}><option value="all">All Categories</option>{CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={`px-3 py-2.5 rounded-lg ${INPUT}`}><option value="all">All Types</option>{PRODUCT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`px-3 py-2.5 rounded-lg ${INPUT}`}><option value="all">All Status</option>{STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
          </div>

          {products.length === 0 ? (
            <div className={`text-center py-20 rounded-xl border border-[#2a3550] ${CARD}`}>
              <ShoppingCart className="w-16 h-16 text-[#6b7a99] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#dae2fd]">No products found</h3>
            </div>
          ) : (
            <div className="space-y-3">
              {products.map((p) => {
                const TypeIcon = getTypeIcon(p.productType);
                return (
                  <div key={p.id} className={`p-4 rounded-xl border border-[#2a3550] ${CARD} hover:border-[#3a4a6a] transition-all`}>
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-[#0f1729] rounded-lg flex items-center justify-center flex-shrink-0">
                        {p.thumbnailUrl ? <img src={p.thumbnailUrl} alt={p.title} className="w-full h-full object-cover rounded-lg" /> : <TypeIcon className="w-8 h-8 text-[#6b7a99]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className={`font-semibold ${TEXT_BRIGHT} truncate`}>{p.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <TypeIcon className="w-3 h-3 text-[#6b7a99]" />
                              <span className={`text-xs ${TEXT_MUTED} capitalize`}>{p.productType.replace('_', ' ')}</span>
                              {p.grade && <><span className="text-[#3a4a6a]">|</span><span className={`text-xs ${TEXT_MUTED}`}>Grade {p.grade}</span></>}
                              {p.subject && <><span className="text-[#3a4a6a]">|</span><span className={`text-xs ${TEXT_MUTED}`}>{p.subject}</span></>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              p.status === 'published' ? 'bg-[#47a263]/10 text-[#47a263]' :
                              p.status === 'draft' ? 'bg-[#f0b860]/10 text-[#f0b860]' :
                              'bg-[#8899bb]/10 text-[#8899bb]'
                            }`}>
                              {p.status}
                            </span>
                            {p.isFeatured && <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#f0b860]/10 text-[#f0b860]">Featured</span>}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-6">
                            <span className="text-lg font-bold text-[#47a263]">{formatCurrency(p.price)}</span>
                            <span className={`text-sm ${TEXT_MUTED}`}>Stock: {p.stock}</span>
                            <span className={`text-sm ${TEXT_MUTED}`}>Sales: {p.salesCount}</span>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-[#f0b860] fill-[#f0b860]" />
                              <span className={`text-sm ${TEXT_MUTED}`}>{p.rating || 'N/A'}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => toggleFeatured(p.id, p.isFeatured)} disabled={updatingId === p.id} className="p-2 hover:bg-[#2a3550] rounded-lg" title={p.isFeatured ? 'Unfeature' : 'Feature'}>
                              {updatingId === p.id ? <Loader2 className="w-4 h-4 animate-spin text-[#8899bb]" /> : <Star className={`w-4 h-4 ${p.isFeatured ? 'text-[#f0b860] fill-[#f0b860]' : 'text-[#6b7a99]'}`} />}
                            </button>
                            <button onClick={() => openEdit(p)} className="p-2 hover:bg-[#2a3550] rounded-lg" title="Edit"><Edit3 className="w-4 h-4 text-[#8899bb]" /></button>
                            <button onClick={() => { setEditingProduct(p); setShowDeleteConfirm(true); }} className="p-2 hover:bg-[#ffb4ab]/10 rounded-lg" title="Delete"><Trash2 className="w-4 h-4 text-[#ffb4ab]" /></button>
                          </div>
                        </div>
                        {p.creator && (
                          <p className={`text-xs ${TEXT_MUTED} mt-2`}>By: {p.creator.firstName} {p.creator.lastName} ({p.creator.role})</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'orders' && (
        <div className={`text-center py-20 rounded-xl border border-[#2a3550] ${CARD}`}>
          <ShoppingCart className="w-16 h-16 text-[#6b7a99] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#dae2fd]">Order Management</h3>
          <p className={`${TEXT_MUTED} mt-1`}>View and manage all platform orders from Financial Oversight</p>
          <button onClick={() => setActiveTab('overview' as any)} className="mt-4 px-6 py-2.5 bg-[#47a263] text-[#003919] rounded-lg font-medium hover:bg-[#3d8c54]">Go to Financial Oversight</button>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className={`text-center py-20 rounded-xl border border-[#2a3550] ${CARD}`}>
          <BarChart3 className="w-16 h-16 text-[#6b7a99] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#dae2fd]">Store Analytics</h3>
          <p className={`${TEXT_MUTED} mt-1`}>Detailed analytics available in Financial Oversight</p>
          <button onClick={() => window.location.href = '/admin/financial'} className="mt-4 px-6 py-2.5 bg-[#47a263] text-[#003919] rounded-lg font-medium hover:bg-[#3d8c54]">Go to Financial Oversight</button>
        </div>
      )}

      <AnimatePresence>
        {showEditModal && editingProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowEditModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-[#171f33] border border-[#2a3550] rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-[#dae2fd] mb-4">Edit Product</h3>
              <div className="space-y-4">
                <div><label className={`block text-sm font-medium ${TEXT_PRIMARY} mb-1`}>Title</label><input type="text" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className={`w-full px-3 py-2 rounded-lg ${INPUT}`} /></div>
                <div><label className={`block text-sm font-medium ${TEXT_PRIMARY} mb-1`}>Price (KES)</label><input type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })} className={`w-full px-3 py-2 rounded-lg ${INPUT}`} /></div>
                <div><label className={`block text-sm font-medium ${TEXT_PRIMARY} mb-1`}>Stock</label><input type="number" value={editForm.stock} onChange={(e) => setEditForm({ ...editForm, stock: Number(e.target.value) })} className={`w-full px-3 py-2 rounded-lg ${INPUT}`} /></div>
                <div><label className={`block text-sm font-medium ${TEXT_PRIMARY} mb-1`}>Status</label><select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className={`w-full px-3 py-2 rounded-lg ${INPUT}`}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></div>
                <div className="flex items-center gap-2"><input type="checkbox" checked={editForm.isFeatured} onChange={(e) => setEditForm({ ...editForm, isFeatured: e.target.checked })} className="w-4 h-4" /><span className={`text-sm ${TEXT_PRIMARY}`}>Featured</span></div>
                <div className="flex gap-3 pt-2">
                  <button onClick={saveEdit} disabled={saving} className="flex-1 py-2.5 bg-[#47a263] text-[#003919] rounded-lg font-medium hover:bg-[#3d8c54] disabled:opacity-50 flex items-center justify-center gap-2">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}Save</button>
                  <button onClick={() => setShowEditModal(false)} className={`px-4 py-2.5 border border-[#2a3550] rounded-lg ${TEXT_PRIMARY} hover:bg-[#2a3550]`}>Cancel</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteConfirm && editingProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-[#171f33] border border-[#2a3550] rounded-2xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
              <div className="text-center">
                <div className="w-12 h-12 bg-[#ffb4ab]/10 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="w-6 h-6 text-[#ffb4ab]" /></div>
                <h3 className="text-lg font-bold text-[#dae2fd]">Delete Product</h3>
                <p className={`text-sm ${TEXT_MUTED} mt-2`}>Are you sure you want to delete "{editingProduct.title}"? This cannot be undone.</p>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => deleteProduct(editingProduct.id)} disabled={deletingId === editingProduct.id} className="flex-1 py-2.5 bg-[#ffb4ab] text-[#3d0000] rounded-lg font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">{deletingId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}Delete</button>
                <button onClick={() => setShowDeleteConfirm(false)} className={`px-4 py-2.5 border border-[#2a3550] rounded-lg ${TEXT_PRIMARY} hover:bg-[#2a3550]`}>Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
