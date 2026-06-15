'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { User, Smartphone, KeyRound, Shield, ArrowRight, Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  grade: number;
  status: string;
}

interface PendingDevice {
  id: string;
  deviceId: string;
  userId: string;
  fingerprint: string;
  browserSignature: string;
  osSignature: string;
  createdAt: string;
}

export default function ParentChildrenPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [children, setChildren] = useState<Child[]>([]);
  const [pendingDevices, setPendingDevices] = useState<PendingDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [totpSecret, setTotpSecret] = useState('');
  const [totpUrl, setTotpUrl] = useState('');
  const [totpToken, setTotpToken] = useState('');
  const [showTotpSetup, setShowTotpSetup] = useState(false);
  const [pinResetStudentId, setPinResetStudentId] = useState('');
  const [otp, setOtp] = useState('');
  const [newPin, setNewPin] = useState(['', '', '', '']);
  const [showPinReset, setShowPinReset] = useState(false);

  useEffect(() => {
    if (user?.role !== 'parent' && user?.role !== 'super_admin') {
      router.push('/login');
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profileRes, devicesRes] = await Promise.all([
        api.get('/auth/parent/profile'),
        api.get('/students/pending-approvals'),
      ]);
      setChildren(profileRes.data.children || []);
      setPendingDevices(devicesRes.data || []);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupTotp = async () => {
    try {
      const res = await api.post('/auth/totp/setup');
      setTotpSecret(res.data.secret);
      setTotpUrl(res.data.otpauthUrl);
      setShowTotpSetup(true);
    } catch {
      toast.error('Failed to generate TOTP secret');
    }
  };

  const handleVerifyTotp = async () => {
    if (!totpToken.trim()) {
      toast.error('Enter the code from your authenticator app');
      return;
    }
    try {
      await api.post('/auth/totp/verify', { token: totpToken });
      toast.success('TOTP enabled successfully!');
      setShowTotpSetup(false);
      setTotpToken('');
    } catch {
      toast.error('Invalid TOTP code');
    }
  };

  const handleApproveDevice = async (studentId: string, deviceId: string) => {
    try {
      await api.post('/students/approve-device', { studentId, deviceId });
      toast.success('Device approved');
      loadData();
    } catch {
      toast.error('Failed to approve device');
    }
  };

  const handlePinReset = async (studentId: string) => {
    const pinCode = newPin.join('');
    if (pinCode.length < 4) {
      toast.error('Enter a 4-digit PIN');
      return;
    }
    if (!otp.trim()) {
      toast.error('Enter the OTP sent to your email');
      return;
    }
    try {
      await api.post('/students/parent-pin-reset', {
        studentId,
        otp: otp.trim(),
        newPin: pinCode,
      });
      toast.success('PIN reset successfully!');
      setShowPinReset(false);
      setOtp('');
      setNewPin(['', '', '', '']);
    } catch {
      toast.error('Failed to reset PIN');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-low flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-low p-6 space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">My Children</h1>
          <p className="text-sm text-gray-500 mt-1">Manage linked children, approve devices, and reset PINs</p>
        </div>
        <button onClick={loadData} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
          <RefreshCw className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* TOTP Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary" />
            <div>
              <h2 className="font-extrabold text-gray-900">Two-Factor Authentication</h2>
              <p className="text-xs text-gray-500">Add extra security with an authenticator app</p>
            </div>
          </div>
          {!showTotpSetup && (
            <button onClick={handleSetupTotp} className="text-sm font-bold text-primary hover:underline">
              Set Up
            </button>
          )}
        </div>

        {showTotpSetup && (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl space-y-4">
            <p className="text-sm font-semibold text-gray-700">
              Scan this QR code with your authenticator app (e.g. Google Authenticator), then enter the code:
            </p>
            {totpUrl && (
              <div className="flex justify-center">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(totpUrl)}`} alt="TOTP QR" className="w-48 h-48" />
              </div>
            )}
            <p className="text-xs text-gray-400 text-center font-mono break-all">{totpSecret}</p>
            <div className="flex gap-2">
              <input
                value={totpToken}
                onChange={(e) => setTotpToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-center text-lg font-extrabold tracking-widest outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button onClick={handleVerifyTotp} className="bg-primary text-white font-bold px-6 rounded-xl hover:bg-primary/95 transition-colors">
                Verify
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Children List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
        <div className="p-6">
          <h2 className="font-extrabold text-gray-900">Linked Children ({children.length})</h2>
        </div>
        {children.length === 0 ? (
          <div className="p-6 text-center text-gray-400 text-sm">No children linked yet</div>
        ) : (
          children.map((child) => (
            <div key={child.id} className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">{child.firstName} {child.lastName}</p>
                  <p className="text-xs text-gray-500">Grade {child.grade} &bull; {child.status}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setPinResetStudentId(child.id); setShowPinReset(true); }}
                  className="text-xs font-bold text-primary hover:underline px-3 py-1.5 rounded-lg hover:bg-primary/5"
                >
                  Reset PIN
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pending Device Approvals */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
        <div className="p-6">
          <h2 className="font-extrabold text-gray-900">Pending Device Approvals ({pendingDevices.length})</h2>
        </div>
        {pendingDevices.length === 0 ? (
          <div className="p-6 text-center text-gray-400 text-sm">No pending approvals</div>
        ) : (
          pendingDevices.map((device) => (
            <div key={device.id} className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Device: {device.deviceId.slice(0, 8)}...</p>
                  <p className="text-xs text-gray-500">{device.browserSignature?.slice(0, 60)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleApproveDevice(device.userId, device.deviceId)}
                  className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Approve
                </button>
                <button className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100">
                  <XCircle className="w-3.5 h-3.5" /> Deny
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* PIN Reset Modal */}
      {showPinReset && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-extrabold text-gray-900">Reset Child PIN</h3>
            <p className="text-sm text-gray-500">Enter the OTP sent to your email and the new 4-digit PIN.</p>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">OTP Code</label>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">New 4-digit PIN</label>
              <div className="flex justify-center gap-2 mt-2">
                {newPin.map((digit, i) => (
                  <input
                    key={i}
                    type="tel"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      const updated = [...newPin];
                      updated[i] = val;
                      setNewPin(updated);
                      if (val && i < 3) {
                        const inputs = document.querySelectorAll<HTMLInputElement>('[data-reset-pin]');
                        inputs[i + 1]?.focus();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !newPin[i] && i > 0) {
                        const inputs = document.querySelectorAll<HTMLInputElement>('[data-reset-pin]');
                        inputs[i - 1]?.focus();
                      }
                    }}
                    data-reset-pin
                    className="w-14 h-14 text-center text-xl font-extrabold bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowPinReset(false)} className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200">
                Cancel
              </button>
              <button onClick={() => handlePinReset(pinResetStudentId)} className="flex-1 bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/95">
                Reset PIN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
