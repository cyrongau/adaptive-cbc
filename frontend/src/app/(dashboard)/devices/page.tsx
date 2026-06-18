'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Smartphone,
  Laptop,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Calendar,
  MapPin,
  Wifi,
} from 'lucide-react';

interface Device {
  id: string;
  deviceId: string;
  userId: string;
  studentName: string;
  ipAddress: string | null;
  location: string | null;
  browserSignature: string | null;
  osSignature: string | null;
  isApproved: boolean;
  riskLevel: string;
  createdAt: string;
  lastLoginAt: string;
}

export default function DevicesPage() {
  const { user } = useAuthStore();
  const isParent = user?.role === 'parent';
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isParent) {
      fetchDevices();
    } else {
      setLoading(false);
    }
  }, [isParent]);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/students/children-devices');
      setDevices(res.data || []);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Unknown error';
      console.error('Devices fetch error:', msg);
      toast.error(`Failed to load approved devices: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (osSignature: string | null) => {
    if (!osSignature) return <Smartphone className="w-8 h-8 text-primary" />;
    const lowerOS = osSignature.toLowerCase();
    if (lowerOS.includes('windows') || lowerOS.includes('mac') || lowerOS.includes('linux')) {
      return <Laptop className="w-8 h-8 text-primary" />;
    }
    return <Smartphone className="w-8 h-8 text-primary" />;
  };

  if (!isParent) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Security & Devices</h1>
          <p className="text-slate-500 mt-1">Manage approved devices and account access</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">This section is restricted to parent accounts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Security & Devices</h1>
        <p className="text-slate-500 mt-1">Monitor the devices your children use to access their accounts.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
          <span className="text-slate-500">Loading devices...</span>
        </div>
      ) : devices.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Devices Found</h3>
          <p className="text-slate-500 mt-2 max-w-sm mx-auto">
            Your children haven't logged in from any approved devices yet.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-500 font-medium">
                  <th className="py-4 px-6">Device Details</th>
                  <th className="py-4 px-6">Child</th>
                  <th className="py-4 px-6">Network / Location</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">First Seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {devices.map((device) => (
                  <tr key={device.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                          {getDeviceIcon(device.osSignature)}
                        </div>
                        <div className="ml-4">
                          <p className="font-semibold text-slate-900">
                            {device.osSignature || 'Unknown OS'}
                          </p>
                          <p className="text-sm text-slate-500 flex items-center mt-1">
                            {device.browserSignature || 'App/Unknown'} • ID: {device.deviceId.substring(0, 8)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        {device.studentName}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center text-sm text-slate-900">
                          <Wifi className="w-4 h-4 text-slate-400 mr-2" />
                          {device.ipAddress || 'Unknown IP'}
                        </div>
                        <div className="flex items-center text-xs text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 mr-2" />
                          {device.location || 'Unknown Location'}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
                        Trusted
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center text-sm text-slate-500">
                        <Calendar className="w-4 h-4 text-slate-400 mr-2" />
                        {new Date(device.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
