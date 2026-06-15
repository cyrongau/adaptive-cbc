'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { KeyRound, User, ArrowRight, Loader2, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  onSwitch: () => void;
}

export default function StudentLoginForm({ onSwitch }: Props) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState(['', '', '', '']);
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
        const inputs = document.querySelectorAll<HTMLInputElement>('[data-student-pin]');
        inputs[nextEmpty]?.focus();
      }
      return;
    }
    if (!/^\d*$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    if (value && index < 3) {
      const inputs = document.querySelectorAll<HTMLInputElement>('[data-student-pin]');
      inputs[index + 1]?.focus();
    }
  };

  const handlePinKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      const inputs = document.querySelectorAll<HTMLInputElement>('[data-student-pin]');
      inputs[index - 1]?.focus();
    }
  };

  const handlePinPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    const newPin = [...pin];
    text.split('').forEach((d, i) => { newPin[i] = d; });
    setPin(newPin);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim()) {
      toast.error('Please enter your username or admission number');
      return;
    }

    const pinCode = pin.join('');
    if (pinCode.length < 4) {
      toast.error('Please enter your 4-digit PIN');
      return;
    }

    setLoading(true);
    try {
      const fingerprint = `${navigator.userAgent}-${screen.width}x${screen.height}`;
      const response = await api.post('/students/login', {
        identifier: identifier.trim().toLowerCase(),
        pin: pinCode,
        deviceFingerprint: btoa(fingerprint).slice(0, 64),
        browserSignature: navigator.userAgent.slice(0, 128),
      });

      const data = response.data;

      if (data.requiresParentApproval) {
        toast.error(data.message || 'Parent approval needed');
        return;
      }

      if (data.requiresDeviceApproval) {
        router.push(`/device-approval?deviceId=${data.deviceId}&riskLevel=${data.riskLevel || 'medium'}`);
        return;
      }

      if (data.tokens) {
        localStorage.setItem('user', JSON.stringify(data.user));
        useAuthStore.setState({ user: data.user, token: data.tokens.accessToken || 'authenticated' });
        toast.success('Welcome back!');
        window.location.href = '/dashboard';
        return;
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid credentials';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start space-x-2 text-red-700 text-xs font-semibold">
          <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
          Username or Admission Number
        </label>
        <div className="relative flex items-center bg-gray-50 border border-gray-100 rounded-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:bg-white focus-within:border-primary transition-all">
          <User className="w-5 h-5 text-gray-400 absolute left-4 shrink-0" />
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="e.g. john_doe_2024 or ADM-1257"
            className="w-full bg-transparent outline-none pl-12 pr-4 py-4 text-sm font-semibold text-gray-800 placeholder-gray-400"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
          4-Digit PIN
        </label>
        <div className="flex justify-center gap-3 py-2">
          {pin.map((digit, index) => (
            <input
              key={index}
              data-student-pin
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

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-white font-extrabold text-sm py-4 rounded-xl hover:bg-primary/95 transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center uppercase tracking-wider disabled:opacity-50"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
        ) : (
          <><KeyRound className="w-4 h-4 mr-2" /> Log In <ArrowRight className="w-4 h-4 ml-2" /></>
        )}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={onSwitch}
          className="text-xs text-primary hover:underline font-extrabold"
        >
          Parent or Staff? Log in with email
        </button>
      </div>

      <p className="text-center text-sm font-semibold text-gray-500">
        New student?{' '}
        <a href="/register/student" className="text-primary hover:underline font-extrabold">
          Sign Up Here
        </a>
      </p>
    </form>
  );
}
