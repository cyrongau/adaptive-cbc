'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { GraduationCap, ArrowRight, Loader2, Sparkles, ShieldCheck, ShieldAlert, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyOtp, loading, error, clearError, tempEmail, tempPhone, initialize } = useAuthStore();
  const [callbackUrl, setCallbackUrl] = useState<string | null>(null);
  
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
  const [resendTimer, setResendTimer] = useState(59);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<HTMLInputElement[]>([]);

  useEffect(() => {
    initialize();
    clearError();
    
    const cbUrl = searchParams.get('callbackUrl');
    if (cbUrl) {
      setCallbackUrl(decodeURIComponent(cbUrl));
    }

    // Redirect if no active temporary authentication session exists
    const token = localStorage.getItem('token');
    const tempAuth = useAuthStore.getState().tempAuthData;
    if (token) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const isAdmin = user?.role === 'super_admin' || user?.role === 'institution_admin';
      router.push(isAdmin ? '/admin/dashboard' : '/dashboard');
    } else if (!tempAuth) {
      toast.error('No verification session found. Please log in first.');
      router.push('/login');
    }
  }, [searchParams]);

  // Timer countdown hook
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleChange = (element: HTMLInputElement, index: number) => {
    const value = element.value.replace(/[^0-9]/g, '');
    if (!value) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-focus next input
    if (index < 5 && element.value) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      
      // Auto-focus previous input on backspace
      if (index > 0) {
        inputRefs.current[index - 1].focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').substring(0, 6);
    if (pasteData.length === 6) {
      const newOtp = pasteData.split('');
      setOtp(newOtp);
      inputRefs.current[5].focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = otp.join('');
    
    if (fullCode.length < 6) {
      toast.error('Please enter the full 6-digit verification code');
      return;
    }

    const success = await verifyOtp(fullCode);
    if (success) {
      toast.success('Two-Factor Authentication succeeded! Logging in...');
      
      if (callbackUrl) {
        router.push(callbackUrl);
        return;
      }
      
      const user = useAuthStore.getState().user;
      const isAdmin = user?.role === 'super_admin' || user?.role === 'institution_admin';
      const isParent = user?.role === 'parent';
      const isTeacher = user?.role === 'teacher';
      const isTutor = user?.role === 'tutor';
      const isInstitutionAdmin = user?.role === 'institution_admin';
      
      if (isAdmin && user?.role === 'super_admin') {
        router.push('/admin/dashboard');
      } else if (isInstitutionAdmin && user?.kycStatus !== 'approved') {
        router.push('/dashboard');
      } else if (isInstitutionAdmin && user?.kycStatus === 'approved') {
        router.push('/admin/dashboard');
      } else if (isParent) {
        router.push('/dashboard');
      } else if (isTeacher) {
        router.push('/dashboard');
      } else if (isTutor) {
        router.push('/dashboard');
      } else {
        const onboardingStatus = user?.onboardingStatus;
        if (onboardingStatus === 'not_started' || onboardingStatus === 'in_progress') {
          router.push('/onboarding');
        } else {
          router.push('/dashboard');
        }
      }
    } else {
      toast.error(error || 'Invalid verification code');
    }
  };

  const handleResend = () => {
    if (!canResend) return;
    setResendTimer(59);
    setCanResend(false);
    toast.success('A new 6-digit verification code has been dispatched.');
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
              Verify Your Session
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-base text-white/80 leading-relaxed font-semibold"
            >
              We prioritize data safety. A secure 6-digit OTP verification token helps ensure only certified parents and teachers gain access to student profiles.
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
              <ShieldCheck className="w-4 h-4 text-tertiary-on-primary" />
            </div>
            <div>
              <h4 className="text-white font-extrabold text-xs">Dynamic 2FA Enabled</h4>
              <p className="text-[10px] text-white/60 font-semibold mt-0.5">Session encrypted and backed by secure shield</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Column: OTP Code Entry Pane */}
      <div className="col-span-12 lg:col-span-7 flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-12 bg-white relative">
        <div className="absolute top-8 left-8 lg:left-12">
          <Link 
            href="/login" 
            className="text-xs text-gray-500 font-extrabold tracking-wider hover:text-primary uppercase flex items-center transition-colors"
            onClick={() => useAuthStore.getState().logout()}
          >
            ← Cancel and Log Out
          </Link>
        </div>

        <div className="max-w-md w-full mx-auto space-y-8">
          {/* Header block */}
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Two-Factor Authentication
            </h2>
            <p className="text-sm text-gray-500 font-semibold leading-relaxed">
              We have dispatched a 6-digit verification code to{' '}
              <strong className="text-gray-800 font-bold">{tempEmail || 'your email'}</strong> or{' '}
              <strong className="text-gray-800 font-bold">{tempPhone || 'phone details'}</strong>.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start space-x-3 text-red-700 text-xs font-semibold animate-shake">
              <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex justify-between gap-2.5 sm:gap-4 my-4" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input 
                  key={index}
                  ref={(el) => { if (el) inputRefs.current[index] = el; }}
                  type="text" 
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(e.target, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-50 border border-gray-100 rounded-xl text-center font-extrabold text-lg sm:text-xl text-gray-800 outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all shrink-0"
                />
              ))}
            </div>

            {/* Hint Badge for ease of developer demonstration / verification */}
            <div className="p-3 bg-primary/5 rounded-xl border border-primary/10 text-[11px] font-semibold text-primary leading-relaxed flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-primary shrink-0 animate-pulse" />
              <span>
                <strong>CBC Platform Guide:</strong> For verification testing, please enter code: <code className="bg-primary/10 px-1.5 py-0.5 rounded font-extrabold text-xs">123456</code>.
              </span>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary text-white font-extrabold text-sm py-4 rounded-xl hover:bg-primary/95 transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center uppercase tracking-wider disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying OTP Token...
                </>
              ) : (
                <>
                  Verify Code
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </form>

          {/* Resend Block */}
          <div className="text-center">
            {canResend ? (
              <button 
                onClick={handleResend}
                className="inline-flex items-center space-x-2 text-xs text-primary font-extrabold tracking-wider hover:underline uppercase"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Resend Code</span>
              </button>
            ) : (
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                Resend code in <span className="text-gray-600 font-extrabold">{resendTimer}s</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface-low flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    }>
      <VerifyOtpForm />
    </Suspense>
  );
}
