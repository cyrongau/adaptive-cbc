'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Users,
  GraduationCap,
  Edit,
  Save,
  Loader2,
  CheckCircle,
} from 'lucide-react';

export default function AdminInstitutionPage() {
  const { user: currentUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [institution, setInstitution] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    county: '',
    address: '',
    phone: '',
    email: '',
    motto: '',
    description: '',
  });

  useEffect(() => {
    fetchInstitution();
  }, []);

  const fetchInstitution = async () => {
    try {
      let inst;
      if (currentUser?.role === 'institution_admin' && currentUser?.institutionId) {
        const response = await api.get('/institutions/my');
        inst = response.data;
      } else {
        const response = await api.get('/institutions');
        if (response.data && response.data.length > 0) {
          inst = response.data[0];
        }
      }

      if (inst) {
        setInstitution(inst);
        setFormData({
          name: inst.name || '',
          type: inst.type || '',
          county: inst.county || '',
          address: inst.address || '',
          phone: inst.phone || '',
          email: inst.email || '',
          motto: inst.motto || '',
          description: inst.description || '',
        });
      }
    } catch (error) {
      toast.error('Failed to fetch institution details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/institutions/${institution.id}`, formData);
      toast.success('Institution updated successfully!');
      setIsEditing(false);
      fetchInstitution();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update institution');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-[#7eda95] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!institution) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#dae2fd]">My Institution</h2>
          <p className="text-sm text-[#becabd] mt-1">No institution found. Please contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#dae2fd]">My Institution</h2>
          <p className="text-sm text-[#becabd] mt-1">Manage your institution details and settings.</p>
        </div>
        <button
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          disabled={saving}
          className="px-4 py-2 bg-[#47a263] text-[#003919] text-xs font-semibold rounded-lg flex items-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 uppercase tracking-wider"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isEditing ? (
            <Save className="w-4 h-4" />
          ) : (
            <Edit className="w-4 h-4" />
          )}
          {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Edit Details'}
        </button>
      </div>

      {/* Institution Overview */}
      <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-6">
        <div className="flex items-start gap-6 mb-6">
          <div className="w-16 h-16 bg-[#47a263]/20 rounded-xl flex items-center justify-center">
            <Building2 className="w-8 h-8 text-[#7eda95]" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-[#dae2fd]">{institution.name}</h3>
            <p className="text-sm text-[#becabd] capitalize mt-1">{institution.type?.replace('_', ' ')}</p>
            {institution.motto && (
              <p className="text-sm text-[#7eda95] italic mt-2">"{institution.motto}"</p>
            )}
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            institution.status === 'active' ? 'bg-[#7eda95]/10 text-[#7eda95]' : 'bg-[#becabd]/10 text-[#becabd]'
          }`}>
            {institution.status}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#060e20] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-[#7eda95]" />
              <span className="text-xs text-[#becabd] uppercase">Teachers</span>
            </div>
            <p className="text-2xl font-bold text-[#dae2fd]">{institution.totalTeachers || 0}</p>
          </div>
          <div className="bg-[#060e20] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="w-4 h-4 text-[#89ceff]" />
              <span className="text-xs text-[#becabd] uppercase">Students</span>
            </div>
            <p className="text-2xl font-bold text-[#dae2fd]">{institution.totalStudents || 0}</p>
          </div>
          <div className="bg-[#060e20] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-[#b7c8e1]" />
              <span className="text-xs text-[#becabd] uppercase">Grades</span>
            </div>
            <p className="text-2xl font-bold text-[#dae2fd]">{institution.grades?.length || 0}</p>
          </div>
          <div className="bg-[#060e20] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4 text-[#7eda95]" />
              <span className="text-xs text-[#becabd] uppercase">Code</span>
            </div>
            <p className="text-sm font-bold text-[#dae2fd]">{institution.code}</p>
          </div>
        </div>

        {/* Details Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-2">Institution Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={!isEditing}
              className={`w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2.5 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-2">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              disabled={!isEditing}
              className={`w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2.5 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <option value="basic_education">Category A: Basic Education (Pre-Primary - JSS)</option>
              <option value="senior_secondary">Category B: Senior Secondary (Grades 10-12)</option>
              <option value="academy">Academy</option>
              <option value="tuition_center">Tuition Center</option>
              <option value="homeschool">Homeschool</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-2">County</label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#becabd]" />
              <input
                type="text"
                value={formData.county}
                onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                disabled={!isEditing}
                className={`w-full bg-[#060e20] border border-[#3f4940] rounded-lg pl-10 pr-4 py-2.5 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-2">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              disabled={!isEditing}
              className={`w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2.5 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-2">Phone</label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#becabd]" />
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!isEditing}
                className={`w-full bg-[#060e20] border border-[#3f4940] rounded-lg pl-10 pr-4 py-2.5 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-2">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#becabd]" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!isEditing}
                className={`w-full bg-[#060e20] border border-[#3f4940] rounded-lg pl-10 pr-4 py-2.5 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-2">Motto</label>
            <input
              type="text"
              value={formData.motto}
              onChange={(e) => setFormData({ ...formData, motto: e.target.value })}
              disabled={!isEditing}
              className={`w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2.5 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={!isEditing}
              rows={3}
              className={`w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2.5 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none resize-none ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
