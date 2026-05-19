'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { GraduationCap, Plus, Search, Building2, Users, MapPin, X, Loader2 } from 'lucide-react';

interface Institution {
  id: string;
  name: string;
  type: string;
  county: string;
  studentCount: number;
  isActive: boolean;
  createdAt: string;
}

export default function AdminInstitutionsPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'basic_education',
    county: '',
    location: '',
  });

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    try {
      const response = await api.get('/institutions');
      setInstitutions(response.data);
    } catch (error) {
      toast.error('Failed to fetch institutions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/institutions', formData);
      toast.success('Institution created successfully!');
      setShowModal(false);
      setFormData({ name: '', code: '', type: 'basic_education', county: '', location: '' });
      fetchInstitutions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create institution');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = institutions.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.county.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-12 h-12 border-4 border-[#7eda95] border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#dae2fd]">Institutions</h2>
          <p className="text-sm text-[#becabd] mt-1">Manage registered schools and learning centers.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-[#47a263] text-[#003919] text-xs font-semibold rounded-lg flex items-center gap-2 hover:opacity-90 transition-all uppercase tracking-wider"
        >
          <Plus className="w-4 h-4" /> Add Institution
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#becabd]" />
        <input
          type="text"
          placeholder="Search institutions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg py-2 pl-10 pr-4 text-[#dae2fd] text-sm focus:border-[#7eda95] focus:ring-0 outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((inst) => (
          <div key={inst.id} className="bg-[#171f33] border border-[#3f4940] rounded-xl p-6 hover:border-[#7eda95]/50 transition-colors">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-[#2d3449] rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-[#7eda95]" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-[#dae2fd]">{inst.name}</h3>
                <p className="text-xs text-[#becabd]">{inst.type}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-[#becabd]">
                <MapPin className="w-4 h-4" />
                {inst.county}
              </div>
              <div className="flex items-center gap-2 text-[#becabd]">
                <Users className="w-4 h-4" />
                {inst.studentCount} students
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[#3f4940] flex items-center justify-between">
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${inst.isActive ? 'bg-[#7eda95]/10 text-[#7eda95]' : 'bg-[#ffb4ab]/10 text-[#ffb4ab]'}`}>
                {inst.isActive ? 'Active' : 'Inactive'}
              </span>
              <button className="text-xs text-[#7eda95] font-semibold hover:underline uppercase tracking-wider">View Details</button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-12 text-center">
          <GraduationCap className="w-12 h-12 text-[#3f4940] mx-auto mb-4" />
          <p className="text-sm text-[#becabd]">No institutions found.</p>
        </div>
      )}

      {/* Add Institution Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#171f33] border border-[#3f4940] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#3f4940] flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#dae2fd]">Add New Institution</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-[#2d3449] rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[#becabd]" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-2">
                  Institution Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Greenfield Academy"
                  className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2.5 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-2">
                  Institution Code *
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., SCH-2024-001"
                  className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2.5 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-2">
                  Institution Type *
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2.5 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none"
                >
                  <option value="basic_education">Category A: Basic Education (Pre-Primary - JSS)</option>
                  <option value="senior_secondary">Category B: Senior Secondary (Grades 10-12)</option>
                  <option value="academy">Academy</option>
                  <option value="tuition_center">Tuition Center</option>
                  <option value="homeschool">Homeschool</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-2">
                  County / Region *
                </label>
                <input
                  type="text"
                  required
                  value={formData.county}
                  onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                  placeholder="e.g., Nairobi"
                  className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2.5 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-2">
                  Location / Address
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., 123 Kenyatta Avenue"
                  className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2.5 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-[#3f4940] text-[#dae2fd] text-sm font-semibold rounded-lg hover:bg-[#2d3449] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-[#47a263] text-[#003919] text-sm font-semibold rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Institution
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}