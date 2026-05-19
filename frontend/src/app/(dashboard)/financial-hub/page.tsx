'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { getTheme } from '@/lib/theme';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, Clock, CheckCircle,
  XCircle, Smartphone, Building, Plus, Loader2, DollarSign,
  BarChart3, Activity, Eye, CreditCard, Receipt, Filter,
} from 'lucide-react';

interface WalletData {
  id: string;
  availableBalance: number;
  pendingBalance: number;
  totalEarnings: number;
  totalWithdrawn: number;
  totalRefunded: number;
  mpesaDetails: { phoneNumber: string; accountName: string } | null;
  bankDetails: { bankName: string; branchName: string; accountNumber: string; accountName: string; swiftCode: string } | null;
}

interface Transaction {
  id: string;
  type: string;
  status: string;
  amount: number;
  platformCommission: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
  metadata: Record<string, any>;
}

interface WithdrawalRequest {
  id: string;
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
}

export default function FinancialHubPage() {
  const { user } = useAuthStore();
  const isCandidate = user?.role === 'student' && (Number(user?.grade) === 6 || Number(user?.grade) === 9);
  const theme = getTheme(user?.role || 'teacher', isCandidate);
  const [isMounted, setIsMounted] = useState(false);

  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'withdrawals' | 'settings'>('overview');
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalMethod, setWithdrawalMethod] = useState<'m_pesa' | 'bank_transfer'>('m_pesa');
  const [withdrawalNotes, setWithdrawalNotes] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  const [transactionFilter, setTransactionFilter] = useState('all');
  const [withdrawalFilter, setWithdrawalFilter] = useState('all');

  const [mpesaPhone, setMpesaPhone] = useState('');
  const [mpesaName, setMpesaName] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankBranch, setBankBranch] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankSwift, setBankSwift] = useState('');
  const [savingDetails, setSavingDetails] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);
  useEffect(() => {
    if (isMounted) {
      loadData();
    }
  }, [isMounted, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [walletRes, transactionsRes, withdrawalsRes] = await Promise.all([
        api.get('/financial/wallet'),
        api.get('/financial/transactions'),
        api.get('/financial/withdrawals'),
      ]);
      setWallet(walletRes.data);
      setTransactions(transactionsRes.data);
      setWithdrawals(withdrawalsRes.data);

      if (walletRes.data.mpesaDetails) {
        setMpesaPhone(walletRes.data.mpesaDetails.phoneNumber || '');
        setMpesaName(walletRes.data.mpesaDetails.accountName || '');
      }
      if (walletRes.data.bankDetails) {
        setBankName(walletRes.data.bankDetails.bankName || '');
        setBankBranch(walletRes.data.bankDetails.branchName || '');
        setBankAccount(walletRes.data.bankDetails.accountNumber || '');
        setBankAccountName(walletRes.data.bankDetails.accountName || '');
        setBankSwift(walletRes.data.bankDetails.swiftCode || '');
      }
    } catch (err) {
      toast.error('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  const requestWithdrawal = async () => {
    if (!withdrawalAmount || Number(withdrawalAmount) < 1000) {
      toast.error('Minimum withdrawal is KES 1,000');
      return;
    }
    setWithdrawing(true);
    try {
      await api.post('/financial/withdrawals', {
        amount: Number(withdrawalAmount),
        method: withdrawalMethod,
        notes: withdrawalNotes,
      });
      toast.success('Withdrawal request submitted');
      setShowWithdrawalForm(false);
      setWithdrawalAmount('');
      setWithdrawalNotes('');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to request withdrawal');
    } finally {
      setWithdrawing(false);
    }
  };

  const savePayoutDetails = async () => {
    setSavingDetails(true);
    try {
      const updates: any = {};
      if (mpesaPhone && mpesaName) {
        updates.mpesaDetails = { phoneNumber: mpesaPhone, accountName: mpesaName };
      }
      if (bankName && bankAccount) {
        updates.bankDetails = { bankName, branchName: bankBranch, accountNumber: bankAccount, accountName: bankAccountName, swiftCode: bankSwift };
      }
      await api.put('/financial/wallet/details', updates);
      toast.success('Payout details saved');
      loadData();
    } catch (err: any) {
      toast.error('Failed to save payout details');
    } finally {
      setSavingDetails(false);
    }
  };

  const formatCurrency = (amount: number) => `KES ${amount.toFixed(2)}`;
  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'sale_earning': return ArrowUpRight;
      case 'platform_commission': return ArrowDownRight;
      case 'withdrawal': return ArrowDownRight;
      case 'refund': return XCircle;
      case 'bonus': return TrendingUp;
      case 'adjustment': return Activity;
      default: return DollarSign;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'sale_earning': return 'text-green-600';
      case 'platform_commission': return 'text-red-600';
      case 'withdrawal': return 'text-amber-600';
      case 'refund': return 'text-red-600';
      case 'bonus': return 'text-blue-600';
      case 'adjustment': return 'text-purple-600';
      default: return 'text-slate-600';
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    if (transactionFilter !== 'all' && t.type !== transactionFilter) return false;
    return true;
  });

  const filteredWithdrawals = withdrawals.filter((w) => {
    if (withdrawalFilter !== 'all' && w.status !== withdrawalFilter) return false;
    return true;
  });

  if (!isMounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[#47a263]/30 border-t-[#47a263] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Financial Hub</h1>
        <p className={`${theme.mutedText} mt-1`}>Manage your earnings, withdrawals, and payout details</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {[
          { key: 'overview', label: 'Overview', icon: BarChart3 },
          { key: 'transactions', label: 'Transactions', icon: Receipt },
          { key: 'withdrawals', label: 'Withdrawals', icon: Clock },
          { key: 'settings', label: 'Payout Settings', icon: CreditCard },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                activeTab === tab.key ? `border-[#47a263] text-[#47a263]` : `border-transparent text-slate-500 hover:text-slate-700`
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'overview' && wallet && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Available Balance', value: formatCurrency(wallet.availableBalance), icon: Wallet, color: 'text-green-600', bg: 'bg-green-50', action: true },
              { label: 'Pending Balance', value: formatCurrency(wallet.pendingBalance), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Total Earnings', value: formatCurrency(wallet.totalEarnings), icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Total Withdrawn', value: formatCurrency(wallet.totalWithdrawn), icon: ArrowDownRight, color: 'text-purple-600', bg: 'bg-purple-50' },
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
                    {stat.action && (
                      <button
                        onClick={() => setShowWithdrawalForm(true)}
                        className="px-3 py-1.5 bg-[#47a263] text-white text-sm rounded-lg hover:bg-[#3d8c54] flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Withdraw
                      </button>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-slate-900 mt-4">{stat.value}</p>
                  <p className={`text-sm ${theme.mutedText} mt-1`}>{stat.label}</p>
                </motion.div>
              );
            })}
          </div>

          <div className={`p-6 rounded-xl border ${theme.cardBorder} ${theme.cardBg}`}>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Transactions</h3>
            {transactions.length === 0 ? (
              <p className={`${theme.mutedText} text-center py-8`}>No transactions yet. Start selling products or courses to earn!</p>
            ) : (
              <div className="space-y-3">
                {transactions.slice(0, 5).map((t) => {
                  const Icon = getTransactionIcon(t.type);
                  return (
                    <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-white`}>
                          <Icon className={`w-4 h-4 ${getTransactionColor(t.type)}`} />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{t.description}</p>
                          <p className="text-xs text-slate-400">{formatDate(t.createdAt)}</p>
                        </div>
                      </div>
                      <span className={`font-bold ${t.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {t.amount >= 0 ? '+' : ''}{formatCurrency(t.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className={`p-6 rounded-xl border ${theme.cardBorder} ${theme.cardBg}`}>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Withdrawals</h3>
            {withdrawals.length === 0 ? (
              <p className={`${theme.mutedText} text-center py-8`}>No withdrawal requests yet</p>
            ) : (
              <div className="space-y-3">
                {withdrawals.slice(0, 3).map((w) => (
                  <div key={w.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{formatCurrency(w.amount)} via {w.method.replace('_', ' ')}</p>
                      <p className="text-xs text-slate-400">{formatDate(w.createdAt)}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      w.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      w.status === 'completed' ? 'bg-green-100 text-green-700' :
                      w.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <select
              value={transactionFilter}
              onChange={(e) => setTransactionFilter(e.target.value)}
              className={`px-3 py-2 rounded-lg border ${theme.cardBorder} bg-white text-sm`}
            >
              <option value="all">All Types</option>
              <option value="sale_earning">Sale Earnings</option>
              <option value="platform_commission">Commission</option>
              <option value="withdrawal">Withdrawals</option>
              <option value="refund">Refunds</option>
              <option value="bonus">Bonus</option>
              <option value="adjustment">Adjustments</option>
            </select>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className={`text-center py-20 rounded-xl border ${theme.cardBorder} ${theme.cardBg}`}>
              <Receipt className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700">No transactions found</h3>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTransactions.map((t) => {
                const Icon = getTransactionIcon(t.type);
                return (
                  <div key={t.id} className={`p-4 rounded-xl border ${theme.cardBorder} ${theme.cardBg} flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-slate-50`}>
                        <Icon className={`w-5 h-5 ${getTransactionColor(t.type)}`} />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{t.description}</p>
                        <p className="text-xs text-slate-400">{formatDate(t.createdAt)}</p>
                        {t.metadata?.productTitle && (
                          <p className="text-xs text-slate-500">Product: {t.metadata.productTitle}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${t.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {t.amount >= 0 ? '+' : ''}{formatCurrency(t.amount)}
                      </p>
                      <p className={`text-xs ${
                        t.status === 'completed' ? 'text-green-600' :
                        t.status === 'pending' ? 'text-amber-600' :
                        t.status === 'reversed' ? 'text-red-600' :
                        'text-slate-400'
                      }`}>
                        {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'withdrawals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <select
              value={withdrawalFilter}
              onChange={(e) => setWithdrawalFilter(e.target.value)}
              className={`px-3 py-2 rounded-lg border ${theme.cardBorder} bg-white text-sm`}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
              <option value="failed">Failed</option>
            </select>
            <button
              onClick={() => setShowWithdrawalForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#47a263] text-white rounded-lg hover:bg-[#3d8c54]"
            >
              <Plus className="w-4 h-4" />
              New Withdrawal
            </button>
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
                    <div>
                      <p className="font-semibold text-slate-900">{formatCurrency(w.amount)}</p>
                      <p className="text-sm text-slate-500 capitalize">{w.method.replace('_', ' ')} • Net: {formatCurrency(w.netAmount)}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      w.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      w.status === 'completed' ? 'bg-green-100 text-green-700' :
                      w.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                    </span>
                  </div>
                  {w.rejectionReason && (
                    <p className="text-sm text-red-600 mt-2">Reason: {w.rejectionReason}</p>
                  )}
                  {w.reference && (
                    <p className="text-sm text-slate-500 mt-1">Reference: {w.reference}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-2">Requested: {formatDate(w.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className={`p-6 rounded-xl border ${theme.cardBorder} ${theme.cardBg}`}>
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-green-600" />
              M-Pesa Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                <input type="text" value={mpesaPhone} onChange={(e) => setMpesaPhone(e.target.value)} className={`w-full px-3 py-2 rounded-lg border ${theme.cardBorder} bg-white focus:outline-none focus:ring-2 focus:ring-[#47a263]/30`} placeholder="2547XXXXXXXX" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Account Name</label>
                <input type="text" value={mpesaName} onChange={(e) => setMpesaName(e.target.value)} className={`w-full px-3 py-2 rounded-lg border ${theme.cardBorder} bg-white focus:outline-none focus:ring-2 focus:ring-[#47a263]/30`} placeholder="John Doe" />
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-xl border ${theme.cardBorder} ${theme.cardBg}`}>
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              Bank Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bank Name</label>
                <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} className={`w-full px-3 py-2 rounded-lg border ${theme.cardBorder} bg-white focus:outline-none focus:ring-2 focus:ring-[#47a263]/30`} placeholder="Equity Bank" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Branch</label>
                <input type="text" value={bankBranch} onChange={(e) => setBankBranch(e.target.value)} className={`w-full px-3 py-2 rounded-lg border ${theme.cardBorder} bg-white focus:outline-none focus:ring-2 focus:ring-[#47a263]/30`} placeholder="Nairobi Branch" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Account Number</label>
                <input type="text" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} className={`w-full px-3 py-2 rounded-lg border ${theme.cardBorder} bg-white focus:outline-none focus:ring-2 focus:ring-[#47a263]/30`} placeholder="0123456789" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Account Name</label>
                <input type="text" value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} className={`w-full px-3 py-2 rounded-lg border ${theme.cardBorder} bg-white focus:outline-none focus:ring-2 focus:ring-[#47a263]/30`} placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">SWIFT Code</label>
                <input type="text" value={bankSwift} onChange={(e) => setBankSwift(e.target.value)} className={`w-full px-3 py-2 rounded-lg border ${theme.cardBorder} bg-white focus:outline-none focus:ring-2 focus:ring-[#47a263]/30`} placeholder="EQBLKENA" />
              </div>
            </div>
          </div>

          <button
            onClick={savePayoutDetails}
            disabled={savingDetails}
            className="px-6 py-2.5 bg-[#47a263] text-white rounded-lg font-medium hover:bg-[#3d8c54] disabled:opacity-50 flex items-center gap-2"
          >
            {savingDetails ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Save Payout Details
          </button>
        </div>
      )}

      <AnimatePresence>
        {showWithdrawalForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowWithdrawalForm(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Request Withdrawal</h3>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500">Available Balance</p>
                  <p className="text-2xl font-bold text-[#47a263]">{formatCurrency(wallet?.availableBalance || 0)}</p>
                  <p className="text-xs text-slate-400 mt-1">Minimum withdrawal: KES 1,000</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount (KES)</label>
                  <input type="number" value={withdrawalAmount} onChange={(e) => setWithdrawalAmount(e.target.value)} className={`w-full px-3 py-2 rounded-lg border ${theme.cardBorder} focus:outline-none focus:ring-2 focus:ring-[#47a263]/30`} placeholder="5000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Method</label>
                  <div className="flex gap-2">
                    <button onClick={() => setWithdrawalMethod('m_pesa')} className={`flex-1 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${withdrawalMethod === 'm_pesa' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Smartphone className="w-4 h-4" />
                      M-Pesa
                    </button>
                    <button onClick={() => setWithdrawalMethod('bank_transfer')} className={`flex-1 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${withdrawalMethod === 'bank_transfer' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Building className="w-4 h-4" />
                      Bank
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notes (optional)</label>
                  <textarea value={withdrawalNotes} onChange={(e) => setWithdrawalNotes(e.target.value)} rows={2} className={`w-full px-3 py-2 rounded-lg border ${theme.cardBorder} focus:outline-none focus:ring-2 focus:ring-[#47a263]/30`} placeholder="Any additional notes..." />
                </div>
                {withdrawalAmount && Number(withdrawalAmount) >= 1000 && (
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Withdrawal Fee (1%)</span>
                      <span className="font-medium">{formatCurrency(Number(withdrawalAmount) * 0.01)}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1 pt-2 border-t border-slate-200">
                      <span className="font-medium">You will receive</span>
                      <span className="font-bold text-[#47a263]">{formatCurrency(Number(withdrawalAmount) * 0.99)}</span>
                    </div>
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <button onClick={requestWithdrawal} disabled={withdrawing} className="flex-1 py-2.5 bg-[#47a263] text-white rounded-lg font-medium hover:bg-[#3d8c54] disabled:opacity-50 flex items-center justify-center gap-2">
                    {withdrawing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Submit Request
                  </button>
                  <button onClick={() => setShowWithdrawalForm(false)} className={`px-4 py-2.5 border ${theme.cardBorder} rounded-lg hover:bg-slate-50`}>Cancel</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
