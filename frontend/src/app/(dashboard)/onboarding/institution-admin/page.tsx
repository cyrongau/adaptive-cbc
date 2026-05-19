'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { motion } from 'framer-motion';
import {
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Building2,
  FileText,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
} from 'lucide-react';

export default function InstitutionAdminPendingPage() {
  const { user } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
    pending: {
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
      border: 'border-amber-400/20',
      title: 'Application Under Review',
      description: 'Your institution application is being reviewed by our admin team.',
    },
    under_review: {
      icon: Shield,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      border: 'border-blue-400/20',
      title: 'Application Under Review',
      description: 'Our team is currently reviewing your application and documentation.',
    },
    approved: {
      icon: CheckCircle,
      color: 'text-[#7eda95]',
      bg: 'bg-[#7eda95]/10',
      border: 'border-[#7eda95]/20',
      title: 'Application Approved',
      description: 'Your institution has been approved! You can now access full features.',
    },
    rejected: {
      icon: XCircle,
      color: 'text-[#ffb4ab]',
      bg: 'bg-[#ffb4ab]/10',
      border: 'border-[#ffb4ab]/20',
      title: 'Application Rejected',
      description: 'Your application was not approved. Please review the reason below.',
    },
  };

  const status = statusConfig[kycStatus as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <div className="space-y-8">
      {/* Status Header */}
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
              <button className="mt-4 px-6 py-3 bg-[#47a263] text-[#003919] text-sm font-bold rounded-lg flex items-center gap-2 hover:opacity-90 transition-all">
                Access Full Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Application Details */}
      {institutionApp && (
        <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-6">
          <h3 className="text-lg font-bold text-[#dae2fd] mb-6 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#7eda95]" />
            Institution Application Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">Institution Name</p>
                <p className="text-sm text-[#dae2fd] font-semibold">{institutionApp.institutionName}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">Institution Type</p>
                <p className="text-sm text-[#dae2fd] capitalize">{institutionApp.institutionType.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">County / Region</p>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#becabd]" />
                  <p className="text-sm text-[#dae2fd]">{institutionApp.county}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">Address</p>
                <p className="text-sm text-[#dae2fd]">{institutionApp.address || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">Contact Phone</p>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#becabd]" />
                  <p className="text-sm text-[#dae2fd]">{institutionApp.phone}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">Submitted On</p>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#becabd]" />
                  <p className="text-sm text-[#dae2fd]">
                    {new Date(institutionApp.submittedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Next Steps */}
      <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-6">
        <h3 className="text-lg font-bold text-[#dae2fd] mb-6 flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#7eda95]" />
          What Happens Next?
        </h3>
        
        <div className="space-y-4">
          {[
            { step: 1, title: 'Application Review', desc: 'Our admin team reviews your application and institution details.', done: true },
            { step: 2, title: 'Document Verification', desc: 'We verify your institution documentation and credentials.', done: kycStatus === 'under_review' || kycStatus === 'approved' },
            { step: 3, title: 'Approval Decision', desc: 'You will receive an email with the approval decision.', done: kycStatus === 'approved' },
            { step: 4, title: 'Account Activation', desc: 'Once approved, you can create teachers, manage students, and access all features.', done: false },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                item.done ? 'bg-[#7eda95]/20 text-[#7eda95]' : 'bg-[#3f4940] text-[#becabd]'
              }`}>
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

      {/* Contact Support */}
      <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-6">
        <div className="flex items-center gap-4">
          <AlertCircle className="w-6 h-6 text-[#89ceff]" />
          <div>
            <p className="text-sm font-semibold text-[#dae2fd]">Need Help?</p>
            <p className="text-xs text-[#becabd] mt-1">
              Contact our support team at <span className="text-[#7eda95]">support@adaptivecbc.com</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
