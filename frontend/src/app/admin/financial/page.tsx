'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { getTheme } from '@/lib/theme';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, Users, Clock, CheckCircle,
  XCircle, Smartphone, Building, Filter, Eye, Search, RefreshCw, DollarSign,
  BarChart3, Activity, AlertCircle, ChevronRight, Loader2,
} from 'lucide-react';

interface FinancialStats {
  totalPlatformCommission: number;
  totalEarnings: number;
  totalWithdrawn: number;
  totalPending: number;
  totalAvailable: number;
  totalWallets: number;
  totalTransactions: number;
  pendingWithdrawalsCount: number;
  pendingWithdrawalsAmount: number;
  completedWithdrawalsCount: number;
  withdrawalByMethod: { m_pesa: number; bank_transfer: number };
  monthlyRevenue: Record<string, number>;
}

interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  fee: number;
  netAmount: number;
  method: string;
  status: string;
  payoutDetails: Record<string, any>;
  notes: string | null;
  rejectionReason: string | null;
  reference: string | null;
  createdAt: string;
  processedAt: string | null;
  user: { id: string; firstName: string; lastName: string; email: string; role: string };
  processor: { firstName: string; lastName: string } | null;
}

interface WalletData {
  id: string;
  userId: string;
  availableBalance: number;
  pendingBalance: number;
  totalEarnings: number;
  totalWithdrawn: number;
  user: { id: string; firstName: string; lastName: string; email: string; role: string };
}

export default function AdminFinancialPage() {
  const { user } = useAuthStore();
  const theme = getTheme(user?.role || 'super_admin', false);
  const [isMounted, setIsMounted] = useState(false);

  const [activeTab, setActiveTab] = useState<'overview' | 'withdrawals' | 'wallets'>('overview');
  const [stats, setStats] = useState<FinancialStats | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [withdrawalFilter, setWithdrawalFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedWallet, setSelectedWallet] = useState<WalletData | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  const [showProcessModal, setShowProcessModal] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [processAction, setProcessAction] = useState<'approve' | 'reject'>('approve');
  const [processNotes, setProcessNotes] = useState('');
  const [processReference, setProcessReference] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);
  useEffect(() => {
    if (isMounted) {
      loadData();
    }
  }, [isMounted, activeTab, withdrawalFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, withdrawalsRes, walletsRes] = await Promise.all([
        api.get('/financial/admin/stats'),
        api.get('/financial/admin/withdrawals'),
        api.get('/financial/admin/wallets'),
      ]);
      setStats(statsRes.data);
      setWithdrawals(withdrawalsRes.data);
      setWallets(walletsRes.data);
    } catch (err) {
      toast.error('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  const processWithdrawal = async () => {
    if (!selectedWithdrawal) return;
    setProcessing(true);
    try {
      await api.put(`/financial/admin/withdrawals/${selectedWithdrawal.id}/process`, {
        status: processAction === 'approve' ? 'completed' : 'rejected',
        notes: processNotes,
        rejectionReason: processAction === 'reject' ? processNotes : undefined,
        reference: processReference || undefined,
      });
      toast.success(`Withdrawal ${processAction === 'approve' ? 'approved' : 'rejected'}`);
      setShowProcessModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to process withdrawal');
    } finally {
      setProcessing(false);
    }
  };

  const adjustWalletBalance = async () => {
    if (!selectedWallet || !adjustAmount || !adjustReason) return;
    setAdjusting(true);
    try {
      await api.put(`/financial/admin/wallets/${selectedWallet.userId}/adjust`, {
        amount: Number(adjustAmount),
        reason: adjustReason,
      });
      toast.success('Balance adjusted');
      setShowWalletModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to adjust balance');
    } finally {
      setAdjusting(false);
    }
  };

  const filteredWithdrawals = withdrawals.filter((w) => {
    if (withdrawalFilter !== 'all' && w.status !== withdrawalFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = `${w.user.firstName} ${w.user.lastName}`.toLowerCase();
      return name.includes(q) || w.user.email.toLowerCase().includes(q) || w.id.includes(q);
    }
    return true;
  });

  const formatCurrency = (amount: number) => `KES ${amount.toFixed(2)}`;
  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

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
          <h1 className="text-3xl font-bold text-slate-900">Financial Oversight</h1>
          <p className={`${theme.mutedText} mt-1`}>Platform revenue, withdrawals, and wallet management</p>
        </div>
        <button onClick={loadData} className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${theme.cardBorder} bg-white hover:bg-slate-50`}>
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {[
          { key: 'overview', label: 'Overview', icon: BarChart3 },
          { key: 'withdrawals', label: `Withdrawals (${stats?.pendingWithdrawalsCount || 0} pending)`, icon: Clock },
          { key: 'wallets', label: `Wallets (${stats?.totalWallets || 0})`, icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                activeTab === tab.key ? 'border-[#47a263] text-[#47a263]' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Platform Revenue', value: formatCurrency(stats.totalPlatformCommission), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Total Earnings (Users)', value: formatCurrency(stats.totalEarnings), icon: ArrowUpRight, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Total Withdrawn', value: formatCurrency(stats.totalWithdrawn), icon: ArrowDownRight, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Pending Withdrawals', value: formatCurrency(stats.pendingWithdrawalsAmount), icon: Clock, color: 'text-red-600', bg: 'bg-red-50' },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`p-6 rounded-xl border ${theme.cardBorder} ${theme.cardBg}`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-lg ${stat.bg}`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 mt-4">{stat.value}</p>
                  <p className={`text-sm ${theme.mutedText} mt-1`}>{stat.label}</p>
                </motion.div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`p-6 rounded-xl border ${theme.cardBorder} ${theme.cardBg}`}>
              <h3 className="text-lg font-bold text-slate-900 mb-4">Monthly Revenue</h3>
              {Object.keys(stats.monthlyRevenue).length === 0 ? (
                <p className={`${theme.mutedText} text-center py-8`}>No revenue data yet</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(stats.monthlyRevenue)
                    .sort(([a], [b]) => b.localeCompare(a))
                    .slice(0, 6)
                    .map(([month, amount]) => (
                      <div key={month} className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">{month}</span>
                        <span className="font-bold text-[#47a263]">{formatCurrency(amount)}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className={`p-6 rounded-xl border ${theme.cardBorder} ${theme.cardBg}`}>
              <h3 className="text-lg font-bold text-slate-900 mb-4">Withdrawal Methods</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-green-600" />
                    <span className="font-medium">M-Pesa</span>
                  </div>
                  <span className="text-lg font-bold">{stats.withdrawalByMethod.m_pesa}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Building className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">Bank Transfer</span>
                  </div>
                  <span className="text-lg font-bold">{stats.withdrawalByMethod.bank_transfer}</span>
                </div>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-xl border ${theme.cardBorder} ${theme.cardBg}`}>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Platform Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Wallets', value: stats.totalWallets },
                { label: 'Total Transactions', value: stats.totalTransactions },
                { label: 'Available Balance (All)', value: formatCurrency(stats.totalAvailable) },
                { label: 'Pending Balance (All)', value: formatCurrency(stats.totalPending) },
              ].map((item, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500">{item.label}</p>
                  <p className="text-xl font-bold text-slate-900 mt-1">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'withdrawals' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${theme.cardBorder} bg-white focus:outline-none focus:ring-2 focus:ring-[#47a263]/30`}
              />
            </div>
            <select
              value={withdrawalFilter}
              onChange={(e) => setWithdrawalFilter(e.target.value)}
              className={`px-4 py-2.5 rounded-lg border ${theme.cardBorder} bg-white focus:outline-none focus:ring-2 focus:ring-[#47a263]/30`}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {filteredWithdrawals.length === 0 ? (
            <div className={`text-center py-20 rounded-xl border ${theme.cardBorder} ${theme.cardBg}`}>
              <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700">No withdrawals found</h3>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredWithdrawals.map((w) => (
                <div key={w.id} className={`p-4 rounded-xl border ${theme.cardBorder} ${theme.cardBg}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-slate-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{w.user.firstName} {w.user.lastName}</p>
                        <p className="text-sm text-slate-500">{w.user.email} • {w.user.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        w.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        w.status === 'completed' ? 'bg-green-100 text-green-700' :
                        w.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                      </span>
                      {w.status === 'pending' && (
                        <button
                          onClick={() => { setSelectedWithdrawal(w); setShowProcessModal(true); }}
                          className="px-3 py-1.5 bg-[#47a263] text-white text-sm rounded-lg hover:bg-[#3d8c54]"
                        >
                          Process
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-100">
                    <div>
                      <p className="text-xs text-slate-500">Amount</p>
                      <p className="font-bold text-slate-900">{formatCurrency(w.amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Fee</p>
                      <p className="font-medium text-slate-700">{formatCurrency(w.fee)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Net Payout</p>
                      <p className="font-bold text-[#47a263]">{formatCurrency(w.netAmount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Method</p>
                      <div className="flex items-center gap-1">
                        {w.method === 'm_pesa' ? <Smartphone className="w-3 h-3" /> : <Building className="w-3 h-3" />}
                        <p className="font-medium text-slate-700 capitalize">{w.method.replace('_', ' ')}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
                    <span>Requested: {formatDate(w.createdAt)}</span>
                    {w.reference && <span>Ref: {w.reference}</span>}
                    {w.processor && <span>Processed by: {w.processor.firstName} {w.processor.lastName}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'wallets' && (
        <div className="space-y-4">
          {wallets.length === 0 ? (
            <div className={`text-center py-20 rounded-xl border ${theme.cardBorder} ${theme.cardBg}`}>
              <Wallet className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700">No wallets found</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {wallets.map((w) => (
                <div key={w.id} className={`p-4 rounded-xl border ${theme.cardBorder} ${theme.cardBg} hover:shadow-md transition-all`}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-slate-900">{w.user.firstName} {w.user.lastName}</p>
                      <p className="text-xs text-slate-500">{w.user.role}</p>
                    </div>
                    <button
                      onClick={() => { setSelectedWallet(w); setShowWalletModal(true); }}
                      className="p-2 hover:bg-slate-100 rounded-lg"
                    >
                      <Eye className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Available</span>
                      <span className="font-bold text-[#47a263]">{formatCurrency(w.availableBalance)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Pending</span>
                      <span className="font-medium text-amber-600">{formatCurrency(w.pendingBalance)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Total Earned</span>
                      <span className="font-medium text-slate-700">{formatCurrency(w.totalEarnings)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Total Withdrawn</span>
                      <span className="font-medium text-slate-700">{formatCurrency(w.totalWithdrawn)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showProcessModal && selectedWithdrawal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowProcessModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Process Withdrawal</h3>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500">User</p>
                  <p className="font-semibold">{selectedWithdrawal.user.firstName} {selectedWithdrawal.user.lastName}</p>
                  <p className="text-sm text-slate-500 mt-1">Amount: <span className="font-bold text-slate-900">{formatCurrency(selectedWithdrawal.amount)}</span></p>
                  <p className="text-sm text-slate-500">Net Payout: <span className="font-bold text-[#47a263]">{formatCurrency(selectedWithdrawal.netAmount)}</span></p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setProcessAction('approve')} className={`flex-1 py-2 rounded-lg font-medium transition-all ${processAction === 'approve' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    Approve
                  </button>
                  <button onClick={() => setProcessAction('reject')} className={`flex-1 py-2 rounded-lg font-medium transition-all ${processAction === 'reject' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    Reject
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{processAction === 'approve' ? 'Notes' : 'Rejection Reason'}</label>
                  <textarea value={processNotes} onChange={(e) => setProcessNotes(e.target.value)} rows={3} className={`w-full px-3 py-2 rounded-lg border ${theme.cardBorder} focus:outline-none focus:ring-2 focus:ring-[#47a263]/30`} placeholder={processAction === 'approve' ? 'Payment sent via M-Pesa B2C...' : 'Reason for rejection...'} />
                </div>
                {processAction === 'approve' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Transaction Reference</label>
                    <input type="text" value={processReference} onChange={(e) => setProcessReference(e.target.value)} className={`w-full px-3 py-2 rounded-lg border ${theme.cardBorder} focus:outline-none focus:ring-2 focus:ring-[#47a263]/30`} placeholder="QJK7XXXXXX" />
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <button onClick={processWithdrawal} disabled={processing || !processNotes} className="flex-1 py-2.5 bg-[#47a263] text-white rounded-lg font-medium hover:bg-[#3d8c54] disabled:opacity-50 flex items-center justify-center gap-2">
                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    {processAction === 'approve' ? 'Approve' : 'Reject'}
                  </button>
                  <button onClick={() => setShowProcessModal(false)} className={`px-4 py-2.5 border ${theme.cardBorder} rounded-lg hover:bg-slate-50`}>Cancel</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWalletModal && selectedWallet && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowWalletModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Wallet Details</h3>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="font-semibold">{selectedWallet.user.firstName} {selectedWallet.user.lastName}</p>
                  <p className="text-sm text-slate-500">{selectedWallet.user.email} • {selectedWallet.user.role}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Adjust Balance (+/-)</label>
                  <input type="number" value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)} className={`w-full px-3 py-2 rounded-lg border ${theme.cardBorder} focus:outline-none focus:ring-2 focus:ring-[#47a263]/30`} placeholder="e.g., 500 or -200" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
                  <textarea value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} rows={2} className={`w-full px-3 py-2 rounded-lg border ${theme.cardBorder} focus:outline-none focus:ring-2 focus:ring-[#47a263]/30`} placeholder="Reason for adjustment..." />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={adjustWalletBalance} disabled={adjusting || !adjustAmount || !adjustReason} className="flex-1 py-2.5 bg-[#47a263] text-white rounded-lg font-medium hover:bg-[#3d8c54] disabled:opacity-50 flex items-center justify-center gap-2">
                    {adjusting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Adjust
                  </button>
                  <button onClick={() => setShowWalletModal(false)} className={`px-4 py-2.5 border ${theme.cardBorder} rounded-lg hover:bg-slate-50`}>Close</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
