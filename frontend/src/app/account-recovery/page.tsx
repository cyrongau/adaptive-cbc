'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { KeyRound, ArrowRight, Loader2, ShieldAlert, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

function AccountRecoveryForm() {
  const [step, setStep] = useState<'identifier' | 'otp' | 'done'>('identifier');
  const [identifier, setIdentifier] = useState('');
  const [recoveryId, setRecoveryId] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPin, setNewPin] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      toast.error('Enter your username or admission number');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/students/recovery/initiate', { identifier: identifier.trim() });
      setRecoveryId(res.data.recoveryId);
      setStep('otp');
      toast.success('OTP sent to your parent email!');
    } catch {
      setError('Failed to initiate recovery. Check your identifier.');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');
    const pinCode = newPin.join('');

    if (otpCode.length < 6) {
      toast.error('Enter the full OTP code');
      return;
    }
    if (pinCode.length < 4) {
      toast.error('Enter a 4-digit PIN');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.post('/students/recovery/complete', {
        recoveryId,
        otp: otpCode,
        newPin: pinCode,
      });
      setStep('done');
      toast.success('PIN reset successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP or expired request');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);
    if (value && index < 5) {
      const inputs = document.querySelectorAll<HTMLInputElement>('[data-recovery-otp]');
      inputs[index + 1]?.focus();
    }
  };

  const handlePinChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...newPin];
    updated[index] = value;
    setNewPin(updated);
    if (value && index < 3) {
      const inputs = document.querySelectorAll<HTMLInputElement>('[data-recovery-pin]');
      inputs[index + 1]?.focus();
    }
  };

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-surface-low flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">PIN Reset Complete</h1>
          <p className="text-sm text-gray-600">Your PIN has been reset. All trusted devices have been removed for security.</p>
          <Link href="/login" className="inline-flex items-center gap-2 text-primary font-bold hover:underline mt-4">
            Go to Login <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-low flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
            <KeyRound className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Account Recovery</h1>
          <p className="text-sm text-gray-500">
            {step === 'identifier' ? 'Enter your username or admission number to start PIN recovery.' : 'Enter the OTP sent to your parent and choose a new PIN.'}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-red-700 text-xs font-semibold">
            <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {step === 'identifier' ? (
          <form onSubmit={handleInitiate} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Username or Admission Number</label>
              <input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. john_doe_2024 or ADM-1257"
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-primary text-white font-extrabold text-sm py-4 rounded-xl hover:bg-primary/95 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <>Send Recovery Code <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        ) : (
          <form onSubmit={handleComplete} className="space-y-5">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 block">OTP Code</label>
              <div className="flex justify-center gap-2">
                {otp.map((digit, i) => (
                  <input key={i} data-recovery-otp type="tel" inputMode="numeric" maxLength={1}
                    value={digit} onChange={(e) => handleOtpChange(e.target.value, i)}
                    onKeyDown={(e) => { if (e.key === 'Backspace' && !digit && i > 0) { const inputs = document.querySelectorAll<HTMLInputElement>('[data-recovery-otp]'); inputs[i - 1]?.focus(); }}}
                    className="w-12 h-14 text-center text-xl font-extrabold bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none" />
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 block">New 4-digit PIN</label>
              <div className="flex justify-center gap-2">
                {newPin.map((digit, i) => (
                  <input key={i} data-recovery-pin type="tel" inputMode="numeric" maxLength={1}
                    value={digit} onChange={(e) => handlePinChange(e.target.value, i)}
                    onKeyDown={(e) => { if (e.key === 'Backspace' && !digit && i > 0) { const inputs = document.querySelectorAll<HTMLInputElement>('[data-recovery-pin]'); inputs[i - 1]?.focus(); }}}
                    className="w-14 h-14 text-center text-xl font-extrabold bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none" />
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-primary text-white font-extrabold text-sm py-4 rounded-xl hover:bg-primary/95 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Resetting...</> : <>Reset PIN <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500">
          <Link href="/login" className="text-primary font-bold hover:underline">Back to Login</Link>
        </p>
      </motion.div>
    </div>
  );
}

export default function AccountRecoveryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}>
      <AccountRecoveryForm />
    </Suspense>
  );
}
