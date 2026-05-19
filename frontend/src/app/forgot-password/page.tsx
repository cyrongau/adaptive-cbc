'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { GraduationCap, ArrowRight, Loader2, Sparkles, Mail, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { forgotPassword, loading, error, clearError, initialize } = useAuthStore();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    initialize();
    clearError();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailOrPhone.trim()) {
      toast.error('Please enter your registered email or phone number');
      return;
    }

    const success = await forgotPassword(emailOrPhone);
    if (success) {
      setIsSubmitted(true);
      toast.success('Recovery code generated and sent.');
    } else {
      toast.error(error || 'Failed to request reset code');
    }
  };

  return (
    <div className="min-h-screen bg-surface-low grid lg:grid-cols-12 font-sans overflow-hidden">
      {/* Left Column: Visual Brand Banner */}
      <div className="hidden lg:flex lg:col-span-5 relative bg-primary items-center justify-center p-12 overflow-hidden">
        {/* Modern animated overlay grids & spheres */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d6832] via-[#1c8445] to-[#0b5327] -z-10 animate-gradient-shift" />
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-white/5 blur-3xl animate-pulse" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
        
        {/* Dynamic decorative visual particles */}
        <div className="absolute top-[20%] left-[10%] w-3 h-3 rounded-full bg-tertiary opacity-60 animate-bounce delay-100" />
        <div className="absolute bottom-[20%] right-[15%] w-4 h-4 rounded-full bg-secondary opacity-40 animate-bounce delay-300" />

        <div className="relative text-left max-w-md space-y-8 z-10">
          <div className="inline-flex items-center space-x-3">
            <img src="/logo.png" alt="Adaptive CBC" className="h-10 w-auto" />
            <span className="text-2xl font-bold tracking-tight text-white">
              Adaptive<span className="text-tertiary-on-primary">CBC</span>
            </span>
          </div>

          <div className="space-y-4">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight"
            >
              Account Recovery Options
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-base text-white/80 leading-relaxed font-semibold"
            >
              Securing parent and child data integrity. Follow the prompt to verify your identity and immediately set a secure new password.
            </motion.p>
          </div>

          {/* Interactive micro-badge */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="p-4 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-md flex items-start space-x-3.5 hover:bg-white/15 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-tertiary-on-primary" />
            </div>
            <div>
              <h4 className="text-white font-extrabold text-xs">2FA Shield Active</h4>
              <p className="text-[10px] text-white/60 font-semibold mt-0.5">Strict double layer verification enabled</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Column: Interaction Form Pane */}
      <div className="col-span-12 lg:col-span-7 flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-12 bg-white relative">
        <div className="absolute top-8 left-8 lg:left-12">
          <Link 
            href="/login" 
            className="text-xs text-gray-500 font-extrabold tracking-wider hover:text-primary uppercase flex items-center transition-colors"
          >
            ← Back to Login
          </Link>
        </div>

        <div className="max-w-md w-full mx-auto space-y-8">
          {/* Header block */}
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Forgot Password?
            </h2>
            <p className="text-sm text-gray-500 font-semibold leading-relaxed">
              Enter your registered email or phone number to receive a recovery code.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start space-x-3 text-red-700 text-xs font-semibold animate-shake">
              <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {isSubmitted ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 bg-primary/5 border border-primary/10 rounded-2xl space-y-4 text-center"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="font-extrabold text-gray-900 text-sm">Recovery Code Sent!</h3>
                <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                  We sent a 6-digit code to your email. Enter it below to reset your password.
                </p>
              </div>
              <button 
                onClick={() => router.push(`/reset-password?email=${encodeURIComponent(emailOrPhone)}`)}
                className="w-full bg-primary text-white font-extrabold text-xs py-3.5 rounded-xl hover:bg-primary/95 transition-all shadow-md active:scale-95 uppercase tracking-wider block"
              >
                Go to Reset Password
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="emailOrPhone" className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Registered Email or Phone Number
                </label>
                <div className="relative flex items-center bg-gray-50 border border-gray-100 rounded-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:bg-white focus-within:border-primary transition-all">
                  <Mail className="w-5 h-5 text-gray-400 absolute left-4 shrink-0" />
                  <input 
                    id="emailOrPhone"
                    type="text" 
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    placeholder="parent@adaptivecbc.com"
                    className="w-full bg-transparent outline-none pl-12 pr-4 py-4 text-sm font-semibold text-gray-800 placeholder-gray-400"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-primary text-white font-extrabold text-sm py-4 rounded-xl hover:bg-primary/95 transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center uppercase tracking-wider disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating recovery token...
                  </>
                ) : (
                  <>
                    Send Recovery Code
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </form>
          )}

          <p className="text-center text-sm font-semibold text-gray-500 mt-8">
            Remembered your credentials?{' '}
            <Link href="/login" className="text-primary hover:underline font-extrabold">
              Log In Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
