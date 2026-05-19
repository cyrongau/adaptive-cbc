'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Shield, Clock, CheckCircle, XCircle, AlertCircle, Building2, FileText,
  Mail, Phone, MapPin, ArrowRight, Upload, Loader2, Edit3,
} from 'lucide-react';

export default function InstitutionAdminPendingPage() {
  const { user, refreshUser } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);
  const [showResubmitForm, setShowResubmitForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  const [form, setForm] = useState({
    institutionName: '',
    institutionType: 'basic_education',
    county: '',
    address: '',
    phone: '',
    adminIdNumber: '',
    additionalNotes: '',
    registrationCertificateUrl: '',
    tscAppointmentUrl: '',
  });

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (isMounted && user) {
      const app = (user as any)?.institutionApplication;
      if (app) {
        setForm({
          institutionName: app.institutionName || '',
          institutionType: app.institutionType || 'basic_education',
          county: app.county || '',
          address: app.address || '',
          phone: app.phone || '',
          adminIdNumber: app.adminIdNumber || '',
          additionalNotes: app.additionalNotes || '',
          registrationCertificateUrl: app.registrationCertificateUrl || '',
          tscAppointmentUrl: app.tscAppointmentUrl || '',
        });
      }
    }
  }, [isMounted, user]);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#0b1326] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#7eda95] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const kycStatus = user?.kycStatus || 'pending';
  const institutionApp = (user as any)?.institutionApplication;

  const statusConfig = {
    pending: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', title: 'Application Under Review', description: 'Your institution application is being reviewed by our admin team.' },
    under_review: { icon: Shield, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20', title: 'Application Under Review', description: 'Our team is currently reviewing your application and documentation.' },
    approved: { icon: CheckCircle, color: 'text-[#7eda95]', bg: 'bg-[#7eda95]/10', border: 'border-[#7eda95]/20', title: 'Application Approved', description: 'Your institution has been approved! You can now access full features.' },
    rejected: { icon: XCircle, color: 'text-[#ffb4ab]', bg: 'bg-[#ffb4ab]/10', border: 'border-[#ffb4ab]/20', title: 'Application Rejected', description: 'Your application was not approved. Please review the reason and resubmit.' },
  };

  const status = statusConfig[kycStatus as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = status.icon;

  const handleFileUpload = async (field: 'registrationCertificateUrl' | 'tscAppointmentUrl', file: File) => {
    setUploadingDoc(field);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/institutions/upload-document', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm((prev) => ({ ...prev, [field]: res.data.url }));
      toast.success('Document uploaded');
    } catch (err) {
      toast.error('Failed to upload document');
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleSubmit = async () => {
    if (!form.institutionName || !form.county || !form.phone) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (kycStatus === 'pending' && !form.registrationCertificateUrl) {
      toast.error('School registration certificate is required');
      return;
    }
    setSubmitting(true);
    try {
      if (kycStatus === 'rejected') {
        await api.post('/users/kyc/resubmit', { institutionApplication: form });
        toast.success('Application resubmitted successfully');
      }
      await refreshUser();
      setShowResubmitForm(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className={`bg-[#171f33] border ${status.border} rounded-xl p-8`}>
        <div className="flex items-start gap-6">
          <div className={`w-16 h-16 ${status.bg} rounded-xl flex items-center justify-center shrink-0`}>
            <StatusIcon className={`w-8 h-8 ${status.color}`} />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-[#dae2fd]">{status.title}</h2>
            <p className="text-sm text-[#becabd] mt-2">{status.description}</p>
            {kycStatus === 'rejected' && (user as any)?.rejectionReason && (
              <div className="mt-4 p-4 bg-[#ffb4ab]/5 border border-[#ffb4ab]/20 rounded-lg">
                <p className="text-sm text-[#ffb4ab] font-semibold">Rejection Reason:</p>
                <p className="text-sm text-[#becabd] mt-1">{(user as any).rejectionReason}</p>
              </div>
            )}
            {kycStatus === 'approved' && (
              <a href="/admin/dashboard" className="mt-4 inline-flex px-6 py-3 bg-[#47a263] text-[#003919] text-sm font-bold rounded-lg items-center gap-2 hover:opacity-90 transition-all">
                Access Full Dashboard
                <ArrowRight className="w-4 h-4" />
              </a>
            )}
            {kycStatus === 'rejected' && !showResubmitForm && (
              <button
                onClick={() => setShowResubmitForm(true)}
                className="mt-4 inline-flex px-6 py-3 bg-[#47a263] text-[#003919] text-sm font-bold rounded-lg items-center gap-2 hover:opacity-90 transition-all"
              >
                <Edit3 className="w-4 h-4" />
                Resubmit Application
              </button>
            )}
          </div>
        </div>
      </div>

      {showResubmitForm && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#171f33] border border-[#3f4940] rounded-xl p-6">
          <h3 className="text-lg font-bold text-[#dae2fd] mb-6 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#7eda95]" />
            Update Institution Application
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-[#becabd] mb-1">Institution Name *</label>
              <input type="text" value={form.institutionName} onChange={(e) => setForm({ ...form, institutionName: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#0b1326] border border-[#3f4940] text-[#dae2fd] focus:outline-none focus:ring-2 focus:ring-[#7eda95]/30" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#becabd] mb-1">Institution Type</label>
              <select value={form.institutionType} onChange={(e) => setForm({ ...form, institutionType: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#0b1326] border border-[#3f4940] text-[#dae2fd] focus:outline-none focus:ring-2 focus:ring-[#7eda95]/30">
                <option value="basic_education">Basic Education</option>
                <option value="senior_secondary">Senior Secondary</option>
                <option value="academy">Academy</option>
                <option value="tuition_center">Tuition Center</option>
                <option value="homeschool">Homeschool</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#becabd] mb-1">County / Region *</label>
              <input type="text" value={form.county} onChange={(e) => setForm({ ...form, county: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#0b1326] border border-[#3f4940] text-[#dae2fd] focus:outline-none focus:ring-2 focus:ring-[#7eda95]/30" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#becabd] mb-1">Address</label>
              <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#0b1326] border border-[#3f4940] text-[#dae2fd] focus:outline-none focus:ring-2 focus:ring-[#7eda95]/30" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#becabd] mb-1">Contact Phone *</label>
              <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#0b1326] border border-[#3f4940] text-[#dae2fd] focus:outline-none focus:ring-2 focus:ring-[#7eda95]/30" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#becabd] mb-1">Admin ID Number</label>
              <input type="text" value={form.adminIdNumber} onChange={(e) => setForm({ ...form, adminIdNumber: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#0b1326] border border-[#3f4940] text-[#dae2fd] focus:outline-none focus:ring-2 focus:ring-[#7eda95]/30" placeholder="National ID number" />
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <h4 className="text-sm font-bold text-[#dae2fd] flex items-center gap-2"><Upload className="w-4 h-4" /> Required Documents</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-[#0b1326] rounded-lg border border-[#3f4940]">
                <p className="text-sm font-semibold text-[#becabd] mb-2">School Registration Certificate *</p>
                {form.registrationCertificateUrl ? (
                  <div className="flex items-center gap-2 text-sm text-[#7eda95]">
                    <CheckCircle className="w-4 h-4" />
                    <span>Uploaded</span>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 px-4 py-2 bg-[#3f4940] text-[#dae2fd] rounded-lg cursor-pointer hover:bg-[#4f5950] text-sm">
                    <Upload className="w-4 h-4" />
                    {uploadingDoc === 'registrationCertificateUrl' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upload'}
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFileUpload('registrationCertificateUrl', e.target.files[0]); }} />
                  </label>
                )}
              </div>
              <div className="p-4 bg-[#0b1326] rounded-lg border border-[#3f4940]">
                <p className="text-sm font-semibold text-[#becabd] mb-2">TSC Appointment Letter *</p>
                {form.tscAppointmentUrl ? (
                  <div className="flex items-center gap-2 text-sm text-[#7eda95]">
                    <CheckCircle className="w-4 h-4" />
                    <span>Uploaded</span>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 px-4 py-2 bg-[#3f4940] text-[#dae2fd] rounded-lg cursor-pointer hover:bg-[#4f5950] text-sm">
                    <Upload className="w-4 h-4" />
                    {uploadingDoc === 'tscAppointmentUrl' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upload'}
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFileUpload('tscAppointmentUrl', e.target.files[0]); }} />
                  </label>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#becabd] mb-1">Additional Notes</label>
              <textarea value={form.additionalNotes} onChange={(e) => setForm({ ...form, additionalNotes: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-lg bg-[#0b1326] border border-[#3f4940] text-[#dae2fd] focus:outline-none focus:ring-2 focus:ring-[#7eda95]/30" placeholder="Any additional information..." />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={handleSubmit} disabled={submitting} className="px-6 py-2.5 bg-[#47a263] text-[#003919] font-bold rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {kycStatus === 'rejected' ? 'Resubmit Application' : 'Submit Application'}
            </button>
            <button onClick={() => setShowResubmitForm(false)} className="px-4 py-2.5 border border-[#3f4940] text-[#becabd] rounded-lg hover:bg-[#3f4940]">Cancel</button>
          </div>
        </motion.div>
      )}

      {institutionApp && !showResubmitForm && (
        <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-6">
          <h3 className="text-lg font-bold text-[#dae2fd] mb-6 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#7eda95]" />
            Institution Application Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div><p className="text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">Institution Name</p><p className="text-sm text-[#dae2fd] font-semibold">{institutionApp.institutionName}</p></div>
              <div><p className="text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">Institution Type</p><p className="text-sm text-[#dae2fd] capitalize">{institutionApp.institutionType?.replace('_', ' ')}</p></div>
              <div><p className="text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">County / Region</p><div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#becabd]" /><p className="text-sm text-[#dae2fd]">{institutionApp.county}</p></div></div>
            </div>
            <div className="space-y-4">
              <div><p className="text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">Address</p><p className="text-sm text-[#dae2fd]">{institutionApp.address || 'Not provided'}</p></div>
              <div><p className="text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">Contact Phone</p><div className="flex items-center gap-2"><Phone className="w-4 h-4 text-[#becabd]" /><p className="text-sm text-[#dae2fd]">{institutionApp.phone}</p></div></div>
              <div><p className="text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">Submitted On</p><div className="flex items-center gap-2"><Clock className="w-4 h-4 text-[#becabd]" /><p className="text-sm text-[#dae2fd]">{new Date(institutionApp.submittedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p></div></div>
            </div>
          </div>
          {(institutionApp.registrationCertificateUrl || institutionApp.tscAppointmentUrl) && (
            <div className="mt-6 pt-6 border-t border-[#3f4940]">
              <h4 className="text-sm font-bold text-[#dae2fd] mb-3 flex items-center gap-2"><FileText className="w-4 h-4" /> Uploaded Documents</h4>
              <div className="flex flex-wrap gap-3">
                {institutionApp.registrationCertificateUrl && <span className="px-3 py-1.5 bg-[#7eda95]/10 text-[#7eda95] text-sm rounded-lg flex items-center gap-2"><CheckCircle className="w-3 h-3" /> Registration Certificate</span>}
                {institutionApp.tscAppointmentUrl && <span className="px-3 py-1.5 bg-[#7eda95]/10 text-[#7eda95] text-sm rounded-lg flex items-center gap-2"><CheckCircle className="w-3 h-3" /> TSC Appointment Letter</span>}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-6">
        <h3 className="text-lg font-bold text-[#dae2fd] mb-6 flex items-center gap-2"><FileText className="w-5 h-5 text-[#7eda95]" />What Happens Next?</h3>
        <div className="space-y-4">
          {[
            { step: 1, title: 'Application Review', desc: 'Our admin team reviews your application and institution details.', done: true },
            { step: 2, title: 'Document Verification', desc: 'We verify your institution documentation and credentials.', done: kycStatus === 'under_review' || kycStatus === 'approved' },
            { step: 3, title: 'Approval Decision', desc: 'You will receive an email with the approval decision.', done: kycStatus === 'approved' },
            { step: 4, title: 'Account Activation', desc: 'Once approved, you can create teachers, manage students, and access all features.', done: false },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${item.done ? 'bg-[#7eda95]/20 text-[#7eda95]' : 'bg-[#3f4940] text-[#becabd]'}`}>
                {item.done ? <CheckCircle className="w-4 h-4" /> : <span className="text-xs font-bold">{item.step}</span>}
              </div>
              <div>
                <p className={`text-sm font-semibold ${item.done ? 'text-[#7eda95]' : 'text-[#dae2fd]'}`}>{item.title}</p>
                <p className="text-xs text-[#becabd] mt-1">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-6">
        <div className="flex items-center gap-4">
          <AlertCircle className="w-6 h-6 text-[#89ceff]" />
          <div>
            <p className="text-sm font-semibold text-[#dae2fd]">Need Help?</p>
            <p className="text-xs text-[#becabd] mt-1">Contact our support team at <span className="text-[#7eda95]">support@adaptivecbc.com</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
