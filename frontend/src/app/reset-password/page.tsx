'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle2, Loader2, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { resetPassword, loading, error, clearError, resetEmail } = useAuthStore();

  const [step, setStep] = useState<'code' | 'password'>('code');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    if (emailParam) setEmail(emailParam);
    else if (resetEmail) setEmail(resetEmail);
  }, [resetEmail]);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }
    setStep('password');
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    const success = await resetPassword(code, newPassword);
    if (success) {
      setSuccess(true);
      toast.success('Password reset successfully!');
    } else {
      toast.error(error || 'Failed to reset password');
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#006a34] via-[#1c8445] to-[#0b5327] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl text-center"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Password Reset!</h1>
          <p className="text-slate-500 mb-8">Your password has been reset successfully. You can now log in with your new password.</p>
          <Link
            href="/login"
            className="block w-full px-6 py-3 bg-[#47a263] text-white font-semibold rounded-xl hover:bg-[#3d8b55] transition-all"
          >
            Go to Login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#006a34] via-[#1c8445] to-[#0b5327] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl"
      >
        {/* Back to Login */}
        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </Link>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#47a263]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            {step === 'code' ? <KeyRound className="w-8 h-8 text-[#47a263]" /> : <Lock className="w-8 h-8 text-[#47a263]" />}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {step === 'code' ? 'Enter Reset Code' : 'Set New Password'}
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            {step === 'code'
              ? `We sent a 6-digit code to ${email || 'your email'}`
              : 'Create a strong password for your account'}
          </p>
        </div>

        {step === 'code' ? (
          <form onSubmit={handleVerifyCode} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Reset Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^a-fA-F0-9]/g, '').toUpperCase().slice(0, 6))}
                placeholder="A1B2C3"
                maxLength={6}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-[#47a263]/30 focus:border-[#47a263]"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full px-6 py-3 bg-[#47a263] text-white font-semibold rounded-xl hover:bg-[#3d8b55] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={async () => {
                  clearError();
                  await useAuthStore.getState().forgotPassword(email);
                  toast.success('Reset code resent!');
                }}
                className="text-sm text-[#47a263] font-semibold hover:underline"
              >
                Resend code
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#47a263]/30 focus:border-[#47a263]"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#47a263]/30 focus:border-[#47a263]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || newPassword.length < 8 || newPassword !== confirmPassword}
              className="w-full px-6 py-3 bg-[#47a263] text-white font-semibold rounded-xl hover:bg-[#3d8b55] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Lock className="w-4 h-4" /> Reset Password</>}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => { setStep('code'); clearError(); }}
                className="text-sm text-[#47a263] font-semibold hover:underline"
              >
                ← Back to code entry
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
