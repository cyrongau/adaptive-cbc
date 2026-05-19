'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { 
  Users, 
  Search, 
  Shield, 
  GraduationCap, 
  UserCircle, 
  Mail, 
  AlertCircle,
  CheckCircle,
  X,
  Filter,
  Download,
  UserPlus,
  Building2,
  UserCog,
  MoreVertical,
  Ban,
  Trash2,
  ShieldOff,
  RotateCcw,
  UserMinus,
} from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  secondaryRoles?: string[];
  grade?: number;
  isActive: boolean;
  isSuspended: boolean;
  suspendedAt?: string;
  suspensionReason?: string;
  deletedAt?: string;
  createdAt: string;
  onboardingStatus?: string;
  institutionId?: string;
  institutionApplication?: {
    institutionName: string;
    institutionType: string;
    county: string;
  };
  kycStatus?: string;
}

interface Institution {
  id: string;
  name: string;
  code: string;
  type: string;
  county: string;
}

const ROLES = [
  { value: 'student', label: 'Student', color: 'text-[#7eda95]', bg: 'bg-[#7eda95]/10' },
  { value: 'parent', label: 'Parent', color: 'text-[#b7c8e1]', bg: 'bg-[#b7c8e1]/10' },
  { value: 'teacher', label: 'Teacher', color: 'text-[#89ceff]', bg: 'bg-[#89ceff]/10' },
  { value: 'tutor', label: 'Tutor', color: 'text-[#89ceff]', bg: 'bg-[#89ceff]/10' },
  { value: 'institution_admin', label: 'Institution Admin', color: 'text-[#7eda95]', bg: 'bg-[#7eda95]/10' },
  { value: 'super_admin', label: 'Super Admin', color: 'text-[#ffb4ab]', bg: 'bg-[#ffb4ab]/10' },
];

export default function AdminUsersPage() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showLegacyOnly, setShowLegacyOnly] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [gradeModal, setGradeModal] = useState(false);
  const [selectedLegacyUser, setSelectedLegacyUser] = useState<UserData | null>(null);
  const [selectedGrade, setSelectedGrade] = useState(4);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'student',
    grade: 4,
  });
  const [showInstitutionModal, setShowInstitutionModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState('');
  const [newInstitutionData, setNewInstitutionData] = useState({
    name: '',
    type: 'senior_secondary',
    county: '',
    code: '',
  });
  const [useExistingInstitution, setUseExistingInstitution] = useState(true);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDemoteModal, setShowDemoteModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedUserForAction, setSelectedUserForAction] = useState<UserData | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [demoteRole, setDemoteRole] = useState('student');

  const isAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'institution_admin';

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      if (currentUser?.role === 'super_admin') {
        fetchInstitutions();
      }
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const fetchInstitutions = async () => {
    try {
      const response = await api.get('/institutions');
      setInstitutions(response.data);
    } catch (error) {
      console.error('Failed to fetch institutions');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGrade = async (userId: string, grade: number) => {
    try {
      await api.patch(`/users/${userId}/grade`, { grade, onboardingStatus: 'completed' });
      toast.success('Grade assigned successfully!');
      setGradeModal(false);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update grade');
    }
  };

  const handleBulkAssignGrades = async (grade: number) => {
    const legacyUsers = users.filter(u => u.role === 'student' && !u.grade);
    try {
      await Promise.all(
        legacyUsers.map(u => api.patch(`/users/${u.id}/grade`, { grade, onboardingStatus: 'completed' }))
      );
      toast.success(`Assigned Grade ${grade} to ${legacyUsers.length} students!`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to bulk assign grades');
    }
  };

  const resetActionState = () => {
    setSelectedUserForAction(null);
    setSelectedInstitutionId('');
    setNewInstitutionData({ name: '', type: 'senior_secondary', county: '', code: '' });
    setUseExistingInstitution(true);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesLegacy = !showLegacyOnly || (user.role === 'student' && !user.grade);
    return matchesSearch && matchesRole && matchesLegacy;
  });

  const legacyStudents = users.filter(u => u.role === 'student' && !u.grade);

  const handleAssignInstitution = async () => {
    if (!selectedUserForAction) return;
    try {
      if (useExistingInstitution) {
        if (!selectedInstitutionId) {
          toast.error('Please select an institution');
          return;
        }
        await api.post(`/institutions/${selectedInstitutionId}/admins`, { userId: selectedUserForAction.id });
        toast.success('User assigned as institution admin successfully!');
      } else {
        await api.post('/institutions/create-and-assign-admin', {
          userId: selectedUserForAction.id,
          institutionData: {
            name: newInstitutionData.name,
            code: newInstitutionData.code,
            type: newInstitutionData.type,
            county: newInstitutionData.county,
            status: 'active',
            totalStudents: 0,
            totalTeachers: 0,
            settings: {
              allowSelfRegistration: true,
              requireApproval: true,
              enableParentPortal: true,
              enableTeacherDashboard: true,
              customBranding: false,
            },
            subscription: {
              plan: 'free',
              startDate: new Date().toISOString(),
              endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
              maxStudents: 500,
              maxTeachers: 50,
            },
          },
        });
        toast.success('Institution created and user assigned as admin!');
      }
      setShowInstitutionModal(false);
      resetActionState();
      fetchUsers();
      fetchInstitutions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to assign institution');
    }
  };

  const handlePromoteToAdmin = async () => {
    if (!selectedUserForAction) return;
    try {
      const payload: any = { userId: selectedUserForAction.id };
      if (useExistingInstitution) {
        if (!selectedInstitutionId) {
          toast.error('Please select an institution');
          return;
        }
        payload.institutionId = selectedInstitutionId;
      } else {
        payload.institutionData = {
          name: newInstitutionData.name,
          code: newInstitutionData.code,
          type: newInstitutionData.type,
          county: newInstitutionData.county,
          status: 'active',
          totalStudents: 0,
          totalTeachers: 0,
          settings: {
            allowSelfRegistration: true,
            requireApproval: true,
            enableParentPortal: true,
            enableTeacherDashboard: true,
            customBranding: false,
          },
          subscription: {
            plan: 'free',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            maxStudents: 500,
            maxTeachers: 50,
          },
        };
      }
      await api.post('/institutions/promote-to-admin', payload);
      toast.success('User promoted to institution admin successfully!');
      setShowPromoteModal(false);
      resetActionState();
      fetchUsers();
      fetchInstitutions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to promote user');
    }
  };

  const handleSuspendUser = async () => {
    if (!selectedUserForAction) return;
    try {
      await api.patch(`/users/${selectedUserForAction.id}/suspend`, { reason: suspendReason || undefined });
      toast.success('User suspended successfully!');
      setShowSuspendModal(false);
      setSuspendReason('');
      setSelectedUserForAction(null);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to suspend user');
    }
  };

  const handleUnsuspendUser = async (user: UserData) => {
    try {
      await api.patch(`/users/${user.id}/unsuspend`);
      toast.success('User unsuspended successfully!');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to unsuspend user');
    }
  };

  const handleSoftDeleteUser = async () => {
    if (!selectedUserForAction) return;
    try {
      await api.patch(`/users/${selectedUserForAction.id}/soft-delete`);
      toast.success('User deleted successfully!');
      setShowDeleteModal(false);
      setSelectedUserForAction(null);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleRestoreUser = async () => {
    if (!selectedUserForAction) return;
    try {
      await api.patch(`/users/${selectedUserForAction.id}/restore`);
      toast.success('User restored successfully!');
      setShowRestoreModal(false);
      setSelectedUserForAction(null);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to restore user');
    }
  };

  const handleDemoteUser = async () => {
    if (!selectedUserForAction) return;
    try {
      await api.patch(`/users/${selectedUserForAction.id}/demote`, { newRole: demoteRole });
      toast.success('User demoted successfully!');
      setShowDemoteModal(false);
      setSelectedUserForAction(null);
      setDemoteRole('student');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to demote user');
    }
  };

  const canSuspend = (user: UserData) => {
    if (user.id === currentUser?.id) return false;
    if (currentUser?.role === 'super_admin') return user.role !== 'super_admin';
    if (currentUser?.role === 'institution_admin') {
      if (user.role === 'super_admin' || user.role === 'institution_admin') return false;
      if (user.role === 'tutor' && !user.institutionId) return false;
      if (user.institutionId && user.institutionId !== currentUser?.institutionId) return false;
      return true;
    }
    return false;
  };

  const canDelete = (user: UserData) => {
    if (user.id === currentUser?.id) return false;
    if (currentUser?.role === 'super_admin') return user.role !== 'super_admin';
    if (currentUser?.role === 'institution_admin') {
      if (user.role === 'super_admin' || user.role === 'institution_admin') return false;
      if (user.role === 'tutor' && !user.institutionId) return false;
      if (user.role === 'teacher' && user.secondaryRoles?.includes('tutor')) return false;
      if (user.institutionId && user.institutionId !== currentUser?.institutionId) return false;
      return true;
    }
    return false;
  };

  const canDemote = (user: UserData) => {
    if (currentUser?.role !== 'super_admin') return false;
    return ['institution_admin', 'teacher', 'tutor'].includes(user.role);
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <Shield className="w-16 h-16 text-[#3f4940]" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-[#7eda95] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#dae2fd]">User Management</h2>
          <p className="text-sm text-[#becabd] mt-1">Manage all platform users and assign grades to legacy students.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-[#3f4940] text-[#dae2fd] text-xs font-semibold rounded-lg flex items-center gap-2 hover:bg-[#2d3449] transition-all uppercase tracking-wider">
            <Download className="w-4 h-4" /> Export
          </button>
          <button className="px-4 py-2 bg-[#47a263] text-[#003919] text-xs font-semibold rounded-lg flex items-center gap-2 hover:opacity-90 transition-all uppercase tracking-wider">
            <UserPlus className="w-4 h-4" /> Add User
          </button>
        </div>
      </div>

      {/* Legacy Students Alert */}
      {legacyStudents.length > 0 && (
        <div className="bg-[#171f33] border border-[#89ceff]/30 rounded-xl p-4 flex flex-col md:flex-row items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#89ceff]/20 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-[#89ceff]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#dae2fd]">{legacyStudents.length} Legacy Students Need Grade Assignment</p>
            <p className="text-xs text-[#becabd] mt-1">These accounts were created before grade-level filtering. Assign grades to enable personalized content.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowLegacyOnly(true)}
              className="px-3 py-1.5 bg-[#89ceff]/20 text-[#89ceff] text-xs font-semibold rounded-lg hover:bg-[#89ceff]/30 transition-all"
            >
              View Legacy Only
            </button>
            <button
              onClick={() => handleBulkAssignGrades(4)}
              className="px-3 py-1.5 bg-[#47a263] text-[#003919] text-xs font-semibold rounded-lg hover:opacity-90 transition-all"
            >
              Bulk Assign Grade 4
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#becabd]" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg py-2 pl-10 pr-4 text-[#dae2fd] text-sm focus:border-[#7eda95] focus:ring-0 outline-none"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 bg-[#060e20] border border-[#3f4940] rounded-lg text-sm text-[#dae2fd] focus:border-[#7eda95] outline-none"
          >
            <option value="all">All Roles</option>
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <button
            onClick={() => setShowLegacyOnly(!showLegacyOnly)}
            className={`px-4 py-2 border rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
              showLegacyOnly
                ? 'bg-[#89ceff]/20 border-[#89ceff] text-[#89ceff]'
                : 'border-[#3f4940] text-[#becabd] hover:bg-[#2d3449]'
            }`}
          >
            <Filter className="w-4 h-4 inline mr-1" />
            Legacy
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#171f33] border border-[#3f4940] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#131b2e] border-b border-[#3f4940]">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-bold text-[#becabd] uppercase tracking-wider">User</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-[#becabd] uppercase tracking-wider">Role</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-[#becabd] uppercase tracking-wider">Grade</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-[#becabd] uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-[#becabd] uppercase tracking-wider">Joined</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-[#becabd] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3f4940]">
              {filteredUsers.map((user) => {
                const roleInfo = ROLES.find(r => r.value === user.role) || ROLES[0];
                const isLegacy = user.role === 'student' && !user.grade;
                return (
                  <tr key={user.id} className="hover:bg-[#222a3d] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#2d3449] rounded-full flex items-center justify-center font-bold text-sm text-[#dae2fd]">
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#dae2fd]">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-[#becabd]">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${roleInfo.bg} ${roleInfo.color}`}>
                        {roleInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {isLegacy ? (
                        <button
                          onClick={() => {
                            setSelectedLegacyUser(user);
                            setSelectedGrade(4);
                            setGradeModal(true);
                          }}
                          className="px-2 py-1 bg-[#89ceff]/20 text-[#89ceff] text-xs font-semibold rounded-lg hover:bg-[#89ceff]/30 transition-all flex items-center gap-1"
                        >
                          <AlertCircle className="w-3 h-3" />
                          Assign
                        </button>
                      ) : user.role === 'student' ? (
                        <span className="text-sm text-[#7eda95] font-semibold">Grade {user.grade}</span>
                      ) : (
                        <span className="text-[#becabd]">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {user.isSuspended ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400">
                          <Ban className="w-3 h-3" />
                          Suspended
                        </span>
                      ) : user.deletedAt ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold bg-gray-500/10 text-gray-400">
                          <Trash2 className="w-3 h-3" />
                          Deleted
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold ${
                          user.isActive ? 'bg-[#7eda95]/10 text-[#7eda95]' : 'bg-[#ffb4ab]/10 text-[#ffb4ab]'
                        }`}>
                          {user.isActive ? <CheckCircle className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#becabd]">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setFormData({
                              firstName: user.firstName,
                              lastName: user.lastName,
                              email: user.email,
                              role: user.role,
                              grade: user.grade || 4,
                            });
                            setShowModal(true);
                          }}
                          className="text-xs text-[#7eda95] font-semibold hover:underline uppercase tracking-wider"
                        >
                          Edit
                        </button>
                        {(canSuspend(user) || canDelete(user) || canDemote(user)) && (
                          <div className="relative">
                            <button
                              onClick={() => setOpenActionMenu(openActionMenu === user.id ? null : user.id)}
                              className="p-1 hover:bg-[#2d3449] rounded transition-colors"
                            >
                              <MoreVertical className="w-4 h-4 text-[#becabd]" />
                            </button>
                            {openActionMenu === user.id && (
                              <div className="absolute right-0 mt-1 w-48 bg-[#171f33] border border-[#3f4940] rounded-lg shadow-xl z-10">
                                <div className="py-1">
                                  {user.deletedAt ? (
                                    <button
                                      onClick={() => {
                                        setSelectedUserForAction(user);
                                        setShowRestoreModal(true);
                                        setOpenActionMenu(null);
                                      }}
                                      className="w-full px-4 py-2 text-left text-xs text-[#89ceff] hover:bg-[#2d3449] flex items-center gap-2"
                                    >
                                      <RotateCcw className="w-3 h-3" />
                                      Restore Account
                                    </button>
                                  ) : (
                                    <>
                                      {user.isSuspended ? (
                                        <button
                                          onClick={() => {
                                            handleUnsuspendUser(user);
                                            setOpenActionMenu(null);
                                          }}
                                          className="w-full px-4 py-2 text-left text-xs text-[#7eda95] hover:bg-[#2d3449] flex items-center gap-2"
                                        >
                                          <RotateCcw className="w-3 h-3" />
                                          Unsuspend Account
                                        </button>
                                      ) : canSuspend(user) && (
                                        <button
                                          onClick={() => {
                                            setSelectedUserForAction(user);
                                            setSuspendReason('');
                                            setShowSuspendModal(true);
                                            setOpenActionMenu(null);
                                          }}
                                          className="w-full px-4 py-2 text-left text-xs text-amber-400 hover:bg-[#2d3449] flex items-center gap-2"
                                        >
                                          <Ban className="w-3 h-3" />
                                          Suspend Account
                                        </button>
                                      )}
                                      {canDelete(user) && !user.deletedAt && (
                                        <button
                                          onClick={() => {
                                            setSelectedUserForAction(user);
                                            setShowDeleteModal(true);
                                            setOpenActionMenu(null);
                                          }}
                                          className="w-full px-4 py-2 text-left text-xs text-red-400 hover:bg-[#2d3449] flex items-center gap-2"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                          Delete Account
                                        </button>
                                      )}
                                      {canDemote(user) && (
                                        <button
                                          onClick={() => {
                                            setSelectedUserForAction(user);
                                            setDemoteRole(user.role === 'institution_admin' ? 'teacher' : 'student');
                                            setShowDemoteModal(true);
                                            setOpenActionMenu(null);
                                          }}
                                          className="w-full px-4 py-2 text-left text-xs text-[#b7c8e1] hover:bg-[#2d3449] flex items-center gap-2"
                                        >
                                          <UserMinus className="w-3 h-3" />
                                          Demote User
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        {currentUser?.role === 'super_admin' && user.role !== 'super_admin' && !user.institutionId && (
                          <>
                            {user.role === 'institution_admin' && (
                              <button
                                onClick={() => {
                                  setSelectedUserForAction(user);
                                  setShowInstitutionModal(true);
                                }}
                                className="text-xs text-[#89ceff] font-semibold hover:underline uppercase tracking-wider flex items-center gap-1"
                                title="Assign Institution"
                              >
                                <Building2 className="w-3 h-3" />
                              </button>
                            )}
                            {(user.role === 'teacher' || user.role === 'tutor') && (
                              <button
                                onClick={() => {
                                  setSelectedUserForAction(user);
                                  setShowPromoteModal(true);
                                }}
                                className="text-xs text-[#b7c8e1] font-semibold hover:underline uppercase tracking-wider flex items-center gap-1"
                                title="Promote to Institution Admin"
                              >
                                <UserCog className="w-3 h-3" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-[#3f4940] mx-auto mb-4" />
            <p className="text-sm text-[#becabd]">No users found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Grade Assignment Modal */}
      {gradeModal && selectedLegacyUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#171f33] border border-[#3f4940] rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#dae2fd]">Assign Grade Level</h2>
              <button onClick={() => setGradeModal(false)} className="text-[#becabd] hover:text-[#dae2fd]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-[#060e20] border border-[#3f4940] rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-[#dae2fd]">{selectedLegacyUser.firstName} {selectedLegacyUser.lastName}</p>
              <p className="text-xs text-[#becabd]">{selectedLegacyUser.email}</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-2">Select Grade</label>
                <div className="grid grid-cols-4 gap-2">
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => (
                    <button
                      key={g}
                      onClick={() => setSelectedGrade(g)}
                      className={`py-2 rounded-lg text-sm font-semibold transition-all ${
                        selectedGrade === g
                          ? 'bg-[#47a263] text-[#003919]'
                          : 'bg-[#060e20] border border-[#3f4940] text-[#dae2fd] hover:border-[#7eda95]'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setGradeModal(false)}
                  className="flex-1 px-4 py-2 border border-[#3f4940] text-[#becabd] rounded-lg font-semibold hover:bg-[#2d3449] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateGrade(selectedLegacyUser.id, selectedGrade)}
                  className="flex-1 px-4 py-2 bg-[#47a263] text-[#003919] rounded-lg font-semibold hover:opacity-90 transition-all"
                >
                  Assign Grade {selectedGrade}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#171f33] border border-[#3f4940] rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#dae2fd]">Edit User</h2>
              <button onClick={() => setShowModal(false)} className="text-[#becabd] hover:text-[#dae2fd]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 text-[#becabd] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              {formData.role === 'student' && (
                <div>
                  <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">Grade</label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: parseInt(e.target.value) })}
                    className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none"
                  >
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => (
                      <option key={g} value={g}>Grade {g}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => { setShowModal(false); setSelectedUser(null); }}
                  className="flex-1 px-4 py-2 border border-[#3f4940] text-[#becabd] rounded-lg font-semibold hover:bg-[#2d3449] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      await api.patch(`/users/${selectedUser.id}/grade`, {
                        grade: formData.role === 'student' ? formData.grade : undefined,
                      });
                      toast.success('User updated!');
                      setShowModal(false);
                      fetchUsers();
                    } catch (error) {
                      toast.error('Failed to update user');
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-[#47a263] text-[#003919] rounded-lg font-semibold hover:opacity-90 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Institution Modal */}
      {showInstitutionModal && selectedUserForAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#171f33] border border-[#3f4940] rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#dae2fd] flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#89ceff]" />
                Assign Institution
              </h2>
              <button onClick={() => { setShowInstitutionModal(false); resetActionState(); }} className="text-[#becabd] hover:text-[#dae2fd]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-[#060e20] border border-[#3f4940] rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-[#dae2fd]">{selectedUserForAction.firstName} {selectedUserForAction.lastName}</p>
              <p className="text-xs text-[#becabd]">{selectedUserForAction.email}</p>
              <p className="text-xs text-[#89ceff] mt-1 capitalize">{selectedUserForAction.role.replace('_', ' ')}</p>
            </div>
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setUseExistingInstitution(true)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                    useExistingInstitution ? 'bg-[#47a263] text-[#003919]' : 'bg-[#060e20] border border-[#3f4940] text-[#dae2fd]'
                  }`}
                >
                  Existing Institution
                </button>
                <button
                  onClick={() => setUseExistingInstitution(false)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                    !useExistingInstitution ? 'bg-[#47a263] text-[#003919]' : 'bg-[#060e20] border border-[#3f4940] text-[#dae2fd]'
                  }`}
                >
                  Create New
                </button>
              </div>
              {useExistingInstitution ? (
                <div>
                  <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">Select Institution</label>
                  <select
                    value={selectedInstitutionId}
                    onChange={(e) => setSelectedInstitutionId(e.target.value)}
                    className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none"
                  >
                    <option value="">Select institution...</option>
                    {institutions.map(inst => (
                      <option key={inst.id} value={inst.id}>{inst.name} ({inst.code})</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">Institution Name</label>
                    <input type="text" value={newInstitutionData.name} onChange={(e) => setNewInstitutionData({ ...newInstitutionData, name: e.target.value })} className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none" placeholder="e.g. Greenfield Academy" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">Code</label>
                      <input type="text" value={newInstitutionData.code} onChange={(e) => setNewInstitutionData({ ...newInstitutionData, code: e.target.value })} className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none" placeholder="e.g. GFA-001" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">Type</label>
                      <select value={newInstitutionData.type} onChange={(e) => setNewInstitutionData({ ...newInstitutionData, type: e.target.value })} className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none">
                        <option value="basic_education">Category A: Basic Education (Pre-Primary - JSS)</option>
                        <option value="senior_secondary">Category B: Senior Secondary (Grades 10-12)</option>
                        <option value="academy">Academy</option>
                        <option value="tuition_center">Tuition Center</option>
                        <option value="homeschool">Homeschool</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">County</label>
                    <input type="text" value={newInstitutionData.county} onChange={(e) => setNewInstitutionData({ ...newInstitutionData, county: e.target.value })} className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none" placeholder="e.g. Nairobi" />
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowInstitutionModal(false); resetActionState(); }} className="flex-1 px-4 py-2 border border-[#3f4940] text-[#becabd] rounded-lg font-semibold hover:bg-[#2d3449] transition-all">Cancel</button>
                <button onClick={handleAssignInstitution} className="flex-1 px-4 py-2 bg-[#47a263] text-[#003919] rounded-lg font-semibold hover:opacity-90 transition-all">Assign</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Promote to Admin Modal */}
      {showPromoteModal && selectedUserForAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#171f33] border border-[#3f4940] rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#dae2fd] flex items-center gap-2">
                <UserCog className="w-5 h-5 text-[#b7c8e1]" />
                Promote to Institution Admin
              </h2>
              <button onClick={() => { setShowPromoteModal(false); resetActionState(); }} className="text-[#becabd] hover:text-[#dae2fd]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-[#060e20] border border-[#3f4940] rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-[#dae2fd]">{selectedUserForAction.firstName} {selectedUserForAction.lastName}</p>
              <p className="text-xs text-[#becabd]">{selectedUserForAction.email}</p>
              <p className="text-xs text-[#b7c8e1] mt-1 capitalize">{selectedUserForAction.role.replace('_', ' ')}</p>
            </div>
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setUseExistingInstitution(true)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                    useExistingInstitution ? 'bg-[#47a263] text-[#003919]' : 'bg-[#060e20] border border-[#3f4940] text-[#dae2fd]'
                  }`}
                >
                  Existing Institution
                </button>
                <button
                  onClick={() => setUseExistingInstitution(false)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                    !useExistingInstitution ? 'bg-[#47a263] text-[#003919]' : 'bg-[#060e20] border border-[#3f4940] text-[#dae2fd]'
                  }`}
                >
                  Create New
                </button>
              </div>
              {useExistingInstitution ? (
                <div>
                  <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">Select Institution</label>
                  <select
                    value={selectedInstitutionId}
                    onChange={(e) => setSelectedInstitutionId(e.target.value)}
                    className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none"
                  >
                    <option value="">Select institution...</option>
                    {institutions.map(inst => (
                      <option key={inst.id} value={inst.id}>{inst.name} ({inst.code})</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">Institution Name</label>
                    <input type="text" value={newInstitutionData.name} onChange={(e) => setNewInstitutionData({ ...newInstitutionData, name: e.target.value })} className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none" placeholder="e.g. Greenfield Academy" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">Code</label>
                      <input type="text" value={newInstitutionData.code} onChange={(e) => setNewInstitutionData({ ...newInstitutionData, code: e.target.value })} className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none" placeholder="e.g. GFA-001" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">Type</label>
                      <select value={newInstitutionData.type} onChange={(e) => setNewInstitutionData({ ...newInstitutionData, type: e.target.value })} className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none">
                        <option value="basic_education">Category A: Basic Education (Pre-Primary - JSS)</option>
                        <option value="senior_secondary">Category B: Senior Secondary (Grades 10-12)</option>
                        <option value="academy">Academy</option>
                        <option value="tuition_center">Tuition Center</option>
                        <option value="homeschool">Homeschool</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">County</label>
                    <input type="text" value={newInstitutionData.county} onChange={(e) => setNewInstitutionData({ ...newInstitutionData, county: e.target.value })} className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none" placeholder="e.g. Nairobi" />
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowPromoteModal(false); resetActionState(); }} className="flex-1 px-4 py-2 border border-[#3f4940] text-[#becabd] rounded-lg font-semibold hover:bg-[#2d3449] transition-all">Cancel</button>
                <button onClick={handlePromoteToAdmin} className="flex-1 px-4 py-2 bg-[#47a263] text-[#003919] rounded-lg font-semibold hover:opacity-90 transition-all">Promote</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suspend User Modal */}
      {showSuspendModal && selectedUserForAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#171f33] border border-amber-500/30 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                <Ban className="w-5 h-5" />
                Suspend User
              </h2>
              <button onClick={() => { setShowSuspendModal(false); setSuspendReason(''); setSelectedUserForAction(null); }} className="text-[#becabd] hover:text-[#dae2fd]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-[#060e20] border border-[#3f4940] rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-[#dae2fd]">{selectedUserForAction.firstName} {selectedUserForAction.lastName}</p>
              <p className="text-xs text-[#becabd]">{selectedUserForAction.email}</p>
              <p className="text-xs text-amber-400 mt-1 capitalize">{selectedUserForAction.role.replace('_', ' ')}</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">Suspension Reason (Optional)</label>
                <textarea
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 text-[#dae2fd] text-sm focus:border-amber-400 outline-none"
                  rows={3}
                  placeholder="e.g. Violation of code of conduct..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowSuspendModal(false); setSuspendReason(''); setSelectedUserForAction(null); }} className="flex-1 px-4 py-2 border border-[#3f4940] text-[#becabd] rounded-lg font-semibold hover:bg-[#2d3449] transition-all">Cancel</button>
                <button onClick={handleSuspendUser} className="flex-1 px-4 py-2 bg-amber-500 text-black rounded-lg font-semibold hover:opacity-90 transition-all">Suspend User</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUserForAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#171f33] border border-red-500/30 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-red-400 flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Delete User Account
              </h2>
              <button onClick={() => { setShowDeleteModal(false); setSelectedUserForAction(null); }} className="text-[#becabd] hover:text-[#dae2fd]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-[#060e20] border border-[#3f4940] rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-[#dae2fd]">{selectedUserForAction.firstName} {selectedUserForAction.lastName}</p>
              <p className="text-xs text-[#becabd]">{selectedUserForAction.email}</p>
              <p className="text-xs text-red-400 mt-1 capitalize">{selectedUserForAction.role.replace('_', ' ')}</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
              <p className="text-xs text-red-300">This will soft-delete the account. The user will not be able to log in. You can restore the account later if needed.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowDeleteModal(false); setSelectedUserForAction(null); }} className="flex-1 px-4 py-2 border border-[#3f4940] text-[#becabd] rounded-lg font-semibold hover:bg-[#2d3449] transition-all">Cancel</button>
              <button onClick={handleSoftDeleteUser} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:opacity-90 transition-all">Delete Account</button>
            </div>
          </div>
        </div>
      )}

      {/* Restore User Modal */}
      {showRestoreModal && selectedUserForAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#171f33] border border-[#89ceff]/30 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#89ceff] flex items-center gap-2">
                <RotateCcw className="w-5 h-5" />
                Restore User Account
              </h2>
              <button onClick={() => { setShowRestoreModal(false); setSelectedUserForAction(null); }} className="text-[#becabd] hover:text-[#dae2fd]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-[#060e20] border border-[#3f4940] rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-[#dae2fd]">{selectedUserForAction.firstName} {selectedUserForAction.lastName}</p>
              <p className="text-xs text-[#becabd]">{selectedUserForAction.email}</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowRestoreModal(false); setSelectedUserForAction(null); }} className="flex-1 px-4 py-2 border border-[#3f4940] text-[#becabd] rounded-lg font-semibold hover:bg-[#2d3449] transition-all">Cancel</button>
              <button onClick={handleRestoreUser} className="flex-1 px-4 py-2 bg-[#89ceff] text-black rounded-lg font-semibold hover:opacity-90 transition-all">Restore Account</button>
            </div>
          </div>
        </div>
      )}

      {/* Demote User Modal */}
      {showDemoteModal && selectedUserForAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#171f33] border border-[#b7c8e1]/30 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#b7c8e1] flex items-center gap-2">
                <UserMinus className="w-5 h-5" />
                Demote User
              </h2>
              <button onClick={() => { setShowDemoteModal(false); setSelectedUserForAction(null); setDemoteRole('student'); }} className="text-[#becabd] hover:text-[#dae2fd]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-[#060e20] border border-[#3f4940] rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-[#dae2fd]">{selectedUserForAction.firstName} {selectedUserForAction.lastName}</p>
              <p className="text-xs text-[#becabd]">{selectedUserForAction.email}</p>
              <p className="text-xs text-[#b7c8e1] mt-1 capitalize">Current: {selectedUserForAction.role.replace('_', ' ')}</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">New Role</label>
                <select
                  value={demoteRole}
                  onChange={(e) => setDemoteRole(e.target.value)}
                  className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 text-[#dae2fd] text-sm focus:border-[#b7c8e1] outline-none"
                >
                  {selectedUserForAction.role === 'institution_admin' && (
                    <>
                      <option value="teacher">Teacher</option>
                      <option value="tutor">Tutor</option>
                      <option value="student">Student</option>
                    </>
                  )}
                  {(selectedUserForAction.role === 'teacher' || selectedUserForAction.role === 'tutor') && (
                    <option value="student">Student</option>
                  )}
                </select>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <p className="text-xs text-amber-300">This will change the user's primary role and remove associated privileges.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowDemoteModal(false); setSelectedUserForAction(null); setDemoteRole('student'); }} className="flex-1 px-4 py-2 border border-[#3f4940] text-[#becabd] rounded-lg font-semibold hover:bg-[#2d3449] transition-all">Cancel</button>
                <button onClick={handleDemoteUser} className="flex-1 px-4 py-2 bg-[#b7c8e1] text-black rounded-lg font-semibold hover:opacity-90 transition-all">Demote User</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}