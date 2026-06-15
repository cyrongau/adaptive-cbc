'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { ArrowRight, Loader2, User, Mail, Phone, Lock, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationToken = searchParams.get('token') || '';

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await api.post('/students/accept-parent-invitation', {
        invitationToken,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });

      toast.success('Account created and linked to student!');
      router.push('/login');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to accept invitation';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!invitationToken) {
    return (
      <div className="min-h-screen bg-surface-low flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-red-400 mx-auto" />
          <h1 className="text-xl font-extrabold text-gray-900">Invalid Invitation</h1>
          <p className="text-sm text-gray-600">This invitation link is invalid or expired.</p>
          <Link href="/register" className="text-primary font-bold hover:underline">Go to Register</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-low flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <User className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Accept Parent Invitation</h1>
          <p className="text-sm text-gray-500">
            A student has invited you to be their parent/guardian on Adaptive CBC.
            Create your account to monitor their learning progress.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start space-x-2 text-red-700 text-xs font-semibold">
            <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">First Name</label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jane"
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Last Name</label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Parent"
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Email</label>
            <div className="relative flex items-center bg-gray-50 border border-gray-100 rounded-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
              <Mail className="w-5 h-5 text-gray-400 absolute left-3 shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="parent@example.com"
                className="w-full bg-transparent outline-none pl-10 pr-3 py-3 text-sm font-semibold text-gray-800 placeholder-gray-400"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Phone (optional)</label>
            <div className="relative flex items-center bg-gray-50 border border-gray-100 rounded-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
              <Phone className="w-5 h-5 text-gray-400 absolute left-3 shrink-0" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+254712345678"
                className="w-full bg-transparent outline-none pl-10 pr-3 py-3 text-sm font-semibold text-gray-800 placeholder-gray-400"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Password</label>
            <div className="relative flex items-center bg-gray-50 border border-gray-100 rounded-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
              <Lock className="w-5 h-5 text-gray-400 absolute left-3 shrink-0" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full bg-transparent outline-none pl-10 pr-3 py-3 text-sm font-semibold text-gray-800 placeholder-gray-400"
              />
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
              <>Accept & Create Account <ArrowRight className="w-4 h-4 ml-2" /></>
            )}
          </button>
        </form>

        <p className="text-center text-sm font-semibold text-gray-500">
          Already have an account?{' '}
          <Link href={`/login?invitationToken=${invitationToken}`} className="text-primary hover:underline font-extrabold">
            Log In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}>
      <AcceptInviteForm />
    </Suspense>
  );
}
