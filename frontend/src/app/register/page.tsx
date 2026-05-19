'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { GraduationCap, ArrowRight, Loader2, Sparkles, User, Mail, Phone, ShieldAlert, Building2, Shield, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

type RoleType = 'student' | 'parent' | 'tutor' | 'institution_admin';

export default function RegisterPage() {
  const router = useRouter();
  const { register, loading, error, clearError, initialize } = useAuthStore();
  
  const [selectedRole, setSelectedRole] = useState<RoleType>('student');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [grade, setGrade] = useState('Grade 4');
  const [institutionName, setInstitutionName] = useState('');
  const [institutionType, setInstitutionType] = useState('basic_education');
  const [county, setCounty] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    initialize();
    clearError();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (selectedRole === 'institution_admin' && (!institutionName.trim() || !county.trim())) {
      toast.error('Please provide institution details');
      return;
    }

    if (selectedRole === 'student' && !grade) {
      toast.error('Please select your grade');
      return;
    }

    const payload: any = {
      email,
      phone,
      fullName,
      role: selectedRole,
    };

    if (selectedRole === 'student') {
      payload.grade = grade;
    }

    if (selectedRole === 'institution_admin') {
      payload.institutionApplication = {
        institutionName,
        institutionType,
        county,
        address,
        phone,
      };
    }

    const success = await register(payload);

    if (success) {
      if (selectedRole === 'institution_admin') {
        toast.success('Application submitted! Your account will be activated after admin approval.');
      } else {
        toast.success('Registration initiated. A verification code has been sent.');
      }
      router.push('/verify-otp');
    } else {
      toast.error(error || 'Failed to complete registration');
    }
  };

  const roles: { value: RoleType; label: string; icon: any; description: string }[] = [
    { value: 'student', label: 'Student', icon: GraduationCap, description: 'Access learning materials and practice' },
    { value: 'parent', label: 'Parent', icon: User, description: 'Monitor your child\'s progress' },
    { value: 'tutor', label: 'Public Tutor', icon: BookOpen, description: 'Teach publicly and sell courses' },
    { value: 'institution_admin', label: 'School Admin', icon: Building2, description: 'Manage your institution' },
  ];

  return (
    <div className="min-h-screen bg-surface-low grid lg:grid-cols-12 font-sans overflow-hidden">
      {/* Left Column: Visual Brand Banner */}
      <div className="hidden lg:flex lg:col-span-5 relative bg-primary items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d6832] via-[#1c8445] to-[#0b5327] -z-10 animate-gradient-shift" />
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-white/5 blur-3xl animate-pulse" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
        
        <div className="absolute top-[25%] right-[10%] w-3 h-3 rounded-full bg-tertiary opacity-60 animate-bounce delay-200" />
        <div className="absolute bottom-[25%] left-[15%] w-4 h-4 rounded-full bg-secondary opacity-40 animate-bounce" />

        <div className="relative text-left max-w-md space-y-8 z-10">
          <div className="inline-flex items-center space-x-3">
            <img src="/logo.png" alt="Adaptive CBC" className="h-10 w-auto" />
            <span className="text-2xl font-bold tracking-tight text-white">
              Adaptive<span className="text-tertiary-on-primary">CBC</span>
            </span>
          </div>

          <div className="space-y-4">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight"
            >
              Join Our Learning Community
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-base text-white/80 leading-relaxed font-semibold"
            >
              Create your account and start your adaptive learning journey today.
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="p-4 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-md flex items-start space-x-3.5 hover:bg-white/15 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-tertiary-on-primary" />
            </div>
            <div>
              <h4 className="text-white font-extrabold text-xs">Secure & Verified</h4>
              <p className="text-[10px] text-white/60 font-semibold mt-0.5">All accounts are verified for safety</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Column: Registration Form */}
      <div className="col-span-12 lg:col-span-7 flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-12 bg-white relative overflow-y-auto">
        <div className="absolute top-8 right-8 lg:right-12">
          <Link 
            href="/" 
            className="text-xs text-gray-500 font-extrabold tracking-wider hover:text-primary uppercase flex items-center transition-colors"
          >
            Back to Home
          </Link>
        </div>

        <div className="max-w-md w-full mx-auto space-y-6 py-6">
          <div className="space-y-1.5">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Create Account
            </h2>
            <p className="text-sm text-gray-500 font-semibold leading-relaxed">
              Select your role and fill in your details.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start space-x-3 text-red-700 text-xs font-semibold animate-shake">
              <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-3">
            {roles.map((role) => (
              <button
                key={role.value}
                type="button"
                onClick={() => setSelectedRole(role.value)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  selectedRole === role.value
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <role.icon className={`w-6 h-6 mb-2 ${selectedRole === role.value ? 'text-primary' : 'text-gray-400'}`} />
                <p className={`text-sm font-bold ${selectedRole === role.value ? 'text-primary' : 'text-gray-700'}`}>
                  {role.label}
                </p>
                <p className="text-[10px] text-gray-500 mt-1">{role.description}</p>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1">
              <label htmlFor="fullName" className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Full Name
              </label>
              <div className="relative flex items-center bg-gray-50 border border-gray-100 rounded-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:bg-white focus-within:border-primary transition-all">
                <User className="w-5 h-5 text-gray-400 absolute left-4 shrink-0" />
                <input 
                  id="fullName"
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-transparent outline-none pl-12 pr-4 py-3.5 text-sm font-semibold text-gray-800 placeholder-gray-400"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label htmlFor="email" className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Email Address
              </label>
              <div className="relative flex items-center bg-gray-50 border border-gray-100 rounded-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:bg-white focus-within:border-primary transition-all">
                <Mail className="w-5 h-5 text-gray-400 absolute left-4 shrink-0" />
                <input 
                  id="email"
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-transparent outline-none pl-12 pr-4 py-3.5 text-sm font-semibold text-gray-800 placeholder-gray-400"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-1">
              <label htmlFor="phone" className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Phone Number
              </label>
              <div className="relative flex items-center bg-gray-50 border border-gray-100 rounded-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:bg-white focus-within:border-primary transition-all">
                <Phone className="w-5 h-5 text-gray-400 absolute left-4 shrink-0" />
                <input 
                  id="phone"
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0712345678"
                  className="w-full bg-transparent outline-none pl-12 pr-4 py-3.5 text-sm font-semibold text-gray-800 placeholder-gray-400"
                />
              </div>
            </div>

            {/* Student: Grade Selection */}
            {selectedRole === 'student' && (
              <div className="space-y-1">
                <label htmlFor="grade" className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Current Class / Grade Level
                </label>
                <div className="relative flex items-center bg-gray-50 border border-gray-100 rounded-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:bg-white focus-within:border-primary transition-all">
                  <GraduationCap className="w-5 h-5 text-gray-400 absolute left-4 shrink-0" />
                  <select 
                    id="grade"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full bg-transparent outline-none pl-12 pr-4 py-3.5 text-sm font-semibold text-gray-800 placeholder-gray-400 cursor-pointer appearance-none"
                  >
                    <option value="Grade 1">Grade 1 (Lower Primary)</option>
                    <option value="Grade 2">Grade 2 (Lower Primary)</option>
                    <option value="Grade 3">Grade 3 (Lower Primary)</option>
                    <option value="Grade 4">Grade 4 (Upper Primary)</option>
                    <option value="Grade 5">Grade 5 (Upper Primary)</option>
                    <option value="Grade 6">Grade 6 (KPSEA Candidate)</option>
                    <option value="Grade 7">Grade 7 (Junior Secondary)</option>
                    <option value="Grade 8">Grade 8 (Junior Secondary)</option>
                    <option value="Grade 9">Grade 9 (Junior Secondary)</option>
                  </select>
                  <div className="absolute right-4 pointer-events-none text-gray-400 text-xs font-bold font-mono">▼</div>
                </div>
              </div>
            )}

            {/* Institution Admin: Institution Details */}
            {selectedRole === 'institution_admin' && (
              <div className="space-y-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-amber-700" />
                  <p className="text-xs font-bold text-amber-800 uppercase">Institution Details</p>
                </div>
                <p className="text-xs text-amber-700">Your application will be reviewed by our admin team. You'll receive access after approval.</p>
                
                <div className="space-y-3 mt-4">
                  <input 
                    type="text" 
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    placeholder="Institution Name *"
                    className="w-full bg-white border border-amber-200 rounded-lg px-4 py-3 text-sm font-semibold text-gray-800 placeholder-gray-400 outline-none focus:border-primary"
                  />
                  <select 
                    value={institutionType}
                    onChange={(e) => setInstitutionType(e.target.value)}
                    className="w-full bg-white border border-amber-200 rounded-lg px-4 py-3 text-sm font-semibold text-gray-800 outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="basic_education">Category A: Basic Education (Pre-Primary - JSS)</option>
                    <option value="senior_secondary">Category B: Senior Secondary (Grades 10-12)</option>
                    <option value="academy">Academy</option>
                    <option value="tuition_center">Tuition Center</option>
                    <option value="homeschool">Homeschool</option>
                  </select>
                  <input 
                    type="text" 
                    value={county}
                    onChange={(e) => setCounty(e.target.value)}
                    placeholder="County / Region *"
                    className="w-full bg-white border border-amber-200 rounded-lg px-4 py-3 text-sm font-semibold text-gray-800 placeholder-gray-400 outline-none focus:border-primary"
                  />
                  <input 
                    type="text" 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Address (optional)"
                    className="w-full bg-white border border-amber-200 rounded-lg px-4 py-3 text-sm font-semibold text-gray-800 placeholder-gray-400 outline-none focus:border-primary"
                  />
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary text-white font-extrabold text-sm py-4 rounded-xl hover:bg-primary/95 transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center uppercase tracking-wider disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  {selectedRole === 'institution_admin' ? 'Submit Application' : 'Sign Up'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm font-semibold text-gray-500 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline font-extrabold">
              Log In Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
