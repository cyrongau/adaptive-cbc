import { create } from 'zustand';
import api from '../lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  secondaryRoles?: string[];
  onboardingStatus: string;
  phone?: string;
  grade?: string;
  avatar?: string;
  term?: number;
  stream?: string;
  dateOfBirth?: string;
  isEmailVerified?: boolean;
  isActive?: boolean;
  kycStatus?: string;
  institutionId?: string;
  createdAt?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isTwoFactorPending: boolean;
  tempEmail: string | null;
  tempPhone: string | null;
  resetEmail: string | null;
  devResetToken: string | null;

  login: (email: string, password: string) => Promise<boolean>;
  register: (payload: {
    email: string;
    phone: string;
    fullName: string;
    grade?: string;
    role?: string;
    institutionApplication?: {
      institutionName: string;
      institutionType: string;
      county: string;
      address: string;
      phone: string;
    };
    invitationToken?: string;
  }) => Promise<boolean>;
  verifyOtp: (code: string) => Promise<boolean>;
  forgotPassword: (emailOrPhone: string) => Promise<boolean>;
  resetPassword: (token: string, newPassword: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  initialize: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  loading: false,
  error: null,
  isTwoFactorPending: false,
  tempEmail: null,
  tempPhone: null,
  resetEmail: null,
  devResetToken: null,

  clearError: () => set({ error: null }),

  initialize: () => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        set({
          user: JSON.parse(savedUser),
          token: 'authenticated',
        });
      }
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      // Hit backend login API
      const response = await api.post('/auth/login', { email, password });

      set({
        isTwoFactorPending: true,
        tempEmail: response.data.tempEmail || email,
        tempPhone: '0712345678', // mock for demo UI
        loading: false,
      });
      return true;
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Invalid email or password';
      set({ error: errMsg, loading: false });
      return false;
    }
  },

  register: async (payload) => {
    set({ loading: true, error: null });
    try {
      const names = payload.fullName.trim().split(' ');
      const firstName = names[0] || 'User';
      const lastName = names.slice(1).join(' ') || '';

      const registerData: any = {
        email: payload.email,
        phone: payload.phone,
        firstName,
        lastName,
        role: payload.role || 'student',
        password: 'TemporaryPassword123!',
      };

      if (payload.grade) {
        registerData.grade = parseInt(payload.grade.replace('Grade ', ''));
      }

      if (payload.institutionApplication) {
        registerData.institutionApplication = payload.institutionApplication;
      }

      if (payload.invitationToken) {
        registerData.invitationToken = payload.invitationToken;
      }

      const response = await api.post('/auth/register', registerData);

      set({
        isTwoFactorPending: true,
        tempEmail: response.data.tempEmail || payload.email,
        tempPhone: payload.phone,
        loading: false,
      });
      return true;
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Registration failed. Email or phone might already be in use.';
      set({ error: errMsg, loading: false });
      return false;
    }
  },

  verifyOtp: async (code) => {
    set({ loading: true, error: null });
    try {
      const tempEmail = get().tempEmail;
      if (!tempEmail) {
        throw new Error('Session expired. Please try logging in again.');
      }

      // Hit real backend verify-otp API
      const response = await api.post('/auth/verify-otp', { email: tempEmail, code });
      const { accessToken, user } = response.data;

      // Persist user profile
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(user));
      }

      set({
        user,
        token: accessToken || 'authenticated',
        isTwoFactorPending: false,
        tempEmail: null,
        tempPhone: null,
        loading: false,
      });
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Invalid verification code', loading: false });
      return false;
    }
  },

  forgotPassword: async (emailOrPhone) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/forgot-password', { email: emailOrPhone });
      const devToken = response.data?.resetToken || null;
      set({ resetEmail: emailOrPhone, devResetToken: devToken, loading: false });
      return true;
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Failed to send reset code';
      set({ error: errMsg, loading: false });
      return false;
    }
  },

  resetPassword: async (token, newPassword) => {
    set({ loading: true, error: null });
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      set({ resetEmail: null, devResetToken: null, loading: false });
      return true;
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Invalid or expired reset code';
      set({ error: errMsg, loading: false });
      return false;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error', err);
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
    set({
      user: null,
      token: null,
      isTwoFactorPending: false,
      tempEmail: null,
      tempPhone: null,
      resetEmail: null,
      devResetToken: null,
    });
  },

  refreshUser: async () => {
    try {
      const response = await api.get('/users/profile');
      const updatedUser = response.data;
      set({ user: updatedUser, token: 'authenticated' });
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  },

  updateUser: (updates: Partial<User>) => {
    set((state) => {
      if (!state.user) return state;
      const updatedUser = { ...state.user, ...updates };
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      return { user: updatedUser };
    });
  },
}));
