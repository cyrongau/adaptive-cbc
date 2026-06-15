'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Search, Building2, MapPin, Loader2, ShieldAlert, CheckCircle, ArrowRight, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';

interface Institution {
  id: string;
  name: string;
  county: string;
  type: string;
  address: string;
  phone: string;
}

interface JoinRequest {
  id: string;
  institutionId: string;
  status: string;
  rejectionReason?: string;
  createdAt: string;
  institution?: { name: string };
}

export default function JoinSchoolPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [query, setQuery] = useState('');
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [myRequests, setMyRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [requestingId, setRequestingId] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadMyRequests();
  }, []);

  const loadMyRequests = async () => {
    try {
      const res = await api.get('/institutions/my-join-requests');
      setMyRequests(res.data || []);
    } catch {
      // ignore
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await api.get(`/institutions/search?query=${encodeURIComponent(query.trim())}`);
      setInstitutions(res.data || []);
    } catch {
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleRequestJoin = async (institutionId: string) => {
    setRequestingId(institutionId);
    try {
      const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
      await api.post('/students/request-enrollment', {
        institutionId,
        fullName: fullName || undefined,
      });
      toast.success('Enrollment request sent!');
      loadMyRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send request');
    } finally {
      setRequestingId('');
    }
  };

  const alreadyRequested = (institutionId: string) =>
    myRequests.some((r) => r.institutionId === institutionId && r.status === 'pending');

  const alreadyEnrolled = (institutionId: string) =>
    myRequests.some((r) => r.institutionId === institutionId && r.status === 'approved');

  const getStatusBadge = (institutionId: string) => {
    if (alreadyEnrolled(institutionId)) return { label: 'Enrolled', class: 'bg-green-100 text-green-700' };
    if (alreadyRequested(institutionId)) return { label: 'Pending', class: 'bg-amber-100 text-amber-700' };
    return null;
  };

  return (
    <div className="min-h-screen bg-surface-low p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Join a School</h1>
        <p className="text-sm text-gray-500 mt-1">Search for schools and request enrollment</p>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search by school name, code, or county..."
            className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-3.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={searching || !query.trim()}
          className="px-6 bg-primary text-white font-bold rounded-xl hover:bg-primary/95 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Search
        </button>
      </div>

      {/* Results */}
      {institutions.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-extrabold text-gray-900">Results ({institutions.length})</h2>
          {institutions.map((inst) => {
            const badge = getStatusBadge(inst.id);
            return (
              <div key={inst.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center justify-between hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{inst.name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {inst.county}</span>
                      <span className="flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" /> {inst.type?.replace('_', ' ')}</span>
                    </div>
                    {inst.address && <p className="text-xs text-gray-400 mt-1">{inst.address}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {badge ? (
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${badge.class}`}>{badge.label}</span>
                  ) : (
                    <button
                      onClick={() => handleRequestJoin(inst.id)}
                      disabled={requestingId === inst.id}
                      className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/5 px-4 py-2 rounded-xl hover:bg-primary/10 transition-colors disabled:opacity-50"
                    >
                      {requestingId === inst.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5" />
                      )}
                      Join School
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {institutions.length === 0 && !searching && query && (
        <div className="text-center py-12">
          <ShieldAlert className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400 font-semibold">No schools found. Try a different search term.</p>
        </div>
      )}

      {/* My Requests */}
      {myRequests.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
          <div className="p-6">
            <h2 className="font-extrabold text-gray-900">My Enrollment Requests</h2>
          </div>
          {myRequests.map((req) => (
            <div key={req.id} className="p-6 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">Request #{req.id.slice(0, 8)}</p>
                <p className="text-xs text-gray-500">{new Date(req.createdAt).toLocaleDateString()}</p>
              </div>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                req.status === 'approved' ? 'bg-green-100 text-green-700' :
                req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                'bg-amber-100 text-amber-700'
              }`}>
                {req.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
