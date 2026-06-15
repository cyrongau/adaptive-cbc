'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Smartphone, ShieldAlert, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '@/lib/api';

const RISK_MESSAGES: Record<string, { icon: typeof Smartphone; color: string; title: string; description: string }> = {
  medium: {
    icon: Smartphone,
    color: 'amber',
    title: 'New Device Detected',
    description: 'This device isn\'t recognized. Your parent or school needs to approve it before you can log in.',
  },
  high: {
    icon: AlertTriangle,
    color: 'orange',
    title: 'Unusual Login Attempt',
    description: 'This login attempt looks unusual. Your parent or school must verify and approve this device for security.',
  },
  critical: {
    icon: ShieldAlert,
    color: 'red',
    title: 'Suspicious Login Blocked',
    description: 'This login was blocked for security. Please contact your parent or school to regain access.',
  },
};

function DeviceApprovalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deviceId = searchParams.get('deviceId') || '';
  const riskLevel = (searchParams.get('riskLevel') || 'medium') as string;
  const riskInfo = RISK_MESSAGES[riskLevel] || RISK_MESSAGES.medium;
  const [notified, setNotified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNotifyParent = async () => {
    if (!deviceId) {
      toast.error('No device ID found');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/students/notify-parent', { deviceId });
      setNotified(true);
      toast.success('Notification sent to your parent!');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to send notification';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const colorMap: Record<string, string> = {
    amber: 'amber',
    orange: 'orange',
    red: 'red',
  };
  const c = colorMap[riskInfo.color] || 'amber';

  return (
    <div className="min-h-screen bg-surface-low flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center space-y-6"
      >
        <div className={`w-20 h-20 bg-${c}-100 rounded-full flex items-center justify-center mx-auto`}>
          <riskInfo.icon className={`w-10 h-10 text-${c}-600`} />
        </div>

        <h1 className="text-2xl font-extrabold text-gray-900">{riskInfo.title}</h1>
        <p className="text-sm text-gray-600 leading-relaxed">
          {riskInfo.description}
        </p>

        <div className={`bg-${c}-50 border border-${c}-200 rounded-xl p-4 text-left space-y-2`}>
          <div className="flex items-start gap-2">
            <ShieldAlert className={`w-4 h-4 text-${c}-600 shrink-0 mt-0.5`} />
            <p className={`text-xs text-${c}-800 font-semibold`}>
              Device ID: <span className="font-mono">{deviceId ? deviceId.slice(0, 8) + '...' : '••••••••'}</span>
            </p>
          </div>
          <p className={`text-xs text-${c}-700`}>
            For your security, new devices must be approved. This helps protect your account.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-xs font-semibold text-red-700">{error}</p>
          </div>
        )}

        {!notified ? (
          <button
            onClick={handleNotifyParent}
            disabled={loading || !deviceId}
            className="w-full bg-primary text-white font-extrabold text-sm py-4 rounded-xl hover:bg-primary/95 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
            ) : (
              <>Notify My Parent <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        ) : (
          <div className="space-y-3">
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-sm font-semibold text-green-800">
                ✓ Notification sent! Your parent can approve this device from their dashboard.
              </p>
            </div>
            <Link
              href="/login"
              className="block w-full bg-gray-100 text-gray-700 font-extrabold text-sm py-4 rounded-xl hover:bg-gray-200 transition-all"
            >
              Back to Login
            </Link>
          </div>
        )}

        <p className="text-xs text-gray-500">
          Need help?{' '}
          <Link href="/contact" className="text-primary font-bold hover:underline">Contact Support</Link>
        </p>
      </motion.div>
    </div>
  );
}

export default function DeviceApprovalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}>
      <DeviceApprovalContent />
    </Suspense>
  );
}
