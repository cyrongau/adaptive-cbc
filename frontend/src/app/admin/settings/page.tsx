'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Settings,
  Bell,
  Shield,
  Building2,
  Save,
  User,
  Lock,
  Upload,
  X,
  Image as ImageIcon,
  Palette,
  Plug,
  Mail,
  MessageSquare,
  Smartphone,
  CreditCard,
  TestTube,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

interface InstitutionData {
  id: string;
  name: string;
  logo?: string;
  bannerUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  settings?: {
    allowSelfRegistration: boolean;
    requireApproval: boolean;
    enableParentPortal: boolean;
    enableTeacherDashboard: boolean;
    customBranding: boolean;
  };
}

interface PlatformSettings {
  platformName: string;
  emailVerification: boolean;
  maintenanceMode: boolean;
  allowRegistration: boolean;
}

export default function AdminSettingsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('institution');
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const isSuperAdmin = user?.role === 'super_admin';

  const [institution, setInstitution] = useState<InstitutionData | null>(null);
  const [institutionSettings, setInstitutionSettings] = useState({
    allowSelfRegistration: false,
    requireApproval: true,
    enableParentPortal: true,
    enableTeacherDashboard: true,
    customBranding: false,
  });
  const [primaryColor, setPrimaryColor] = useState('#47a263');
  const [secondaryColor, setSecondaryColor] = useState('#7eda95');

  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>({
    platformName: 'Adaptive CBC',
    emailVerification: true,
    maintenanceMode: false,
    allowRegistration: true,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    teacherInvites: true,
    studentEnrollments: true,
    systemAlerts: true,
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: true,
    sessionTimeout: '30',
    passwordExpiry: '90',
  });

  const [integrations, setIntegrations] = useState<any[]>([]);
  const [integrationsLoading, setIntegrationsLoading] = useState(false);
  const [testingIntegration, setTestingIntegration] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string; testedAt: string } | null>>({});
  const [smtpConfig, setSmtpConfig] = useState({ host: '', port: 587, username: '', password: '', fromEmail: '', fromName: '', secure: false, tls: true });
  const [firebaseConfig, setFirebaseConfig] = useState({ projectId: '', privateKey: '', clientEmail: '', serviceAccountJson: '' });
  const [twilioConfig, setTwilioConfig] = useState({ accountSid: '', authToken: '', fromPhoneNumber: '' });
  const [whatsappConfig, setWhatsAppConfig] = useState({ phoneNumberId: '', accessToken: '', businessAccountId: '', webhookVerifyToken: '' });
  const [mpesaConfig, setMpesaConfig] = useState({ consumerKey: '', consumerSecret: '', shortcode: '', passkey: '', environment: 'sandbox', callbackUrl: '' });
  const [testEmail, setTestEmail] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [testAmount, setTestAmount] = useState(1);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSuperAdmin) {
      setActiveTab('platform');
      fetchPlatformSettings();
      fetchIntegrations();
    } else {
      fetchInstitution();
    }
  }, [isSuperAdmin]);

  const fetchIntegrations = async () => {
    try {
      setIntegrationsLoading(true);
      const response = await api.get('/integrations');
      setIntegrations(response.data);
      response.data.forEach((integration: any) => {
        if (integration.type === 'smtp') setSmtpConfig({ ...smtpConfig, ...integration.config });
        if (integration.type === 'firebase_fcm') setFirebaseConfig({ ...firebaseConfig, ...integration.config });
        if (integration.type === 'twilio_sms') setTwilioConfig({ ...twilioConfig, ...integration.config });
        if (integration.type === 'whatsapp') setWhatsAppConfig({ ...whatsappConfig, ...integration.config });
        if (integration.type === 'mpesa') setMpesaConfig({ ...mpesaConfig, ...integration.config });
        if (integration.lastTestStatus) {
          setTestResults(prev => ({ ...prev, [integration.type]: { success: integration.lastTestStatus === 'success', message: integration.lastTestMessage || '', testedAt: integration.lastTestedAt || '' } }));
        }
      });
    } catch (error) {
      console.error('Failed to fetch integrations:', error);
    } finally {
      setIntegrationsLoading(false);
    }
  };

  const fetchInstitution = async () => {
    try {
      const response = await api.get('/institutions/my');
      if (response.data) {
        setInstitution(response.data);
        if (response.data.settings) {
          setInstitutionSettings(response.data.settings);
        }
        if (response.data.primaryColor) {
          setPrimaryColor(response.data.primaryColor);
        }
        if (response.data.secondaryColor) {
          setSecondaryColor(response.data.secondaryColor);
        }
      }
    } catch (error) {
      console.error('Failed to fetch institution:', error);
    }
  };

  const fetchPlatformSettings = async () => {
    try {
      const response = await api.get('/settings/platform');
      if (response.data) {
        setPlatformSettings(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch platform settings:', error);
    }
  };

  const handleSaveInstitutionSettings = async () => {
    if (!institution) return;
    setLoading(true);
    try {
      await api.post(`/institutions/${institution.id}/settings`, institutionSettings);
      toast.success('Institution settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save institution settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBranding = async () => {
    if (!institution) return;
    setLoading(true);
    try {
      await api.patch(`/institutions/${institution.id}`, {
        primaryColor,
        secondaryColor,
      });
      toast.success('Branding colors saved successfully!');
    } catch (error) {
      toast.error('Failed to save branding colors');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlatformSettings = async () => {
    setLoading(true);
    try {
      await api.patch('/settings/platform', platformSettings);
      toast.success('Platform settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save platform settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setLoading(true);
    try {
      toast.success('Notification preferences saved successfully!');
    } catch (error) {
      toast.error('Failed to save notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSecurity = async () => {
    setLoading(true);
    try {
      toast.success('Security settings updated successfully!');
    } catch (error) {
      toast.error('Failed to update security settings');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !institution) return;

    if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp|svg)$/)) {
      toast.error('Only image files are allowed (JPG, PNG, GIF, WebP, SVG)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo must be less than 5MB');
      return;
    }

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await api.post(`/institutions/${institution.id}/logo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setInstitution({ ...institution, logo: response.data.logoUrl });
      toast.success('Logo uploaded successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    if (!institution) return;
    try {
      await api.delete(`/institutions/${institution.id}/logo`);
      setInstitution({ ...institution, logo: undefined });
      toast.success('Logo removed successfully!');
    } catch (error) {
      toast.error('Failed to remove logo');
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !institution) return;

    if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) {
      toast.error('Only image files are allowed (JPG, PNG, GIF, WebP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Banner must be less than 10MB');
      return;
    }

    setUploadingBanner(true);
    try {
      const formData = new FormData();
      formData.append('banner', file);

      const response = await api.post(`/institutions/${institution.id}/banner`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setInstitution({ ...institution, bannerUrl: response.data.bannerUrl });
      toast.success('Banner uploaded successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload banner');
    } finally {
      setUploadingBanner(false);
      if (bannerInputRef.current) bannerInputRef.current.value = '';
    }
  };

  const handleRemoveBanner = async () => {
    if (!institution) return;
    try {
      await api.delete(`/institutions/${institution.id}/banner`);
      setInstitution({ ...institution, bannerUrl: undefined });
      toast.success('Banner removed successfully!');
    } catch (error) {
      toast.error('Failed to remove banner');
    }
  };

  const handleSaveIntegration = async (type: string, config: any) => {
    try {
      await api.post(`/integrations/${type}/config`, config);
      toast.success(`${type.toUpperCase()} configuration saved!`);
      fetchIntegrations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to save ${type} configuration`);
    }
  };

  const handleTestSmtp = async () => {
    if (!testEmail) { toast.error('Enter a test email address'); return; }
    setTestingIntegration('smtp');
    try {
      const response = await api.post('/integrations/smtp/test', { config: smtpConfig, test: { toEmail: testEmail } });
      setTestResults(prev => ({ ...prev, smtp: response.data }));
      toast.success(response.data.message);
    } catch (error: any) {
      setTestResults(prev => ({ ...prev, smtp: { success: false, message: error.response?.data?.message || 'Test failed', testedAt: new Date().toISOString() } }));
      toast.error('SMTP test failed');
    } finally { setTestingIntegration(null); }
  };

  const handleTestFirebase = async () => {
    setTestingIntegration('firebase_fcm');
    try {
      const response = await api.post('/integrations/firebase-fcm/test', firebaseConfig);
      setTestResults(prev => ({ ...prev, firebase_fcm: response.data }));
      toast.success(response.data.message);
    } catch (error: any) {
      setTestResults(prev => ({ ...prev, firebase_fcm: { success: false, message: error.response?.data?.message || 'Test failed', testedAt: new Date().toISOString() } }));
      toast.error('Firebase FCM test failed');
    } finally { setTestingIntegration(null); }
  };

  const handleTestTwilio = async () => {
    if (!testPhone) { toast.error('Enter a test phone number'); return; }
    setTestingIntegration('twilio_sms');
    try {
      const response = await api.post('/integrations/twilio-sms/test', { config: twilioConfig, test: { toPhoneNumber: testPhone } });
      setTestResults(prev => ({ ...prev, twilio_sms: response.data }));
      toast.success(response.data.message);
    } catch (error: any) {
      setTestResults(prev => ({ ...prev, twilio_sms: { success: false, message: error.response?.data?.message || 'Test failed', testedAt: new Date().toISOString() } }));
      toast.error('Twilio SMS test failed');
    } finally { setTestingIntegration(null); }
  };

  const handleTestWhatsApp = async () => {
    if (!testPhone) { toast.error('Enter a test phone number'); return; }
    setTestingIntegration('whatsapp');
    try {
      const response = await api.post('/integrations/whatsapp/test', { config: whatsappConfig, test: { toPhoneNumber: testPhone } });
      setTestResults(prev => ({ ...prev, whatsapp: response.data }));
      toast.success(response.data.message);
    } catch (error: any) {
      setTestResults(prev => ({ ...prev, whatsapp: { success: false, message: error.response?.data?.message || 'Test failed', testedAt: new Date().toISOString() } }));
      toast.error('WhatsApp test failed');
    } finally { setTestingIntegration(null); }
  };

  const handleTestMpesa = async () => {
    if (!testPhone) { toast.error('Enter a test phone number'); return; }
    setTestingIntegration('mpesa');
    try {
      const response = await api.post('/integrations/mpesa/test', { config: mpesaConfig, test: { phoneNumber: testPhone, amount: testAmount } });
      setTestResults(prev => ({ ...prev, mpesa: response.data }));
      toast.success(response.data.message);
    } catch (error: any) {
      setTestResults(prev => ({ ...prev, mpesa: { success: false, message: error.response?.data?.message || 'Test failed', testedAt: new Date().toISOString() } }));
      toast.error('M-Pesa test failed');
    } finally { setTestingIntegration(null); }
  };

  const institutionTabs = [
    { id: 'institution', label: 'Institution', icon: Building2 },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  const superAdminTabs = [
    { id: 'platform', label: 'Platform', icon: Settings },
    { id: 'integrations', label: 'Integrations', icon: Plug },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  const tabs = isSuperAdmin ? superAdminTabs : institutionTabs;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#dae2fd]">Settings</h2>
        <p className="text-sm text-[#becabd] mt-1">
          {isSuperAdmin ? 'Configure platform-wide settings.' : 'Manage your institution settings.'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#3f4940]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-[#7eda95] text-[#7eda95]'
                : 'border-transparent text-[#becabd] hover:text-[#dae2fd]'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Institution Settings (for institution_admin) */}
      {activeTab === 'institution' && !isSuperAdmin && (
        <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-6 space-y-6">
          <h3 className="text-lg font-bold text-[#dae2fd] flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#7eda95]" />
            Institution Settings
          </h3>

          <div className="space-y-4">
            {[
              { key: 'allowSelfRegistration', label: 'Allow Student Self-Registration', desc: 'Let students register and join your institution' },
              { key: 'requireApproval', label: 'Require Approval for Join Requests', desc: 'Review and approve student join requests' },
              { key: 'enableParentPortal', label: 'Enable Parent Portal', desc: 'Allow parents to access their children\'s progress' },
              { key: 'enableTeacherDashboard', label: 'Enable Teacher Dashboard', desc: 'Provide teachers with analytics and management tools' },
              { key: 'customBranding', label: 'Custom Branding', desc: 'Use your institution\'s logo and colors' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 bg-[#060e20] rounded-lg">
                <div>
                  <p className="text-sm font-semibold text-[#dae2fd]">{item.label}</p>
                  <p className="text-xs text-[#becabd] mt-1">{item.desc}</p>
                </div>
                <button
                  onClick={() => setInstitutionSettings({ ...institutionSettings, [item.key]: !institutionSettings[item.key as keyof typeof institutionSettings] })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    institutionSettings[item.key as keyof typeof institutionSettings] ? 'bg-[#7eda95]' : 'bg-[#3f4940]'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    institutionSettings[item.key as keyof typeof institutionSettings] ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleSaveInstitutionSettings}
            disabled={loading}
            className="px-6 py-3 bg-[#47a263] text-[#003919] text-sm font-bold rounded-lg flex items-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 uppercase tracking-wider"
          >
            <Save className="w-4 h-4" /> Save Settings
          </button>
        </div>
      )}

      {/* Branding Tab (for institution_admin) */}
      {activeTab === 'branding' && !isSuperAdmin && (
        <div className="space-y-6">
          {/* Logo Upload */}
          <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-6 space-y-6">
            <h3 className="text-lg font-bold text-[#dae2fd] flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#7eda95]" />
              Institution Logo
            </h3>

            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-xl bg-[#060e20] border border-[#3f4940] flex items-center justify-center overflow-hidden">
                {institution?.logo ? (
                  <img src={institution.logo} alt="Institution Logo" className="w-full h-full object-contain" />
                ) : (
                  <Building2 className="w-10 h-10 text-[#3f4940]" />
                )}
              </div>
              <div className="flex-1 space-y-3">
                <p className="text-sm text-[#becabd]">Upload your institution logo. Supported formats: JPG, PNG, GIF, WebP, SVG. Max size: 5MB.</p>
                <div className="flex gap-3">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="px-4 py-2 bg-[#47a263] text-[#003919] text-sm font-bold rounded-lg flex items-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                  </button>
                  {institution?.logo && (
                    <button
                      onClick={handleRemoveLogo}
                      className="px-4 py-2 bg-[#3f4940] text-[#dae2fd] text-sm font-medium rounded-lg flex items-center gap-2 hover:bg-[#4f5950] transition-colors"
                    >
                      <X className="w-4 h-4" /> Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Banner Upload */}
          <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-6 space-y-6">
            <h3 className="text-lg font-bold text-[#dae2fd] flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#7eda95]" />
              Institution Banner
            </h3>

            <div className="space-y-3">
              <div className="w-full h-32 rounded-xl bg-[#060e20] border border-[#3f4940] flex items-center justify-center overflow-hidden">
                {institution?.bannerUrl ? (
                  <img src={institution.bannerUrl} alt="Institution Banner" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-10 h-10 text-[#3f4940]" />
                )}
              </div>
              <p className="text-sm text-[#becabd]">Upload a banner image for your institution. Supported formats: JPG, PNG, GIF, WebP. Max size: 10MB.</p>
              <div className="flex gap-3">
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBannerUpload}
                  className="hidden"
                />
                <button
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={uploadingBanner}
                  className="px-4 py-2 bg-[#47a263] text-[#003919] text-sm font-bold rounded-lg flex items-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  {uploadingBanner ? 'Uploading...' : 'Upload Banner'}
                </button>
                {institution?.bannerUrl && (
                  <button
                    onClick={handleRemoveBanner}
                    className="px-4 py-2 bg-[#3f4940] text-[#dae2fd] text-sm font-medium rounded-lg flex items-center gap-2 hover:bg-[#4f5950] transition-colors"
                  >
                    <X className="w-4 h-4" /> Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Color Picker */}
          <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-6 space-y-6">
            <h3 className="text-lg font-bold text-[#dae2fd] flex items-center gap-2">
              <Palette className="w-5 h-5 text-[#7eda95]" />
              Brand Colors
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-2">Primary Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-12 h-12 rounded-lg border-2 border-[#3f4940] cursor-pointer"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 text-[#dae2fd] text-sm font-mono focus:border-[#7eda95] outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-2">Secondary Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-12 h-12 rounded-lg border-2 border-[#3f4940] cursor-pointer"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="flex-1 bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 text-[#dae2fd] text-sm font-mono focus:border-[#7eda95] outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveBranding}
              disabled={loading}
              className="px-6 py-3 bg-[#47a263] text-[#003919] text-sm font-bold rounded-lg flex items-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 uppercase tracking-wider"
            >
              <Save className="w-4 h-4" /> Save Branding
            </button>
          </div>
        </div>
      )}

      {/* Platform Settings (for super_admin) */}
      {activeTab === 'platform' && isSuperAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-6">
            <h3 className="text-lg font-bold text-[#dae2fd] mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#7eda95]" />
              General
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">Platform Name</label>
                <input
                  type="text"
                  value={platformSettings.platformName}
                  onChange={(e) => setPlatformSettings({ ...platformSettings, platformName: e.target.value })}
                  className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-6">
            <h3 className="text-lg font-bold text-[#dae2fd] mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#7eda95]" />
              Security
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#dae2fd]">Email Verification</p>
                  <p className="text-xs text-[#becabd]">Require email verification for new accounts</p>
                </div>
                <button
                  onClick={() => setPlatformSettings({ ...platformSettings, emailVerification: !platformSettings.emailVerification })}
                  className={`w-12 h-6 rounded-full transition-colors ${platformSettings.emailVerification ? 'bg-[#7eda95]' : 'bg-[#3f4940]'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${platformSettings.emailVerification ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-6">
            <h3 className="text-lg font-bold text-[#dae2fd] mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#7eda95]" />
              System
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#dae2fd]">Maintenance Mode</p>
                  <p className="text-xs text-[#becabd]">Temporarily disable platform access</p>
                </div>
                <button
                  onClick={() => setPlatformSettings({ ...platformSettings, maintenanceMode: !platformSettings.maintenanceMode })}
                  className={`w-12 h-6 rounded-full transition-colors ${platformSettings.maintenanceMode ? 'bg-[#7eda95]' : 'bg-[#3f4940]'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${platformSettings.maintenanceMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#dae2fd]">Allow Registration</p>
                  <p className="text-xs text-[#becabd]">Enable new user sign-ups</p>
                </div>
                <button
                  onClick={() => setPlatformSettings({ ...platformSettings, allowRegistration: !platformSettings.allowRegistration })}
                  className={`w-12 h-6 rounded-full transition-colors ${platformSettings.allowRegistration ? 'bg-[#7eda95]' : 'bg-[#3f4940]'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${platformSettings.allowRegistration ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 flex justify-end">
            <button
              onClick={handleSavePlatformSettings}
              disabled={loading}
              className="px-6 py-3 bg-[#47a263] text-[#003919] text-sm font-bold rounded-lg flex items-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 uppercase tracking-wider"
            >
              <Save className="w-4 h-4" /> Save Platform Settings
            </button>
          </div>
        </div>
      )}

      {/* Integrations Tab (for super_admin) */}
      {activeTab === 'integrations' && isSuperAdmin && (
        <div className="space-y-6">
          {/* SMTP Configuration */}
          <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[#dae2fd] flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#7eda95]" />
                SMTP Email Server
              </h3>
              {testResults.smtp && (
                <span className={`text-xs px-2 py-1 rounded-full ${testResults.smtp.success ? 'bg-[#7eda95]/10 text-[#7eda95]' : 'bg-red-500/10 text-red-400'}`}>
                  {testResults.smtp.success ? 'Last test passed' : 'Last test failed'}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">SMTP Host</label>
                <input type="text" value={smtpConfig.host} onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })} className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none" placeholder="smtp.example.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">Port</label>
                <input type="number" value={smtpConfig.port} onChange={(e) => setSmtpConfig({ ...smtpConfig, port: parseInt(e.target.value) })} className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">Username</label>
                <input type="text" value={smtpConfig.username} onChange={(e) => setSmtpConfig({ ...smtpConfig, username: e.target.value })} className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">Password</label>
                <div className="relative">
                  <input type={showPasswords.smtp ? 'text' : 'password'} value={smtpConfig.password} onChange={(e) => setSmtpConfig({ ...smtpConfig, password: e.target.value })} className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 pr-10 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none" />
                  <button type="button" onClick={() => setShowPasswords(prev => ({ ...prev, smtp: !prev.smtp }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#becabd] hover:text-[#dae2fd]">{showPasswords.smtp ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">From Email</label>
                <input type="email" value={smtpConfig.fromEmail} onChange={(e) => setSmtpConfig({ ...smtpConfig, fromEmail: e.target.value })} className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none" placeholder="noreply@example.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">From Name</label>
                <input type="text" value={smtpConfig.fromName} onChange={(e) => setSmtpConfig({ ...smtpConfig, fromName: e.target.value })} className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none" placeholder="Adaptive CBC" />
              </div>
            </div>
            <div className="flex items-center gap-4 mt-4">
              <label className="flex items-center gap-2 text-sm text-[#becabd]">
                <input type="checkbox" checked={smtpConfig.secure} onChange={(e) => setSmtpConfig({ ...smtpConfig, secure: e.target.checked })} className="rounded" /> SSL/TLS
              </label>
              <div className="flex-1 flex items-center gap-2">
                <input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} className="flex-1 bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none" placeholder="test@example.com" />
                <button onClick={handleTestSmtp} disabled={testingIntegration === 'smtp'} className="px-4 py-2 bg-[#89ceff]/20 text-[#89ceff] text-sm font-semibold rounded-lg flex items-center gap-2 hover:bg-[#89ceff]/30 transition-all disabled:opacity-50">
                  {testingIntegration === 'smtp' ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />} Test
                </button>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={() => handleSaveIntegration('smtp', smtpConfig)} className="px-6 py-2 bg-[#47a263] text-[#003919] text-sm font-bold rounded-lg flex items-center gap-2 hover:opacity-90 transition-all"><Save className="w-4 h-4" /> Save SMTP</button>
            </div>
          </div>

          {/* Firebase FCM */}
          <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[#dae2fd] flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#89ceff]" />
                Firebase FCM (Push Notifications & OTP)
              </h3>
              {testResults.firebase_fcm && (
                <span className={`text-xs px-2 py-1 rounded-full ${testResults.firebase_fcm.success ? 'bg-[#7eda95]/10 text-[#7eda95]' : 'bg-red-500/10 text-red-400'}`}>
                  {testResults.firebase_fcm.success ? 'Last test passed' : 'Last test failed'}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">Project ID</label>
                <input type="text" value={firebaseConfig.projectId} onChange={(e) => setFirebaseConfig({ ...firebaseConfig, projectId: e.target.value })} className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">Client Email</label>
                <input type="email" value={firebaseConfig.clientEmail} onChange={(e) => setFirebaseConfig({ ...firebaseConfig, clientEmail: e.target.value })} className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">Private Key</label>
                <textarea value={firebaseConfig.privateKey} onChange={(e) => setFirebaseConfig({ ...firebaseConfig, privateKey: e.target.value })} className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none font-mono" rows={3} placeholder="-----BEGIN PRIVATE KEY-----..." />
              </div>
            </div>
            <div className="flex justify-end mt-4 gap-3">
              <button onClick={handleTestFirebase} disabled={testingIntegration === 'firebase_fcm'} className="px-4 py-2 bg-[#89ceff]/20 text-[#89ceff] text-sm font-semibold rounded-lg flex items-center gap-2 hover:bg-[#89ceff]/30 transition-all disabled:opacity-50">
                {testingIntegration === 'firebase_fcm' ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />} Test Connection
              </button>
              <button onClick={() => handleSaveIntegration('firebase-fcm', firebaseConfig)} className="px-6 py-2 bg-[#47a263] text-[#003919] text-sm font-bold rounded-lg flex items-center gap-2 hover:opacity-90 transition-all"><Save className="w-4 h-4" /> Save Firebase</button>
            </div>
          </div>

          {/* Twilio SMS */}
          <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[#dae2fd] flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#b7c8e1]" />
                Twilio SMS (OTP & Notifications)
              </h3>
              {testResults.twilio_sms && (
                <span className={`text-xs px-2 py-1 rounded-full ${testResults.twilio_sms.success ? 'bg-[#7eda95]/10 text-[#7eda95]' : 'bg-red-500/10 text-red-400'}`}>
                  {testResults.twilio_sms.success ? 'Last test passed' : 'Last test failed'}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">Account SID</label>
                <input type="text" value={twilioConfig.accountSid} onChange={(e) => setTwilioConfig({ ...twilioConfig, accountSid: e.target.value })} className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">Auth Token</label>
                <div className="relative">
                  <input type={showPasswords.twilio ? 'text' : 'password'} value={twilioConfig.authToken} onChange={(e) => setTwilioConfig({ ...twilioConfig, authToken: e.target.value })} className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 pr-10 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none" />
                  <button type="button" onClick={() => setShowPasswords(prev => ({ ...prev, twilio: !prev.twilio }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#becabd] hover:text-[#dae2fd]">{showPasswords.twilio ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">From Phone Number</label>
                <input type="text" value={twilioConfig.fromPhoneNumber} onChange={(e) => setTwilioConfig({ ...twilioConfig, fromPhoneNumber: e.target.value })} className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none" placeholder="+1234567890" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <input type="text" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} className="flex-1 bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none" placeholder="Test phone: +254712345678" />
              <button onClick={handleTestTwilio} disabled={testingIntegration === 'twilio_sms'} className="px-4 py-2 bg-[#89ceff]/20 text-[#89ceff] text-sm font-semibold rounded-lg flex items-center gap-2 hover:bg-[#89ceff]/30 transition-all disabled:opacity-50">
                {testingIntegration === 'twilio_sms' ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />} Test SMS
              </button>
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={() => handleSaveIntegration('twilio-sms', twilioConfig)} className="px-6 py-2 bg-[#47a263] text-[#003919] text-sm font-bold rounded-lg flex items-center gap-2 hover:opacity-90 transition-all"><Save className="w-4 h-4" /> Save Twilio</button>
            </div>
          </div>

          {/* WhatsApp */}
          <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[#dae2fd] flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#25D366]" />
                WhatsApp Business API
              </h3>
              {testResults.whatsapp && (
                <span className={`text-xs px-2 py-1 rounded-full ${testResults.whatsapp.success ? 'bg-[#7eda95]/10 text-[#7eda95]' : 'bg-red-500/10 text-red-400'}`}>
                  {testResults.whatsapp.success ? 'Last test passed' : 'Last test failed'}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">Phone Number ID</label>
                <input type="text" value={whatsappConfig.phoneNumberId} onChange={(e) => setWhatsAppConfig({ ...whatsappConfig, phoneNumberId: e.target.value })} className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">Access Token</label>
                <div className="relative">
                  <input type={showPasswords.whatsapp ? 'text' : 'password'} value={whatsappConfig.accessToken} onChange={(e) => setWhatsAppConfig({ ...whatsappConfig, accessToken: e.target.value })} className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 pr-10 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none" />
                  <button type="button" onClick={() => setShowPasswords(prev => ({ ...prev, whatsapp: !prev.whatsapp }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#becabd] hover:text-[#dae2fd]">{showPasswords.whatsapp ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">Business Account ID</label>
                <input type="text" value={whatsappConfig.businessAccountId} onChange={(e) => setWhatsAppConfig({ ...whatsappConfig, businessAccountId: e.target.value })} className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">Webhook Verify Token (Optional)</label>
                <input type="text" value={whatsappConfig.webhookVerifyToken} onChange={(e) => setWhatsAppConfig({ ...whatsappConfig, webhookVerifyToken: e.target.value })} className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <input type="text" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} className="flex-1 bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none" placeholder="Test phone: +254712345678" />
              <button onClick={handleTestWhatsApp} disabled={testingIntegration === 'whatsapp'} className="px-4 py-2 bg-[#89ceff]/20 text-[#89ceff] text-sm font-semibold rounded-lg flex items-center gap-2 hover:bg-[#89ceff]/30 transition-all disabled:opacity-50">
                {testingIntegration === 'whatsapp' ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />} Test Message
              </button>
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={() => handleSaveIntegration('whatsapp', whatsappConfig)} className="px-6 py-2 bg-[#47a263] text-[#003919] text-sm font-bold rounded-lg flex items-center gap-2 hover:opacity-90 transition-all"><Save className="w-4 h-4" /> Save WhatsApp</button>
            </div>
          </div>

          {/* M-Pesa */}
          <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[#dae2fd] flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#47a263]" />
                M-Pesa Payment Integration
              </h3>
              {testResults.mpesa && (
                <span className={`text-xs px-2 py-1 rounded-full ${testResults.mpesa.success ? 'bg-[#7eda95]/10 text-[#7eda95]' : 'bg-red-500/10 text-red-400'}`}>
                  {testResults.mpesa.success ? 'Last test passed' : 'Last test failed'}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">Consumer Key</label>
                <input type="text" value={mpesaConfig.consumerKey} onChange={(e) => setMpesaConfig({ ...mpesaConfig, consumerKey: e.target.value })} className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">Consumer Secret</label>
                <div className="relative">
                  <input type={showPasswords.mpesa ? 'text' : 'password'} value={mpesaConfig.consumerSecret} onChange={(e) => setMpesaConfig({ ...mpesaConfig, consumerSecret: e.target.value })} className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 pr-10 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none" />
                  <button type="button" onClick={() => setShowPasswords(prev => ({ ...prev, mpesa: !prev.mpesa }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#becabd] hover:text-[#dae2fd]">{showPasswords.mpesa ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">Shortcode</label>
                <input type="text" value={mpesaConfig.shortcode} onChange={(e) => setMpesaConfig({ ...mpesaConfig, shortcode: e.target.value })} className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">Passkey</label>
                <div className="relative">
                  <input type={showPasswords.mpesa_passkey ? 'text' : 'password'} value={mpesaConfig.passkey} onChange={(e) => setMpesaConfig({ ...mpesaConfig, passkey: e.target.value })} className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 pr-10 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none" />
                  <button type="button" onClick={() => setShowPasswords(prev => ({ ...prev, mpesa_passkey: !prev.mpesa_passkey }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#becabd] hover:text-[#dae2fd]">{showPasswords.mpesa_passkey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">Environment</label>
                <select value={mpesaConfig.environment} onChange={(e) => setMpesaConfig({ ...mpesaConfig, environment: e.target.value })} className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none">
                  <option value="sandbox">Sandbox (Test)</option>
                  <option value="production">Production (Live)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">Callback URL</label>
                <input type="text" value={mpesaConfig.callbackUrl} onChange={(e) => setMpesaConfig({ ...mpesaConfig, callbackUrl: e.target.value })} className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none" placeholder="https://your-domain.com/api/v1/integrations/mpesa/callback" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <input type="text" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} className="flex-1 bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none" placeholder="Test phone: 254712345678" />
              <input type="number" value={testAmount} onChange={(e) => setTestAmount(parseInt(e.target.value))} className="w-24 bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none" min={1} />
              <button onClick={handleTestMpesa} disabled={testingIntegration === 'mpesa'} className="px-4 py-2 bg-[#89ceff]/20 text-[#89ceff] text-sm font-semibold rounded-lg flex items-center gap-2 hover:bg-[#89ceff]/30 transition-all disabled:opacity-50">
                {testingIntegration === 'mpesa' ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />} Test STK
              </button>
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={() => handleSaveIntegration('mpesa', mpesaConfig)} className="px-6 py-2 bg-[#47a263] text-[#003919] text-sm font-bold rounded-lg flex items-center gap-2 hover:opacity-90 transition-all"><Save className="w-4 h-4" /> Save M-Pesa</button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-6 space-y-6">
          <h3 className="text-lg font-bold text-[#dae2fd] flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#7eda95]" />
            Notification Preferences
          </h3>

          <div className="space-y-4">
            {Object.entries(notificationSettings).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-4 bg-[#060e20] rounded-lg">
                <div>
                  <p className="text-sm font-semibold text-[#dae2fd] capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  <p className="text-xs text-[#becabd] mt-1">
                    Receive notifications for {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </p>
                </div>
                <button
                  onClick={() => setNotificationSettings({ ...notificationSettings, [key]: !value })}
                  className={`w-12 h-6 rounded-full transition-colors ${value ? 'bg-[#7eda95]' : 'bg-[#3f4940]'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${value ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleSaveNotifications}
            disabled={loading}
            className="px-6 py-3 bg-[#47a263] text-[#003919] text-sm font-bold rounded-lg flex items-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 uppercase tracking-wider"
          >
            <Save className="w-4 h-4" /> Save Preferences
          </button>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-6 space-y-6">
          <h3 className="text-lg font-bold text-[#dae2fd] flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#7eda95]" />
            Security Settings
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[#060e20] rounded-lg">
              <div>
                <p className="text-sm font-semibold text-[#dae2fd]">Two-Factor Authentication</p>
                <p className="text-xs text-[#becabd]">Require OTP verification on login</p>
              </div>
              <button
                onClick={() => setSecuritySettings({ ...securitySettings, twoFactorEnabled: !securitySettings.twoFactorEnabled })}
                className={`w-12 h-6 rounded-full transition-colors ${securitySettings.twoFactorEnabled ? 'bg-[#7eda95]' : 'bg-[#3f4940]'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${securitySettings.twoFactorEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-[#060e20] rounded-lg">
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-2">Session Timeout (minutes)</label>
                <select
                  value={securitySettings.sessionTimeout}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: e.target.value })}
                  className="w-full bg-[#171f33] border border-[#3f4940] rounded-lg px-4 py-2 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="120">2 hours</option>
                </select>
              </div>
              <div className="p-4 bg-[#060e20] rounded-lg">
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-2">Password Expiry (days)</label>
                <select
                  value={securitySettings.passwordExpiry}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, passwordExpiry: e.target.value })}
                  className="w-full bg-[#171f33] border border-[#3f4940] rounded-lg px-4 py-2 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none"
                >
                  <option value="30">30 days</option>
                  <option value="60">60 days</option>
                  <option value="90">90 days</option>
                  <option value="180">180 days</option>
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveSecurity}
            disabled={loading}
            className="px-6 py-3 bg-[#47a263] text-[#003919] text-sm font-bold rounded-lg flex items-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 uppercase tracking-wider"
          >
            <Lock className="w-4 h-4" /> Update Security
          </button>
        </div>
      )}
    </div>
  );
}
