'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { GraduationCap, ArrowRight, Loader2, Sparkles, Mail, Lock, ShieldAlert, AlertTriangle, FolderOpen, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const ROUTE_INFO: Record<string, { label: string; icon: React.ReactNode }> = {
  '/library': { label: 'Digital Library', icon: <FolderOpen className="w-5 h-5" /> },
  '/materials': { label: 'Marketplace', icon: <ShoppingBag className="w-5 h-5" /> },
  '/practice': { label: 'Adaptive Practice', icon: <Sparkles className="w-5 h-5" /> },
  '/dashboard': { label: 'Dashboard', icon: <GraduationCap className="w-5 h-5" /> },
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loading, error, clearError, initialize } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState<string | null>(null);

  useEffect(() => {
    initialize();
    clearError();
    const isAuthRequired = searchParams.get('authRequired') === 'true';
    const cbUrl = searchParams.get('callbackUrl');
    if (isAuthRequired) {
      setAuthRequired(true);
      setCallbackUrl(cbUrl ? decodeURIComponent(cbUrl) : null);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error('Please fill in all credentials');
      return;
    }

    const success = await login(email, password);
    if (success) {
      toast.success('Credentials verified. Initiating Two-Factor Authentication.');
      const verifyUrl = callbackUrl ? `/verify-otp?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/verify-otp';
      router.push(verifyUrl);
    } else {
      toast.error(error || 'Invalid credentials');
    }
  };

  const handleSocialLogin = (platform: string) => {
    toast.success(`Redirecting to ${platform} secure login...`);
  };

  const routeInfo = callbackUrl ? ROUTE_INFO[callbackUrl] || null : null;

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
              Your intelligent companion...
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-base text-white/80 leading-relaxed font-semibold"
            >
              Adaptive CBC is tailored specifically for the Kenyan Competency-Based Curriculum. Our AI-driven insights empower parents, pupils, and teachers.
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
              <h4 className="text-white font-extrabold text-xs">AI-Optimized Learning</h4>
              <p className="text-[10px] text-white/60 font-semibold mt-0.5">Empowering pupils across Grades 1-9</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Column: Interaction Form Pane */}
      <div className="col-span-12 lg:col-span-7 flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-12 bg-white relative">
        <div className="absolute top-8 right-8 lg:right-12">
          <Link 
            href="/" 
            className="text-xs text-gray-500 font-extrabold tracking-wider hover:text-primary uppercase flex items-center transition-colors"
          >
            Back to Home
          </Link>
        </div>

        <div className="max-w-md w-full mx-auto space-y-8">
          {/* Header block */}
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Welcome Back!
            </h2>
            <p className="text-sm text-gray-500 font-semibold leading-relaxed">
              Login to access your personalized adaptive dashboard.
            </p>
          </div>

          {authRequired && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 bg-gradient-to-r from-primary/5 to-tertiary/5 border border-primary/20 rounded-2xl space-y-3"
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  {routeInfo?.icon || <ShieldAlert className="w-5 h-5 text-primary" />}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-extrabold text-gray-900">
                    Authentication Required
                  </h3>
                  <p className="text-xs text-gray-600 font-semibold mt-1">
                    You need to be logged in to access the{' '}
                    <span className="text-primary font-bold">{routeInfo?.label || 'requested page'}</span>.
                    {callbackUrl && (
                      <span className="block mt-1 text-gray-500">
                        After logging in, you'll be redirected back automatically.
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start space-x-3 text-red-700 text-xs font-semibold animate-shake">
              <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Email Address or Phone Number
              </label>
              <div className="relative flex items-center bg-gray-50 border border-gray-100 rounded-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:bg-white focus-within:border-primary transition-all">
                <Mail className="w-5 h-5 text-gray-400 absolute left-4 shrink-0" />
                <input 
                  id="email"
                  type="text" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="parent@adaptivecbc.com"
                  className="w-full bg-transparent outline-none pl-12 pr-4 py-4 text-sm font-semibold text-gray-800 placeholder-gray-400"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Password
                </label>
                <Link 
                  href="/forgot-password" 
                  className="text-xs text-primary hover:underline font-extrabold"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative flex items-center bg-gray-50 border border-gray-100 rounded-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:bg-white focus-within:border-primary transition-all">
                <Lock className="w-5 h-5 text-gray-400 absolute left-4 shrink-0" />
                <input 
                  id="password"
                  type={showPassword ? 'text' : 'password'} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent outline-none pl-12 pr-12 py-4 text-sm font-semibold text-gray-800 placeholder-gray-400"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-widest"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
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
                  Verifying Session...
                </>
              ) : (
                <>
                  Log In
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100" />
            </div>
            <span className="relative bg-white px-4 text-xs font-bold uppercase tracking-widest text-gray-400">
              Or Sign In With
            </span>
          </div>

          {/* Social Logins */}
          <div className="grid grid-cols-3 gap-3">
            <button 
              onClick={() => handleSocialLogin('Google')}
              className="flex items-center justify-center border border-gray-100 rounded-xl py-3 hover:bg-gray-50 transition-colors"
              title="Google"
            >
              <img src="/icons/google.svg" alt="Google" className="w-5 h-5" onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = '<span class="text-xs font-bold">Google</span>';
              }} />
            </button>
            <button 
              onClick={() => handleSocialLogin('Apple')}
              className="flex items-center justify-center border border-gray-100 rounded-xl py-3 hover:bg-gray-50 transition-colors"
              title="Apple"
            >
              <img src="/icons/apple.svg" alt="Apple" className="w-5 h-5" onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = '<span class="text-xs font-bold">Apple</span>';
              }} />
            </button>
            <button 
              onClick={() => handleSocialLogin('Microsoft')}
              className="flex items-center justify-center border border-gray-100 rounded-xl py-3 hover:bg-gray-50 transition-colors"
              title="Microsoft"
            >
              <img src="/icons/microsoft.svg" alt="Microsoft" className="w-5 h-5" onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = '<span class="text-xs font-bold">Microsoft</span>';
              }} />
            </button>
          </div>

          <p className="text-center text-sm font-semibold text-gray-500 mt-8">
            Don't have an account?{' '}
            <Link href="/register" className="text-primary hover:underline font-extrabold">
              Register Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface-low flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
