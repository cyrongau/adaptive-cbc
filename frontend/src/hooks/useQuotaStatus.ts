import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

interface QuotaStatus {
  tier: string;
  ocr: {
    used: number;
    limit: number;
    remaining: number;
    isExceeded: boolean;
    costUsed: number;
    costLimit: number;
    costRemaining: number;
  };
  ai: {
    used: number;
    limit: number;
    remaining: number;
    isExceeded: boolean;
    costUsed: number;
    costLimit: number;
    costRemaining: number;
  };
  credits: {
    type: string;
    balance: number;
    totalAllocated: number;
    totalConsumed: number;
  }[];
  resetAt: string;
}

export function useQuotaStatus() {
  const { token } = useAuthStore();
  const isAuthenticated = !!token;
  const [quota, setQuota] = useState<QuotaStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const fetchQuota = async () => {
      try {
        const { data } = await api.get('/governance/quota-status');
        setQuota(data);
      } catch (error) {
        console.error('Failed to fetch quota status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuota();
    const interval = setInterval(fetchQuota, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const refresh = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/governance/quota-status');
      setQuota(data);
    } catch (error) {
      console.error('Failed to refresh quota status:', error);
    } finally {
      setLoading(false);
    }
  };

  return { quota, loading, refresh };
}
