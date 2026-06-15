'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { GraduationCap, ArrowRight, Loader2, Sparkles, User, Shield, KeyRound, Smartphone, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

function StudentRegisterForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [grade, setGrade] = useState('Grade 4');
  const [pin, setPin] = useState(['', '', '', '']);
  const [parentEmail, setParentEmail] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePinChange = (value: string, index: number) => {
    if (value.length > 1) {
      const digits = value.split('').slice(0, 4);
      const newPin = [...pin];
      digits.forEach((d, i) => {
        if (index + i < 4) newPin[index + i] = d;
      });
      setPin(newPin);
      const nextEmpty = newPin.findIndex((d, i) => !d && i > index + digits.length - 1);
      if (nextEmpty >= 0) {
        const inputs = document.querySelectorAll<HTMLInputElement>('[data-pin-input]');
        inputs[nextEmpty]?.focus();
      }
      return;
    }
    if (!/^\d*$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    if (value && index < 3) {
      const inputs = document.querySelectorAll<HTMLInputElement>('[data-pin-input]');
      inputs[index + 1]?.focus();
    }
  };

  const handlePinKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      const inputs = document.querySelectorAll<HTMLInputElement>('[data-pin-input]');
      inputs[index - 1]?.focus();
    }
  };

  const handlePinPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    const newPin = [...pin];
    text.split('').forEach((d, i) => { newPin[i] = d; });
    setPin(newPin);
    if (text.length === 4) {
      const inputs = document.querySelectorAll<HTMLInputElement>('[data-pin-input]');
      inputs[3]?.blur();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firstName.trim() || !lastName.trim() || !username.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const pinCode = pin.join('');
    if (pinCode.length < 4) {
      toast.error('Please enter a 4-digit PIN');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/students/register', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim().toLowerCase(),
        grade: parseInt(grade.replace('Grade ', '')),
        pin: pinCode,
        parentEmail: parentEmail.trim() || undefined,
        parentPhone: parentPhone.trim() || undefined,
      });

      toast.success('Account created successfully!');
      const status = response.data.status;

      if (status === 'parent_verified') {
        toast.success('Linked to parent account! You can now log in.');
        router.push('/login');
      } else if (status === 'parent_pending') {
        router.push(`/register/student?pending=true&username=${encodeURIComponent(username.trim().toLowerCase())}`);
      } else {
        router.push('/login');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const queryParams = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search)
    : new URLSearchParams();
  const isPending = queryParams.get('pending') === 'true';
  const pendingUsername = queryParams.get('username') || '';

  if (isPending) {
    return (
      <div className="min-h-screen bg-surface-low flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Parent Approval Needed</h1>
          <p className="text-sm text-gray-600">
            We sent an invitation to your parent. Once they create their account,
            you&apos;ll be able to log in with username <strong>{pendingUsername}</strong> and your PIN.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-primary font-bold hover:underline"
          >
            Go to Login <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-low grid lg:grid-cols-12 font-sans overflow-hidden">
      <div className="hidden lg:flex lg:col-span-5 relative bg-primary items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d6832] via-[#1c8445] to-[#0b5327] -z-10" />
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-white/5 blur-3xl" />

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
              Start Learning Today
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-base text-white/80 leading-relaxed font-semibold"
            >
              Create your student account. No email required — just a username and PIN.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="p-4 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-md flex items-start space-x-3.5"
          >
            <KeyRound className="w-5 h-5 text-tertiary-on-primary shrink-0 mt-0.5" />
            <div>
              <h4 className="text-white font-extrabold text-xs">Simple & Secure</h4>
              <p className="text-[10px] text-white/60 font-semibold mt-0.5">Just a username and PIN to get started</p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-7 flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-12 bg-white relative overflow-y-auto">
        <div className="absolute top-8 right-8 lg:right-12">
          <Link href="/" className="text-xs text-gray-500 font-extrabold tracking-wider hover:text-primary uppercase transition-colors">
            Back to Home
          </Link>
        </div>

        <div className="max-w-md w-full mx-auto space-y-6">
          <div className="space-y-1.5">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Student Sign Up
            </h2>
            <p className="text-sm text-gray-500 font-semibold">
              Create your account to start learning. Ask a parent to help if you&apos;re under 13.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start space-x-3 text-red-700 text-xs font-semibold">
              <Shield className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">First Name</label>
                <div className="relative flex items-center bg-gray-50 border border-gray-100 rounded-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                  <User className="w-5 h-5 text-gray-400 absolute left-3 shrink-0" />
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className="w-full bg-transparent outline-none pl-10 pr-3 py-3.5 text-sm font-semibold text-gray-800 placeholder-gray-400"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Last Name</label>
                <div className="relative flex items-center bg-gray-50 border border-gray-100 rounded-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                  <User className="w-5 h-5 text-gray-400 absolute left-3 shrink-0" />
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="w-full bg-transparent outline-none pl-10 pr-3 py-3.5 text-sm font-semibold text-gray-800 placeholder-gray-400"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Choose a Username</label>
              <div className="relative flex items-center bg-gray-50 border border-gray-100 rounded-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                <User className="w-5 h-5 text-gray-400 absolute left-3 shrink-0" />
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s/g, '_'))}
                  placeholder="john_doe_2024"
                  className="w-full bg-transparent outline-none pl-10 pr-3 py-3.5 text-sm font-semibold text-gray-800 placeholder-gray-400"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Grade</label>
              <div className="relative flex items-center bg-gray-50 border border-gray-100 rounded-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                <GraduationCap className="w-5 h-5 text-gray-400 absolute left-3 shrink-0" />
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full bg-transparent outline-none pl-10 pr-3 py-3.5 text-sm font-semibold text-gray-800 cursor-pointer appearance-none"
                >
                  <option value="Grade 1">Grade 1</option>
                  <option value="Grade 2">Grade 2</option>
                  <option value="Grade 3">Grade 3</option>
                  <option value="Grade 4">Grade 4</option>
                  <option value="Grade 5">Grade 5</option>
                  <option value="Grade 6">Grade 6 (KPSEA)</option>
                  <option value="Grade 7">Grade 7 (JSS)</option>
                  <option value="Grade 8">Grade 8 (JSS)</option>
                  <option value="Grade 9">Grade 9 (JSS)</option>
                </select>
                <div className="absolute right-3 pointer-events-none text-gray-400 text-xs font-bold">▼</div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Create a 4-digit PIN</label>
              <div className="flex justify-center gap-3 py-2">
                {pin.map((digit, index) => (
                  <input
                    key={index}
                    data-pin-input
                    type="tel"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(e.target.value, index)}
                    onKeyDown={(e) => handlePinKeyDown(e, index)}
                    onPaste={index === 0 ? handlePinPaste : undefined}
                    className="w-14 h-14 text-center text-xl font-extrabold bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all outline-none"
                  />
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-500 mb-3">
                Parent Details <span className="text-gray-400">(optional — for linking)</span>
              </p>
              <div className="space-y-3">
                <div className="relative flex items-center bg-gray-50 border border-gray-100 rounded-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                  <Mail className="w-5 h-5 text-gray-400 absolute left-3 shrink-0" />
                  <input
                    type="email"
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    placeholder="Parent email (optional)"
                    className="w-full bg-transparent outline-none pl-10 pr-3 py-3 text-sm font-semibold text-gray-800 placeholder-gray-400"
                  />
                </div>
                <div className="relative flex items-center bg-gray-50 border border-gray-100 rounded-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                  <Smartphone className="w-5 h-5 text-gray-400 absolute left-3 shrink-0" />
                  <input
                    type="tel"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="Parent phone (optional)"
                    className="w-full bg-transparent outline-none pl-10 pr-3 py-3 text-sm font-semibold text-gray-800 placeholder-gray-400"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-extrabold text-sm py-4 rounded-xl hover:bg-primary/95 transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center uppercase tracking-wider disabled:opacity-50"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating Account...</>
              ) : (
                <><KeyRound className="w-4 h-4 mr-2" /> Create Student Account <ArrowRight className="w-4 h-4 ml-2" /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm font-semibold text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline font-extrabold">Log In</Link>
          </p>
          <p className="text-center text-xs text-gray-400">
            Are you a parent or teacher?{' '}
            <Link href="/register" className="text-primary hover:underline font-bold">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function StudentRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <StudentRegisterForm />
    </Suspense>
  );
}
