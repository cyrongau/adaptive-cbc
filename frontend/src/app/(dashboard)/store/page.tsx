'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { getTheme } from '@/lib/theme';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';
import ProductVariantEditor, { ProductVariant, normalizeProductVariants } from '@/components/store/ProductVariantEditor';
import {
  ShoppingBag, Search, Filter, ShoppingCart, Plus, Minus, Trash2,
  BookOpen, Package, Wrench, GraduationCap, FileText, Star,
  ChevronRight, X, CreditCard, Smartphone, Building, ArrowRight,
  Eye, Download, CheckCircle, Clock, Truck, Loader2, Tag,
  ImagePlus, Link as LinkIcon, Upload, Pencil, AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';

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
  images: string[] | null;
  thumbnailUrl: string | null;
  tags: string[] | null;
  grade: number | null;
  subject: string | null;
  publisher: string | null;
  isbn: string | null;
  salesCount: number;
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  createdAt: string;
  variants: any[] | null;
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

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  paymentMethod: string | null;
  items: { product: Product; quantity: number; unitPrice: number }[];
  createdAt: string;
}

const CATEGORIES = [
  { value: 'all', label: 'All Items', icon: ShoppingBag },
  { value: 'textbooks', label: 'Textbooks', icon: BookOpen },
  { value: 'revision_materials', label: 'Revision Materials', icon: FileText },
  { value: 'stationery', label: 'Stationery', icon: Package },
  { value: 'science_kits', label: 'Science Kits', icon: Wrench },
  { value: 'digital_resources', label: 'Digital Resources', icon: Download },
  { value: 'exam_prep', label: 'Exam Prep', icon: GraduationCap },
];

const PRODUCT_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'e_book', label: 'E-Books' },
  { value: 'physical_book', label: 'Physical Books' },
  { value: 'learning_tool', label: 'Learning Tools' },
  { value: 'revision_kit', label: 'Revision Kits' },
  { value: 'course_access', label: 'Course Access' },
];

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export default function StorePage() {
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState(false);
  const isCandidate = user?.role === 'student' && (Number(user?.grade) === 6 || Number(user?.grade) === 9);
  const theme = getTheme(user?.role || 'student', isCandidate);

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartLoading, setCartLoading] = useState(false);

  const tabParam = searchParams.get('tab');
  const initialTab = tabParam === 'orders' || tabParam === 'my-products' ? tabParam : 'browse';
  const [activeTab, setActiveTab] = useState<'browse' | 'cart' | 'orders' | 'my-products'>(initialTab as any);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);

  const isSeller = ['teacher', 'tutor', 'institution_admin', 'super_admin'].includes(user?.role || '');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    title: '', description: '', productType: 'e_book', category: 'textbooks',
    price: 0, originalPrice: 0, stock: 100, grade: 0, subject: '', publisher: '',
    tags: '', thumbnailUrl: '', images: '', variants: [] as ProductVariant[],
  });
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [imageUploadMode, setImageUploadMode] = useState<'url' | 'upload'>('url');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [editImageMode, setEditImageMode] = useState<'url' | 'upload'>('url');
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string>('');
  const [uploadingEditImage, setUploadingEditImage] = useState(false);
  const editImageInputRef = useRef<HTMLInputElement>(null);

  const [uploadingGallery, setUploadingGallery] = useState(false);

  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [myProductsLoading, setMyProductsLoading] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({
    title: '', description: '', productType: 'e_book', category: 'textbooks',
    price: 0, originalPrice: 0, stock: 100, grade: 0, subject: '', publisher: '',
    tags: '', thumbnailUrl: '', isFeatured: false, status: 'published',
    images: '', variants: [] as ProductVariant[],
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());

  useEffect(() => { setIsMounted(true); }, []);
  useEffect(() => {
    if (isMounted) {
      loadProducts();
      loadCart();
      loadOrders();
    }
  }, [isMounted]);

  useEffect(() => {
    if (isMounted && activeTab === 'my-products' && isSeller) {
      loadMyProducts();
    }
  }, [activeTab, isMounted]);

  const loadProducts = async () => {
    try {
      const params: Record<string, string> = {};
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (selectedType !== 'all') params.productType = selectedType;
      if (selectedGrade) params.grade = String(selectedGrade);
      if (searchQuery) params.search = searchQuery;

      const res = await api.get('/store/products', { params });
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCart = async () => {
    try {
      const res = await api.get('/store/cart');
      setCart(res.data);
    } catch (err) {
      console.error('Failed to load cart:', err);
    }
  };

  const loadOrders = async () => {
    try {
      const res = await api.get('/store/orders');
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to load orders:', err);
    }
  };

  const addToCart = async (productId: string) => {
    setCartLoading(true);
    try {
      const res = await api.post('/store/cart/add', { productId, quantity: 1 });
      setCart(res.data);
      toast.success('Added to cart');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    } finally {
      setCartLoading(false);
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

  const loadMyProducts = async () => {
    setMyProductsLoading(true);
    try {
      const res = await api.get('/store/products/my');
      setMyProducts(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load your products');
    } finally {
      setMyProductsLoading(false);
    }
  };

  const updateProduct = async () => {
    if (!editingProduct || !editForm.title || !editForm.price) {
      toast.error('Title and price are required');
      return;
    }
    setSavingEdit(true);
    try {
      let thumbnailUrl = editForm.thumbnailUrl;
      if (editImageMode === 'upload' && editImageFile) {
        setUploadingEditImage(true);
        const formData = new FormData();
        formData.append('image', editImageFile);
        const uploadRes = await api.post('/store/products/upload-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        thumbnailUrl = uploadRes.data.imageUrl;
        setUploadingEditImage(false);
      }

      await api.put(`/store/products/${editingProduct.id}`, {
        ...editForm,
        thumbnailUrl: thumbnailUrl || undefined,
        price: Number(editForm.price),
        originalPrice: editForm.originalPrice ? Number(editForm.originalPrice) : undefined,
        stock: Number(editForm.stock),
        grade: editForm.grade || undefined,
        tags: editForm.tags ? editForm.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        images: editForm.images ? editForm.images.split(',').map((t) => t.trim()).filter(Boolean) : [],
        variants: normalizeProductVariants(editForm.variants),
      });
      toast.success('Product updated successfully');
      setShowEditProduct(false);
      setEditingProduct(null);
      setEditImageFile(null);
      setEditImagePreview('');
      loadMyProducts();
      loadProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update product');
    } finally {
      setSavingEdit(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingProduct) return;
    setDeleting(true);
    try {
      await api.delete(`/store/products/${deletingProduct.id}`);
      toast.success('Product deleted');
      setShowDeleteConfirm(false);
      setDeletingProduct(null);
      loadMyProducts();
      loadProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  const createProduct = async () => {
    if (!productForm.title || !productForm.price) {
      toast.error('Title and price are required');
      return;
    }
    setCreatingProduct(true);
    try {
      let thumbnailUrl = productForm.thumbnailUrl;

      // If user selected a file, upload it first
      if (imageUploadMode === 'upload' && imageFile) {
        setUploadingImage(true);
        const formData = new FormData();
        formData.append('image', imageFile);
        const uploadRes = await api.post('/store/products/upload-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        thumbnailUrl = uploadRes.data.imageUrl;
        setUploadingImage(false);
      }

      await api.post('/store/products', {
        ...productForm,
        thumbnailUrl: thumbnailUrl || undefined,
        price: Number(productForm.price),
        originalPrice: productForm.originalPrice ? Number(productForm.originalPrice) : undefined,
        stock: Number(productForm.stock),
        grade: productForm.grade || undefined,
        tags: productForm.tags ? productForm.tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
        images: productForm.images ? productForm.images.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
        variants: normalizeProductVariants(productForm.variants),
        status: 'published',
      });
      toast.success('Product published successfully');
      setShowAddProduct(false);
      setProductForm({ title: '', description: '', productType: 'e_book', category: 'textbooks', price: 0, originalPrice: 0, stock: 100, grade: 0, subject: '', publisher: '', tags: '', thumbnailUrl: '', images: '', variants: [] });
      setImageFile(null);
      setImagePreview('');
      setImageUploadMode('url');
      loadProducts();
    } catch (err: any) {
      setUploadingImage(false);
      toast.error(err.response?.data?.message || 'Failed to create product');
    } finally {
      setCreatingProduct(false);
    }
  };

  const handleImageFileSelect = (file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleEditImageFileSelect = (file: File) => {
    setEditImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setEditImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const uploadGalleryImages = async (files: FileList | null, onUploadSuccess: (urls: string[]) => void) => {
    if (!files || files.length === 0) return;
    setUploadingGallery(true);
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('image', files[i]);
        const uploadRes = await api.post('/store/products/upload-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        urls.push(uploadRes.data.imageUrl);
      }
      onUploadSuccess(urls);
      toast.success(`${files.length} images uploaded`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload images');
    } finally {
      setUploadingGallery(false);
    }
  };

  const getProductTypeIcon = (type: string) => {
    switch (type) {
      case 'e_book': return Download;
      case 'physical_book': return BookOpen;
      case 'learning_tool': return Wrench;
      case 'revision_kit': return FileText;
      case 'course_access': return GraduationCap;
      default: return Package;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-amber-600 bg-amber-50';
      case 'processing': return 'text-blue-600 bg-blue-50';
      case 'completed': return 'text-green-600 bg-green-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  const cartItemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  if (!isMounted) {
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
          <h1 className="text-3xl font-bold text-slate-900">Learning Store</h1>
          <p className={`${theme.mutedText} mt-1`}>E-books, textbooks, revision kits, and learning tools</p>
        </div>
        <div className="flex items-center gap-3">
          {isSeller && (
            <button
              onClick={() => setShowAddProduct(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#47a263] text-white rounded-lg font-medium hover:bg-[#3d8c54] transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          )}
          <Link
            href="/store/cart"
            className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all ${theme.cardBg} border ${theme.cardBorder} hover:shadow-md`}
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="font-medium">Cart</span>
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {cartItemCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {[
          { key: 'browse', label: 'Browse Products', icon: ShoppingBag },
          ...(isSeller ? [{ key: 'my-products' as const, label: 'My Products', icon: Package }] : []),
          { key: 'orders', label: 'My Orders', icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                activeTab === tab.key
                  ? `border-[#47a263] text-[#47a263]`
                  : `border-transparent text-slate-500 hover:text-slate-700`
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'browse' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadProducts()}
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${theme.cardBorder} bg-white focus:outline-none focus:ring-2 focus:ring-[#47a263]/30`}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border ${theme.cardBorder} bg-white hover:bg-slate-50 transition-all`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`p-4 rounded-xl border ${theme.cardBorder} ${theme.cardBg} space-y-4`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => { setSelectedCategory(e.target.value); loadProducts(); }}
                      className={`w-full px-3 py-2 rounded-lg border ${theme.cardBorder} bg-white focus:outline-none focus:ring-2 focus:ring-[#47a263]/30`}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Product Type</label>
                    <select
                      value={selectedType}
                      onChange={(e) => { setSelectedType(e.target.value); loadProducts(); }}
                      className={`w-full px-3 py-2 rounded-lg border ${theme.cardBorder} bg-white focus:outline-none focus:ring-2 focus:ring-[#47a263]/30`}
                    >
                      {PRODUCT_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Grade</label>
                    <select
                      value={selectedGrade || ''}
                      onChange={(e) => { setSelectedGrade(e.target.value ? Number(e.target.value) : null); loadProducts(); }}
                      className={`w-full px-3 py-2 rounded-lg border ${theme.cardBorder} bg-white focus:outline-none focus:ring-2 focus:ring-[#47a263]/30`}
                    >
                      <option value="">All Grades</option>
                      {GRADES.map((g) => (
                        <option key={g} value={g}>Grade {g}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.value}
                  onClick={() => { setSelectedCategory(cat.value); loadProducts(); }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === cat.value
                      ? 'bg-[#47a263] text-white'
                      : `${theme.cardBg} border ${theme.cardBorder} text-slate-600 hover:bg-slate-50`
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {cat.label}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#47a263]/30 border-t-[#47a263] rounded-full animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className={`text-center py-20 rounded-xl border ${theme.cardBorder} ${theme.cardBg}`}>
              <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700">No products found</h3>
              <p className={`${theme.mutedText} mt-1`}>Try adjusting your filters or search terms</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => {
                const TypeIcon = getProductTypeIcon(product.productType);
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-xl border ${theme.cardBorder} ${theme.cardBg} overflow-hidden hover:shadow-lg transition-all group`}
                  >
                    <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                      {product.thumbnailUrl && !brokenImages.has(product.id) ? (
                        <img
                          src={product.thumbnailUrl}
                          alt={product.title}
                          className="w-full h-full object-cover"
                          onError={() => setBrokenImages(prev => new Set(prev).add(product.id))}
                        />
                      ) : (
                        <TypeIcon className="w-16 h-16 text-slate-400" />
                      )}
                      {product.isFeatured && (
                        <span className="absolute top-3 left-3 px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded-full">
                          Featured
                        </span>
                      )}
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="absolute top-3 right-3 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                          -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                        </span>
                      )}
                      <button
                        onClick={() => { setSelectedProduct(product); setShowProductModal(true); }}
                        className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                      >
                        <span className="px-4 py-2 bg-white rounded-lg text-sm font-medium shadow-lg">
                          Quick View
                        </span>
                      </button>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <TypeIcon className="w-4 h-4 text-slate-400" />
                        <span className="text-xs text-slate-500 capitalize">{product.productType.replace('_', ' ')}</span>
                        {product.grade && (
                          <>
                            <span className="text-slate-300">|</span>
                            <span className="text-xs text-slate-500">Grade {product.grade}</span>
                          </>
                        )}
                      </div>
                      <h3 className="font-semibold text-slate-900 line-clamp-2">{product.title}</h3>
                      {product.subject && (
                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                          {product.subject}
                        </span>
                      )}
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="text-sm text-slate-600">{product.rating || 'N/A'}</span>
                        <span className="text-xs text-slate-400">({product.reviewCount || 0})</span>
                        <span className="text-slate-300 mx-1">|</span>
                        <span className="text-xs text-slate-400">{product.salesCount} sold</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold text-[#47a263]">KES {Number(product.price || 0).toFixed(2)}</span>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <span className="text-sm text-slate-400 line-through">KES {Number(product.originalPrice || 0).toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => addToCart(product.id)}
                        disabled={cartLoading || (product.stock <= 0 && product.productType !== 'e_book' && product.productType !== 'course_access')}
                        className="w-full py-2.5 bg-[#47a263] text-white rounded-lg font-medium hover:bg-[#3d8c54] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add to Cart
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Cart tab removed, moved to dedicated page */}

      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className={`text-center py-20 rounded-xl border ${theme.cardBorder} ${theme.cardBg}`}>
              <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700">No orders yet</h3>
              <p className={`${theme.mutedText} mt-1 mb-4`}>Your order history will appear here</p>
              <button
                onClick={() => setActiveTab('browse')}
                className="px-6 py-2.5 bg-[#47a263] text-white rounded-lg font-medium hover:bg-[#3d8c54] transition-all"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className={`p-6 rounded-xl border ${theme.cardBorder} ${theme.cardBg}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900">{order.orderNumber}</h3>
                    <p className="text-sm text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-700">{item.product.title}</span>
                        <span className="text-slate-400">x{item.quantity}</span>
                      </div>
                      <span className="font-medium">KES {(Number(item.unitPrice) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-200 mt-4 pt-4 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    {order.paymentMethod && (
                      <span className="capitalize">{order.paymentMethod.replace('_', ' ')}</span>
                    )}
                  </div>
                  <span className="font-bold text-lg text-[#47a263]">KES {order.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'my-products' && (
        <div className="space-y-4">
          {!isSeller ? (
            <div className={`text-center py-20 rounded-xl border ${theme.cardBorder} ${theme.cardBg}`}>
              <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700">Seller access required</h3>
              <p className={`${theme.mutedText} mt-1`}>Only teachers, tutors, and admins can list products</p>
            </div>
          ) : myProductsLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#47a263]/30 border-t-[#47a263] rounded-full animate-spin" />
            </div>
          ) : myProducts.length === 0 ? (
            <div className={`text-center py-20 rounded-xl border ${theme.cardBorder} ${theme.cardBg}`}>
              <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700">No products yet</h3>
              <p className={`${theme.mutedText} mt-1 mb-4`}>Start by adding your first product</p>
              <button
                onClick={() => setShowAddProduct(true)}
                className="px-6 py-2.5 bg-[#47a263] text-white rounded-lg font-medium hover:bg-[#3d8c54] transition-all"
              >
                <Plus className="w-4 h-4 inline mr-1" />Add Product
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myProducts.map((product) => {
                const TypeIcon = getProductTypeIcon(product.productType);
                return (
                  <div key={product.id} className={`p-4 rounded-xl border ${theme.cardBorder} ${theme.cardBg} flex items-center gap-4 hover:shadow-md transition-all`}>
                    <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {product.thumbnailUrl ? (
                        <img src={product.thumbnailUrl} alt={product.title} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <TypeIcon className="w-8 h-8 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900 truncate">{product.title}</h3>
                        {product.isFeatured && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded">Featured</span>}
                        <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                          product.status === 'published' ? 'bg-green-100 text-green-700' :
                          product.status === 'draft' ? 'bg-slate-100 text-slate-600' :
                          'bg-red-100 text-red-700'
                        }`}>{product.status}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                        <span>KES {Number(product.price).toFixed(2)}</span>
                        <span className="text-slate-300">|</span>
                        <span>{product.salesCount || 0} sold</span>
                        <span className="text-slate-300">|</span>
                        <span>Stock: {product.stock}</span>
                        {product.grade && <><span className="text-slate-300">|</span><span>Grade {product.grade}</span></>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingProduct(product);
                          setEditForm({
                            title: product.title,
                            description: product.description || '',
                            productType: product.productType,
                            category: product.category,
                            price: product.price,
                            originalPrice: product.originalPrice || 0,
                            stock: product.stock,
                            grade: product.grade || 0,
                            subject: product.subject || '',
                            publisher: product.publisher || '',
                            tags: (product.tags || []).join(', '),
                            thumbnailUrl: product.thumbnailUrl || '',
                            images: (product.images || []).join(', '),
                            variants: product.variants || [],
                            isFeatured: product.isFeatured,
                            status: product.status,
                          });
                          setShowEditProduct(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setDeletingProduct(product);
                          setShowDeleteConfirm(true);
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showProductModal && selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowProductModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative h-64 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center rounded-t-2xl">
                {selectedProduct.thumbnailUrl ? (
                  <img src={selectedProduct.thumbnailUrl} alt={selectedProduct.title} className="w-full h-full object-cover rounded-t-2xl" />
                ) : (
                  <BookOpen className="w-24 h-24 text-slate-400" />
                )}
                <button
                  onClick={() => setShowProductModal(false)}
                  className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-slate-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-500 capitalize">{selectedProduct.productType.replace('_', ' ')}</span>
                  <span className="text-slate-300">|</span>
                  <span className="text-sm text-slate-500 capitalize">{selectedProduct.category.replace('_', ' ')}</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900">{selectedProduct.title}</h2>
                {selectedProduct.description && (
                  <p className="text-slate-600">{selectedProduct.description}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {selectedProduct.grade && (
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-sm rounded-full">Grade {selectedProduct.grade}</span>
                  )}
                  {selectedProduct.subject && (
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-sm rounded-full">{selectedProduct.subject}</span>
                  )}
                  {selectedProduct.publisher && (
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-sm rounded-full">{selectedProduct.publisher}</span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                    <span className="font-medium">{selectedProduct.rating || 'N/A'}</span>
                    <span className="text-slate-400">({selectedProduct.reviewCount} reviews)</span>
                  </div>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-500">{selectedProduct.salesCount} sold</span>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                  <span className="text-3xl font-bold text-[#47a263]">KES {Number(selectedProduct.price || 0).toFixed(2)}</span>
                  {selectedProduct.originalPrice && selectedProduct.originalPrice > selectedProduct.price && (
                    <span className="text-lg text-slate-400 line-through">KES {Number(selectedProduct.originalPrice || 0).toFixed(2)}</span>
                  )}
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => { addToCart(selectedProduct.id); setShowProductModal(false); }}
                    className="flex-1 py-3 bg-[#47a263] text-white rounded-xl font-bold hover:bg-[#3d8c54] transition-all flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Add to Cart
                  </button>
                  <button
                    onClick={() => setShowProductModal(false)}
                    className={`px-6 py-3 border ${theme.cardBorder} rounded-xl font-medium hover:bg-slate-50 transition-all`}
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddProduct(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Add Product</h2>
                  <button onClick={() => setShowAddProduct(false)} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4">
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Title *</label><input type="text" value={productForm.title} onChange={(e) => setProductForm({ ...productForm, title: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#47a263]/30" placeholder="Grade 4 Mathematics Textbook" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Description</label><textarea value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#47a263]/30" placeholder="Detailed description..." /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Product Type *</label><select value={productForm.productType} onChange={(e) => setProductForm({ ...productForm, productType: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#47a263]/30">{PRODUCT_TYPES.filter((t) => t.value !== 'all').map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Category *</label><select value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#47a263]/30">{CATEGORIES.filter((c) => c.value !== 'all').map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Price (KES) *</label><input type="number" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#47a263]/30" placeholder="499.99" /></div>
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Original Price (optional)</label><input type="number" value={productForm.originalPrice || ''} onChange={(e) => setProductForm({ ...productForm, originalPrice: Number(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#47a263]/30" placeholder="699.99" /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Stock</label><input type="number" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#47a263]/30" /></div>
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Grade</label><select value={productForm.grade} onChange={(e) => setProductForm({ ...productForm, grade: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#47a263]/30"><option value={0}>All Grades</option>{GRADES.map((g) => <option key={g} value={g}>Grade {g}</option>)}</select></div>
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Subject</label><input type="text" value={productForm.subject} onChange={(e) => setProductForm({ ...productForm, subject: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#47a263]/30" placeholder="Mathematics" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Publisher</label><input type="text" value={productForm.publisher} onChange={(e) => setProductForm({ ...productForm, publisher: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#47a263]/30" placeholder="KLB Publishers" /></div>
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Tags (comma-separated)</label><input type="text" value={productForm.tags} onChange={(e) => setProductForm({ ...productForm, tags: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#47a263]/30" placeholder="math, grade4, cbc" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Gallery Images (comma-separated URLs)</label>
                      <div className="flex gap-2">
                        <input type="text" value={productForm.images} onChange={(e) => setProductForm({ ...productForm, images: e.target.value })} className="flex-1 px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#47a263]/30" placeholder="https://..., https://..." />
                        <label className="cursor-pointer px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 flex items-center gap-2 text-sm font-medium text-slate-700 transition-colors">
                          {uploadingGallery ? <Loader2 className="w-4 h-4 animate-spin text-slate-500" /> : <Upload className="w-4 h-4 text-slate-500" />}
                          Upload
                          <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => uploadGalleryImages(e.target.files, (urls) => setProductForm({ ...productForm, images: productForm.images ? `${productForm.images}, ${urls.join(', ')}` : urls.join(', ') }))} disabled={uploadingGallery} />
                        </label>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <ProductVariantEditor
                        value={productForm.variants}
                        onChange={(variants) => setProductForm({ ...productForm, variants })}
                      />
                    </div>
                  </div>
                  {/* Thumbnail Image */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Product Thumbnail</label>
                    {/* Mode tabs */}
                    <div className="flex gap-1 p-1 bg-slate-100 rounded-lg mb-3">
                      <button
                        type="button"
                        onClick={() => { setImageUploadMode('url'); setImageFile(null); setImagePreview(''); }}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                          imageUploadMode === 'url'
                            ? 'bg-white text-slate-800 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        <LinkIcon className="w-3.5 h-3.5" /> Image URL
                      </button>
                      <button
                        type="button"
                        onClick={() => { setImageUploadMode('upload'); }}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                          imageUploadMode === 'upload'
                            ? 'bg-white text-slate-800 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" /> Upload File
                      </button>
                    </div>

                    {imageUploadMode === 'url' ? (
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            value={productForm.thumbnailUrl}
                            onChange={(e) => setProductForm({ ...productForm, thumbnailUrl: e.target.value })}
                            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#47a263]/30 text-sm"
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>
                        {productForm.thumbnailUrl && (
                          <img
                            src={productForm.thumbnailUrl}
                            alt="Preview"
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        )}
                      </div>
                    ) : (
                      <div>
                        <input
                          ref={imageInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          className="hidden"
                          onChange={(e) => { if (e.target.files?.[0]) handleImageFileSelect(e.target.files[0]); }}
                        />
                        {imagePreview ? (
                          <div className="relative">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-full h-36 object-cover rounded-xl border border-slate-200"
                            />
                            <button
                              type="button"
                              onClick={() => { setImageFile(null); setImagePreview(''); if (imageInputRef.current) imageInputRef.current.value = ''; }}
                              className="absolute top-2 right-2 p-1 bg-white rounded-full shadow border border-slate-200 hover:bg-slate-50"
                            >
                              <X className="w-3.5 h-3.5 text-slate-600" />
                            </button>
                            <span className="absolute bottom-2 left-2 text-xs bg-black/50 text-white px-2 py-0.5 rounded-full">{imageFile?.name}</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => imageInputRef.current?.click()}
                            className="w-full border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center gap-2 hover:border-[#47a263] hover:bg-[#47a263]/5 transition-all group"
                          >
                            <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-[#47a263]/10 flex items-center justify-center transition-all">
                              <ImagePlus className="w-5 h-5 text-slate-400 group-hover:text-[#47a263]" />
                            </div>
                            <p className="text-sm font-medium text-slate-600 group-hover:text-[#47a263]">Click to select an image</p>
                            <p className="text-xs text-slate-400">JPG, PNG, GIF, WebP up to 5MB</p>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3 pt-4 border-t border-slate-200">
                    <button
                      onClick={createProduct}
                      disabled={creatingProduct || uploadingImage}
                      className="flex-1 py-3 bg-[#47a263] text-white rounded-xl font-bold hover:bg-[#3d8c54] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {(creatingProduct || uploadingImage) ? (
                        <><Loader2 className="w-5 h-5 animate-spin" />{uploadingImage ? 'Uploading image...' : 'Publishing...'}</>
                      ) : (
                        <><CheckCircle className="w-5 h-5" />Publish Product</>
                      )}
                    </button>
                    <button onClick={() => setShowAddProduct(false)} className="px-6 py-3 border border-slate-200 rounded-xl font-medium hover:bg-slate-50">Cancel</button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditProduct && editingProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowEditProduct(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Edit Product</h2>
                  <button onClick={() => setShowEditProduct(false)} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4">
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Title *</label><input type="text" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#47a263]/30" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Description</label><textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#47a263]/30" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Product Type *</label><select value={editForm.productType} onChange={(e) => setEditForm({ ...editForm, productType: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#47a263]/30">{PRODUCT_TYPES.filter((t) => t.value !== 'all').map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Category *</label><select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#47a263]/30">{CATEGORIES.filter((c) => c.value !== 'all').map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Price (KES) *</label><input type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#47a263]/30" /></div>
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Original Price</label><input type="number" value={editForm.originalPrice || ''} onChange={(e) => setEditForm({ ...editForm, originalPrice: Number(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#47a263]/30" /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Stock</label><input type="number" value={editForm.stock} onChange={(e) => setEditForm({ ...editForm, stock: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#47a263]/30" /></div>
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Grade</label><select value={editForm.grade} onChange={(e) => setEditForm({ ...editForm, grade: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#47a263]/30"><option value={0}>All Grades</option>{GRADES.map((g) => <option key={g} value={g}>Grade {g}</option>)}</select></div>
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Subject</label><input type="text" value={editForm.subject} onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#47a263]/30" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Publisher</label><input type="text" value={editForm.publisher} onChange={(e) => setEditForm({ ...editForm, publisher: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#47a263]/30" /></div>
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Tags (comma-separated)</label><input type="text" value={editForm.tags} onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#47a263]/30" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Gallery Images (comma-separated URLs)</label>
                      <div className="flex gap-2">
                        <input type="text" value={editForm.images} onChange={(e) => setEditForm({ ...editForm, images: e.target.value })} className="flex-1 px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#47a263]/30" placeholder="https://..., https://..." />
                        <label className="cursor-pointer px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 flex items-center gap-2 text-sm font-medium text-slate-700 transition-colors">
                          {uploadingGallery ? <Loader2 className="w-4 h-4 animate-spin text-slate-500" /> : <Upload className="w-4 h-4 text-slate-500" />}
                          Upload
                          <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => uploadGalleryImages(e.target.files, (urls) => setEditForm({ ...editForm, images: editForm.images ? `${editForm.images}, ${urls.join(', ')}` : urls.join(', ') }))} disabled={uploadingGallery} />
                        </label>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <ProductVariantEditor
                        value={editForm.variants}
                        onChange={(variants) => setEditForm({ ...editForm, variants })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Status</label><select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#47a263]/30"><option value="published">Published</option><option value="draft">Draft</option><option value="archived">Archived</option></select></div>
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Featured</label><div className="flex items-center h-10"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={editForm.isFeatured} onChange={(e) => setEditForm({ ...editForm, isFeatured: e.target.checked })} className="w-4 h-4 text-[#47a263] rounded border-slate-300 focus:ring-[#47a263]" /><span className="text-sm text-slate-600">Show as featured product</span></label></div></div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Product Thumbnail</label>
                    <div className="flex gap-1 p-1 bg-slate-100 rounded-lg mb-3">
                      <button
                        type="button"
                        onClick={() => { setEditImageMode('url'); setEditImageFile(null); setEditImagePreview(''); }}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                          editImageMode === 'url'
                            ? 'bg-white text-slate-800 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        <LinkIcon className="w-3.5 h-3.5" /> Image URL
                      </button>
                      <button
                        type="button"
                        onClick={() => { setEditImageMode('upload'); }}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                          editImageMode === 'upload'
                            ? 'bg-white text-slate-800 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" /> Upload File
                      </button>
                    </div>

                    {editImageMode === 'url' ? (
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            value={editForm.thumbnailUrl}
                            onChange={(e) => setEditForm({ ...editForm, thumbnailUrl: e.target.value })}
                            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#47a263]/30 text-sm"
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>
                        {editingProduct?.thumbnailUrl && !editImageFile && (
                          <img
                            src={editingProduct.thumbnailUrl}
                            alt="Current"
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        )}
                      </div>
                    ) : (
                      <div>
                        <input
                          ref={editImageInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          className="hidden"
                          onChange={(e) => { if (e.target.files?.[0]) handleEditImageFileSelect(e.target.files[0]); }}
                        />
                        {editImagePreview ? (
                          <div className="relative">
                            <img
                              src={editImagePreview}
                              alt="Preview"
                              className="w-full h-36 object-cover rounded-xl border border-slate-200"
                            />
                            <button
                              type="button"
                              onClick={() => { setEditImageFile(null); setEditImagePreview(''); if (editImageInputRef.current) editImageInputRef.current.value = ''; }}
                              className="absolute top-2 right-2 p-1 bg-white rounded-full shadow border border-slate-200 hover:bg-slate-50"
                            >
                              <X className="w-3.5 h-3.5 text-slate-600" />
                            </button>
                            <span className="absolute bottom-2 left-2 text-xs bg-black/50 text-white px-2 py-0.5 rounded-full">{editImageFile?.name}</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => editImageInputRef.current?.click()}
                            className="w-full border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center gap-2 hover:border-[#47a263] hover:bg-[#47a263]/5 transition-all group"
                          >
                            <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-[#47a263]/10 flex items-center justify-center transition-all">
                              <ImagePlus className="w-5 h-5 text-slate-400 group-hover:text-[#47a263]" />
                            </div>
                            {editingProduct?.thumbnailUrl ? (
                              <>
                                <p className="text-sm font-medium text-slate-600">Click to replace image</p>
                                <img
                                  src={editingProduct.thumbnailUrl}
                                  alt="Current"
                                  className="h-16 object-contain rounded border border-slate-200 mt-1"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                              </>
                            ) : (
                              <>
                                <p className="text-sm font-medium text-slate-600 group-hover:text-[#47a263]">Click to select an image</p>
                                <p className="text-xs text-slate-400">JPG, PNG, GIF, WebP up to 5MB</p>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3 pt-4 border-t border-slate-200">
                    <button onClick={updateProduct} disabled={savingEdit} className="flex-1 py-3 bg-[#47a263] text-white rounded-xl font-bold hover:bg-[#3d8c54] disabled:opacity-50 flex items-center justify-center gap-2">
                      {savingEdit ? <><Loader2 className="w-5 h-5 animate-spin" />Saving...</> : <><CheckCircle className="w-5 h-5" />Save Changes</>}
                    </button>
                    <button onClick={() => setShowEditProduct(false)} className="px-6 py-3 border border-slate-200 rounded-xl font-medium hover:bg-slate-50">Cancel</button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteConfirm && deletingProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Delete Product</h2>
                <p className="text-slate-600">Are you sure you want to delete <strong>{deletingProduct.title}</strong>? This action cannot be undone.</p>
                <div className="flex gap-3 pt-2">
                  <button onClick={confirmDelete} disabled={deleting} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2">
                    {deleting ? <><Loader2 className="w-5 h-5 animate-spin" />Deleting...</> : <><Trash2 className="w-5 h-5" />Delete</>}
                  </button>
                  <button onClick={() => setShowDeleteConfirm(false)} disabled={deleting} className="flex-1 py-3 border border-slate-200 rounded-xl font-medium hover:bg-slate-50">Cancel</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
