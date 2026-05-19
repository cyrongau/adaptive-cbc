'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { getAvatarUrl } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  User,
  Mail,
  Phone,
  Shield,
  Calendar,
  Edit,
  Save,
  Lock,
  Building2,
  Camera,
} from 'lucide-react';
import Image from 'next/image';

export default function AdminProfilePage() {
  const { user, refreshUser, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.post('/users/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      updateUser({ avatar: response.data.avatarUrl });
      await refreshUser();
      toast.success('Avatar updated successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload avatar');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await api.patch('/users/profile', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
      });
      updateUser({ firstName: formData.firstName, lastName: formData.lastName, phone: formData.phone });
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token: '',
        newPassword: passwordData.newPassword,
      });
      toast.success('Password changed successfully!');
      setShowPasswordForm(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#dae2fd]">My Profile</h2>
        <p className="text-sm text-[#becabd] mt-1">Manage your account information and security.</p>
      </div>

      {/* Profile Card */}
      <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-6">
            {/* Avatar with Upload */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-[#2d3449] flex items-center justify-center text-2xl font-bold text-[#7eda95] border-2 border-[#7eda95]/30 overflow-hidden">
                {user?.avatar ? (
                  <Image src={getAvatarUrl(user.avatar)} alt="Avatar" width={96} height={96} className="w-full h-full object-cover" />
                ) : (
                  <>{user?.firstName?.[0]}{user?.lastName?.[0]}</>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
                title="Change avatar"
              >
                {avatarUploading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#dae2fd]">{user?.firstName} {user?.lastName}</h3>
              <p className="text-sm text-[#becabd] capitalize">{isSuperAdmin ? 'Super Administrator' : 'Institution Administrator'}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  user?.isActive ? 'bg-[#7eda95]/10 text-[#7eda95]' : 'bg-[#ffb4ab]/10 text-[#ffb4ab]'
                }`}>
                  {user?.isActive ? 'Active' : 'Inactive'}
                </span>
                {!isSuperAdmin && user?.kycStatus && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    user.kycStatus === 'approved' ? 'bg-[#7eda95]/10 text-[#7eda95]' : 'bg-amber-400/10 text-amber-400'
                  }`}>
                    KYC: {user.kycStatus}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 border border-[#3f4940] text-[#dae2fd] text-xs font-semibold rounded-lg flex items-center gap-2 hover:bg-[#2d3449] transition-all"
          >
            <Edit className="w-4 h-4" /> {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {/* Profile Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-2">First Name</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#becabd]" />
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                disabled={!isEditing}
                className={`w-full bg-[#060e20] border border-[#3f4940] rounded-lg pl-10 pr-4 py-2.5 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-2">Last Name</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#becabd]" />
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
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
                disabled
                className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg pl-10 pr-4 py-2.5 text-[#dae2fd] text-sm opacity-70 cursor-not-allowed outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-2">Phone</label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#becabd]" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!isEditing}
                className={`w-full bg-[#060e20] border border-[#3f4940] rounded-lg pl-10 pr-4 py-2.5 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-2">Role</label>
            <div className="relative">
              <Shield className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#becabd]" />
              <input
                type="text"
                value={isSuperAdmin ? 'Super Administrator' : 'Institution Administrator'}
                disabled
                className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg pl-10 pr-4 py-2.5 text-[#dae2fd] text-sm opacity-70 cursor-not-allowed outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-2">Member Since</label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#becabd]" />
              <input
                type="text"
                value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                disabled
                className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg pl-10 pr-4 py-2.5 text-[#dae2fd] text-sm opacity-70 cursor-not-allowed outline-none"
              />
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSaveProfile}
              disabled={loading}
              className="px-6 py-2.5 bg-[#47a263] text-[#003919] text-sm font-semibold rounded-lg flex items-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : (
                <>
                  <Save className="w-4 h-4" /> Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Change Password */}
      <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#dae2fd] flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#7eda95]" />
            Security
          </h3>
          <button
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="px-4 py-2 border border-[#3f4940] text-[#dae2fd] text-xs font-semibold rounded-lg hover:bg-[#2d3449] transition-all"
          >
            {showPasswordForm ? 'Cancel' : 'Change Password'}
          </button>
        </div>

        {showPasswordForm && (
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-2">New Password</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="Minimum 8 characters"
                className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2.5 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-2">Confirm Password</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="Re-enter password"
                className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2.5 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-[#47a263] text-[#003919] text-sm font-semibold rounded-lg flex items-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
