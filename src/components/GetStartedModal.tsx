import React, { useState } from 'react';
import {
  X,
  CheckCircle,
  GraduationCap,
  Briefcase,
  BookOpen,
  Landmark,
  Mail,
  Lock,
  User,
  Building2,
  AlertCircle,
  Loader2,
  Check,
} from 'lucide-react';
import { useAuth, UserRole } from '../context/AuthContext';
import { CollegeAutocomplete } from './CollegeAutocomplete';

interface GetStartedModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
  onLoginSuccess?: (role?: string) => void;
}

interface RoleOption {
  id: UserRole;
  title: string;
  badge: string;
  tagline: string;
  icon: React.ElementType;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    id: 'student',
    title: 'Student',
    badge: 'Candidate',
    tagline: 'Skills, AI mocks & placement roadmap',
    icon: GraduationCap,
  },
  {
    id: 'industry',
    title: 'Industry',
    badge: 'Recruiter',
    tagline: 'Job listings & verified candidate search',
    icon: Briefcase,
  },
  {
    id: 'academician',
    title: 'Academician',
    badge: 'Faculty',
    tagline: 'Curriculum mapping & student tracking',
    icon: BookOpen,
  },
  {
    id: 'institution',
    title: 'Institution',
    badge: 'TPO / Campus',
    tagline: 'Campus drives & batch analytics',
    icon: Landmark,
  },
];

export const GetStartedModal: React.FC<GetStartedModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
  onLoginSuccess,
}) => {
  const { login, signup, loading, error, clearError, userRole } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Student fields
  const [collegeName, setCollegeName] = useState('');
  const [collegeError, setCollegeError] = useState<string | null>(null);
  const [degree, setDegree] = useState('');
  const [targetRole, setTargetRole] = useState('');

  // Industry fields
  const [companyName, setCompanyName] = useState('');
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [designation, setDesignation] = useState('');

  // Academician / Institution fields
  const [department, setDepartment] = useState('');

  const [submitted, setSubmitted] = useState(false);

  // Sync mode when modal opens with initialMode
  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setSubmitted(false);
      setCollegeError(null);
      setCompanyError(null);
      clearError();
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setCollegeError(null);
    setCompanyError(null);

    if (mode === 'signin') {
      const success = await login(email, password);
      if (success) {
        if (onLoginSuccess) onLoginSuccess();
        onClose();
      }
    } else {
      // Role-specific validation
      if (selectedRole === 'student') {
        if (!collegeName.trim()) {
          setCollegeError('Please enter your college name');
          return;
        }
        const institution = collegeName.trim();
        const success = await signup({
          email,
          password,
          fullName: fullName || email.split('@')[0],
          role: 'student',
          college: institution,
          collegeName: institution,
          degree: degree.trim() || 'B.Tech CS',
          targetRole: targetRole.trim() || 'Software Engineer',
        });
        if (success) {
          if (onLoginSuccess) onLoginSuccess('student');
          onClose();
        }
      } else if (selectedRole === 'industry') {
        if (!companyName.trim()) {
          setCompanyError('Please enter your company or organization name');
          return;
        }
        const success = await signup({
          email,
          password,
          fullName: fullName || email.split('@')[0],
          role: 'industry',
          company: companyName.trim(),
          designation: designation.trim() || 'Recruiter',
        });
        if (success) {
          if (onLoginSuccess) onLoginSuccess('industry');
          onClose();
        }
      } else if (selectedRole === 'academician') {
        if (!collegeName.trim()) {
          setCollegeError('Please enter your college or university name');
          return;
        }
        const institution = collegeName.trim();
        const success = await signup({
          email,
          password,
          fullName: fullName || email.split('@')[0],
          role: 'academician',
          college: institution,
          collegeName: institution,
          department: department.trim() || 'Computer Science & Engineering',
          designation: designation.trim() || 'Faculty Member',
        });
        if (success) {
          if (onLoginSuccess) onLoginSuccess('academician');
          onClose();
        }
      } else if (selectedRole === 'institution') {
        if (!collegeName.trim()) {
          setCollegeError('Please enter your college or institution name');
          return;
        }
        const institution = collegeName.trim();
        const success = await signup({
          email,
          password,
          fullName: fullName || email.split('@')[0],
          role: 'institution',
          college: institution,
          collegeName: institution,
          designation: designation.trim() || 'Training & Placement Officer',
        });
        if (success) {
          if (onLoginSuccess) onLoginSuccess('institution');
          onClose();
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14131F]/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white border border-[#14131F]/10 rounded-2xl p-6 sm:p-8 shadow-xl text-[#14131F] max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-5 right-5 p-1.5 rounded-lg hover:bg-[#FAFAF8] text-[#14131F]/40 hover:text-[#14131F] transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-lg bg-[#4338CA] flex items-center justify-center text-white">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-[#14131F] font-display">
            placementOS
          </span>
        </div>

        {!submitted ? (
          <div>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {mode === 'signin' ? (
              /* SIGN IN MODE */
              <div>
                <div className="mb-6 text-left">
                  <h3 className="text-2xl font-bold font-display text-[#14131F] tracking-tight">Sign in to placementOS</h3>
                  <p className="text-xs sm:text-sm text-[#14131F]/60 mt-1">Access your verified preparation ledger, recruitment console, or campus dashboard.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 text-left">
                  <div>
                    <label className="block text-xs font-semibold text-[#14131F]/80 mb-1.5">Email address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#14131F]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder="you@domain.edu or you@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[#FAFAF8] border border-[#14131F]/10 focus:border-[#4338CA] focus:bg-white focus:ring-2 focus:ring-[#4338CA]/15 rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#14131F] placeholder-[#14131F]/40 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#14131F]/80 mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#14131F]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[#FAFAF8] border border-[#14131F]/10 focus:border-[#4338CA] focus:bg-white focus:ring-2 focus:ring-[#4338CA]/15 rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#14131F] placeholder-[#14131F]/40 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#4338CA] hover:bg-[#3730A3] text-white font-medium py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{loading ? 'Signing in...' : 'Sign in'}</span>
                  </button>
                </form>

                <p className="mt-6 text-center text-xs text-[#14131F]/60">
                  New to placementOS?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('signup'); clearError(); setCollegeError(null); setCompanyError(null); }}
                    className="text-[#4338CA] hover:underline font-semibold cursor-pointer"
                  >
                    Create an account
                  </button>
                </p>
              </div>
            ) : (
              /* SIGN UP MODE */
              <div>
                <div className="mb-4 text-left">
                  <h3 className="text-2xl font-bold font-display text-[#14131F] tracking-tight">Create your account</h3>
                  <p className="text-xs sm:text-sm text-[#14131F]/60 mt-1">Select your portal role to calibrate your workspace.</p>
                </div>

                {/* ROLE SELECTOR CARDS */}
                <div className="mb-5 text-left">
                  <label className="block text-xs font-semibold text-[#14131F]/80 mb-2">Select your role</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {ROLE_OPTIONS.map((r) => {
                      const isSelected = selectedRole === r.id;
                      const Icon = r.icon;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => {
                            setSelectedRole(r.id);
                            clearError();
                            setCollegeError(null);
                            setCompanyError(null);
                          }}
                          className={`relative p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[82px] ${
                            isSelected
                              ? 'border-[#4338CA] bg-[#4338CA]/5 ring-1 ring-[#4338CA]'
                              : 'border-[#14131F]/10 bg-[#FAFAF8] hover:border-[#14131F]/25 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? 'bg-[#4338CA] text-white'
                                    : 'bg-[#14131F]/5 text-[#14131F]/70'
                                }`}
                              >
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-xs font-bold font-display text-[#14131F]">
                                {r.title}
                              </span>
                            </div>
                            {isSelected && (
                              <div className="w-4 h-4 rounded-full bg-[#4338CA] text-white flex items-center justify-center">
                                <Check className="w-2.5 h-2.5" />
                              </div>
                            )}
                          </div>
                          <p className="text-[11px] text-[#14131F]/60 line-clamp-2 leading-snug">
                            {r.tagline}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
                  <div>
                    <label className="block text-xs font-semibold text-[#14131F]/80 mb-1.5">Full name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#14131F]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder={selectedRole === 'industry' ? 'Priya Mehta' : 'Aarav Sharma'}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-[#FAFAF8] border border-[#14131F]/10 focus:border-[#4338CA] focus:bg-white focus:ring-2 focus:ring-[#4338CA]/15 rounded-xl pl-10 pr-4 py-2 text-sm text-[#14131F] placeholder-[#14131F]/40 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#14131F]/80 mb-1.5">
                      {selectedRole === 'industry'
                        ? 'Work Email'
                        : selectedRole === 'student'
                        ? 'College Email'
                        : 'Institutional Email'}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#14131F]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder={
                          selectedRole === 'industry'
                            ? 'priya@company.com'
                            : 'name@college.edu'
                        }
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[#FAFAF8] border border-[#14131F]/10 focus:border-[#4338CA] focus:bg-white focus:ring-2 focus:ring-[#4338CA]/15 rounded-xl pl-10 pr-4 py-2 text-sm text-[#14131F] placeholder-[#14131F]/40 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#14131F]/80 mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#14131F]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[#FAFAF8] border border-[#14131F]/10 focus:border-[#4338CA] focus:bg-white focus:ring-2 focus:ring-[#4338CA]/15 rounded-xl pl-10 pr-4 py-2 text-sm text-[#14131F] placeholder-[#14131F]/40 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* STUDENT FIELDS */}
                  {selectedRole === 'student' && (
                    <>
                      <CollegeAutocomplete
                        value={collegeName}
                        onChange={(val) => {
                          setCollegeName(val);
                          if (collegeError) setCollegeError(null);
                        }}
                        required
                        error={collegeError}
                        placeholder="e.g. Sanjivani College of Engineering, Kopargaon"
                        label="College / University Name"
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-[#14131F]/80 mb-1.5">Degree / Branch</label>
                          <input
                            type="text"
                            placeholder="B.Tech CS / IT"
                            value={degree}
                            onChange={(e) => setDegree(e.target.value)}
                            className="w-full bg-[#FAFAF8] border border-[#14131F]/10 focus:border-[#4338CA] focus:bg-white focus:ring-2 focus:ring-[#4338CA]/15 rounded-xl px-3 py-2 text-sm text-[#14131F] placeholder-[#14131F]/40 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#14131F]/80 mb-1.5">Target Role</label>
                          <input
                            type="text"
                            placeholder="e.g. SDE-1, Full Stack"
                            value={targetRole}
                            onChange={(e) => setTargetRole(e.target.value)}
                            className="w-full bg-[#FAFAF8] border border-[#14131F]/10 focus:border-[#4338CA] focus:bg-white focus:ring-2 focus:ring-[#4338CA]/15 rounded-xl px-3 py-2 text-sm text-[#14131F] placeholder-[#14131F]/40 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* INDUSTRY FIELDS */}
                  {selectedRole === 'industry' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#14131F]/80 mb-1.5">Company / Organization Name</label>
                        <div className="relative">
                          <Building2 className="w-4 h-4 text-[#14131F]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            placeholder="e.g. Razorpay, Google, TCS"
                            value={companyName}
                            onChange={(e) => {
                              setCompanyName(e.target.value);
                              if (companyError) setCompanyError(null);
                            }}
                            className={`w-full bg-[#FAFAF8] border ${
                              companyError ? 'border-red-400' : 'border-[#14131F]/10'
                            } focus:border-[#4338CA] focus:bg-white focus:ring-2 focus:ring-[#4338CA]/15 rounded-xl pl-10 pr-4 py-2 text-sm text-[#14131F] placeholder-[#14131F]/40 outline-none transition-all`}
                          />
                        </div>
                        {companyError && (
                          <p className="mt-1 text-[11px] text-red-500">{companyError}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#14131F]/80 mb-1.5">Designation / Role Title</label>
                        <input
                          type="text"
                          placeholder="e.g. University Recruiter, Talent Lead"
                          value={designation}
                          onChange={(e) => setDesignation(e.target.value)}
                          className="w-full bg-[#FAFAF8] border border-[#14131F]/10 focus:border-[#4338CA] focus:bg-white focus:ring-2 focus:ring-[#4338CA]/15 rounded-xl px-3 py-2 text-sm text-[#14131F] placeholder-[#14131F]/40 outline-none transition-all"
                        />
                      </div>
                    </div>
                  )}

                  {/* ACADEMICIAN FIELDS */}
                  {selectedRole === 'academician' && (
                    <div className="space-y-3">
                      <CollegeAutocomplete
                        value={collegeName}
                        onChange={(val) => {
                          setCollegeName(val);
                          if (collegeError) setCollegeError(null);
                        }}
                        required
                        error={collegeError}
                        placeholder="e.g. IIT Bombay, NIT Trichy, Pune University"
                        label="Institution / University Name"
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-[#14131F]/80 mb-1.5">Department / Faculty</label>
                          <input
                            type="text"
                            placeholder="e.g. Computer Engineering"
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            className="w-full bg-[#FAFAF8] border border-[#14131F]/10 focus:border-[#4338CA] focus:bg-white focus:ring-2 focus:ring-[#4338CA]/15 rounded-xl px-3 py-2 text-sm text-[#14131F] placeholder-[#14131F]/40 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#14131F]/80 mb-1.5">Designation</label>
                          <input
                            type="text"
                            placeholder="e.g. Associate Professor"
                            value={designation}
                            onChange={(e) => setDesignation(e.target.value)}
                            className="w-full bg-[#FAFAF8] border border-[#14131F]/10 focus:border-[#4338CA] focus:bg-white focus:ring-2 focus:ring-[#4338CA]/15 rounded-xl px-3 py-2 text-sm text-[#14131F] placeholder-[#14131F]/40 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* INSTITUTION FIELDS */}
                  {selectedRole === 'institution' && (
                    <div className="space-y-3">
                      <CollegeAutocomplete
                        value={collegeName}
                        onChange={(val) => {
                          setCollegeName(val);
                          if (collegeError) setCollegeError(null);
                        }}
                        required
                        error={collegeError}
                        placeholder="e.g. Sanjivani College of Engineering"
                        label="Institution / Campus Name"
                      />

                      <div>
                        <label className="block text-xs font-semibold text-[#14131F]/80 mb-1.5">TPO / Office Designation</label>
                        <input
                          type="text"
                          placeholder="e.g. Head - Training & Placement, Placement Officer"
                          value={designation}
                          onChange={(e) => setDesignation(e.target.value)}
                          className="w-full bg-[#FAFAF8] border border-[#14131F]/10 focus:border-[#4338CA] focus:bg-white focus:ring-2 focus:ring-[#4338CA]/15 rounded-xl px-3 py-2 text-sm text-[#14131F] placeholder-[#14131F]/40 outline-none transition-all"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#4338CA] hover:bg-[#3730A3] text-white font-medium py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer mt-3 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{loading ? 'Creating account...' : `Create ${ROLE_OPTIONS.find(r => r.id === selectedRole)?.title || 'User'} Account`}</span>
                  </button>
                </form>

                <p className="mt-5 text-center text-xs text-[#14131F]/60">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('signin'); clearError(); setCollegeError(null); setCompanyError(null); }}
                    className="text-[#4338CA] hover:underline font-semibold cursor-pointer"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#A3E635]/20 border border-[#A3E635]/40 text-[#14131F] flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6 text-[#4338CA]" />
            </div>
            <h3 className="text-2xl font-bold font-display text-[#14131F]">
              {mode === 'signin' ? 'Welcome back!' : 'Account created!'}
            </h3>
            <p className="text-sm text-[#14131F]/70">
              Logged in successfully as <span className="font-semibold text-[#14131F]">{email}</span>.
            </p>
            <button
              onClick={onClose}
              className="mt-4 bg-[#4338CA] hover:bg-[#3730A3] text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              Continue to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
