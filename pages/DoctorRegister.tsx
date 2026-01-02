
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Stethoscope, 
  FileText, 
  MapPin, 
  Clock, 
  CheckCircle, 
  ArrowLeft, 
  ArrowRight, 
  Upload, 
  ShieldCheck, 
  Award,
  Plus,
  X,
  Lock,
  Loader2,
  Calendar,
  AlertCircle,
  Camera,
  Languages,
  BadgeIndianRupee,
  FileSearch,
  CheckCircle2,
  Info,
  Phone,
  File as FileIcon,
  Image as ImageIcon,
  Check
} from 'lucide-react';
import { api } from '../api';
import { Specialization, ConsultationMode, UserRole } from '../types';

const STEPS = [
  { label: 'Basic Info', icon: User },
  { label: 'Credentials', icon: Award },
  { label: 'Documents', icon: FileText },
  { label: 'Practice', icon: Stethoscope },
  { label: 'Availability', icon: Clock },
  { label: 'Submit', icon: ShieldCheck }
];

const QUALIFICATIONS = ['MBBS', 'BDS', 'BAMS', 'BHMS', 'Other'];
const LANGUAGES = ['Hindi', 'English', 'Punjabi', 'Bengali', 'Tamil', 'Telugu', 'Marathi', 'Gujarati', 'Kannada', 'Malayalam', 'Urdu'];
const DURATIONS = [15, 20, 30, 45, 60];
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_FORMATS = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

const DoctorRegister: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadType, setActiveUploadType] = useState<string | null>(null);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  
  const [formData, setFormData] = useState<any>(() => {
    const saved = localStorage.getItem('doctor_reg_draft');
    return saved ? JSON.parse(saved) : {
      fullName: '',
      email: '',
      phoneNumber: '',
      dateOfBirth: '',
      gender: 'male',
      password: '',
      confirmPassword: '',
      medicalRegistrationNumber: '',
      primaryQualification: 'MBBS',
      specialization: Specialization.GENERAL_PHYSICIAN,
      additionalQualifications: [],
      yearOfRegistration: new Date().getFullYear(),
      yearsOfExperience: 0,
      medicalCouncil: 'Medical Council of India',
      currentPracticePlace: '',
      clinicAddress: { street: '', city: '', state: '', pinCode: '' },
      consultationFee: 300,
      languagesSpoken: ['Hindi'],
      consultationModes: ['video'],
      areasOfExpertise: [],
      bio: '',
      availability: DAYS.reduce((acc, day) => ({ 
        ...acc, 
        [day]: { isAvailable: true, morning: { start: '09:00', end: '13:00' }, evening: { start: '17:00', end: '21:00' } } 
      }), {}),
      appointmentDuration: 30,
      acceptingNewPatients: true,
      profilePhoto: null
    };
  });

  const [expertiseInput, setExpertiseInput] = useState('');
  const [uploadStatus, setUploadStatus] = useState<Record<string, any>>({
    degree: { status: 'idle', error: null, metadata: null },
    registration: { status: 'idle', error: null, metadata: null },
    idProof: { status: 'idle', error: null, metadata: null },
    specialization: { status: 'idle', error: null, metadata: null }
  });

  useEffect(() => {
    localStorage.setItem('doctor_reg_draft', JSON.stringify(formData));
  }, [formData]);

  const calculatePasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let s = 0;
    if (pass.length >= 8) s++;
    if (/[A-Z]/.test(pass)) s++;
    if (/[0-9]/.test(pass)) s++;
    if (/[^A-Za-z0-9]/.test(pass)) s++;
    return s;
  };

  const handleRegNoFormat = (val: string) => {
    const cleaned = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    let formatted = cleaned;
    if (cleaned.length > 5) formatted = cleaned.slice(0, 5) + '-' + cleaned.slice(5);
    if (cleaned.length > 10) formatted = formatted.slice(0, 11) + '-' + cleaned.slice(10, 15);
    setFormData({ ...formData, medicalRegistrationNumber: formatted.slice(0, 17) });
  };

  const validateCurrentStep = () => {
    switch(currentStep) {
      case 0: 
        return formData.fullName && formData.email && formData.phoneNumber.length === 10 && 
               formData.password.length >= 8 && formData.password === formData.confirmPassword;
      case 1:
        return formData.medicalRegistrationNumber.length >= 5 && formData.yearsOfExperience >= 0;
      case 2:
        return uploadStatus.degree.status === 'success' && 
               uploadStatus.registration.status === 'success' && 
               uploadStatus.idProof.status === 'success';
      case 3:
        return formData.currentPracticePlace && formData.clinicAddress.city && formData.clinicAddress.pinCode.length === 6 &&
               formData.consultationFee >= 100 && formData.languagesSpoken.length > 0 && formData.consultationModes.length > 0;
      case 4:
        return true;
      case 5:
        return true;
      default: return false;
    }
  };

  const handleNext = async () => {
    if (currentStep === 0) {
      setShowOTP(true);
      await api.auth.doctor.sendPhoneOTP(formData.phoneNumber);
      return;
    }
    if (validateCurrentStep()) setCurrentStep(p => Math.min(p + 1, STEPS.length - 1));
  };

  const handleVerifyOTP = async () => {
    const res = await api.auth.doctor.verifyPhoneOTP(otpValue);
    if (res.success) {
      setShowOTP(false);
      setOtpValue('');
      setCurrentStep(1);
    } else {
      alert("Invalid OTP. Try 123456");
    }
  };

  const triggerUpload = (type: string) => {
    setActiveUploadType(type);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadType) return;

    // Reset error
    setUploadStatus(prev => ({
      ...prev,
      [activeUploadType]: { ...prev[activeUploadType], error: null }
    }));

    // Part 4 Validation: Size and Type
    if (file.size > MAX_FILE_SIZE) {
      setUploadStatus(prev => ({
        ...prev,
        [activeUploadType]: { ...prev[activeUploadType], error: 'File size exceeds 2MB limit.' }
      }));
      return;
    }

    if (!ALLOWED_FORMATS.includes(file.type)) {
      setUploadStatus(prev => ({
        ...prev,
        [activeUploadType]: { ...prev[activeUploadType], error: 'Invalid format. Use PDF or Images.' }
      }));
      return;
    }

    setUploadStatus(prev => ({
      ...prev,
      [activeUploadType]: { ...prev[activeUploadType], status: 'uploading' }
    }));

    try {
      const res = await api.auth.doctor.uploadDocument(file);
      setUploadStatus(prev => ({
        ...prev,
        [activeUploadType]: { status: 'success', error: null, metadata: res }
      }));
    } catch (err) {
      setUploadStatus(prev => ({
        ...prev,
        [activeUploadType]: { status: 'idle', error: 'Upload failed. Try again.' }
      }));
    } finally {
      e.target.value = ''; // Reset input
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await api.auth.doctor.verifyEmail(formData.email);
      
      const payload = {
        ...formData,
        name: formData.fullName,
        avatar: formData.profilePhoto || 'https://picsum.photos/seed/doctor/200',
        fee: formData.consultationFee,
        available: formData.acceptingNewPatients,
        isActive: false, 
        verificationStatus: 'pending',
        isEmailVerified: true, 
        isPhoneVerified: true, 
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        statistics: { totalConsultations: 0, completedConsultations: 0, cancelledConsultations: 0, averageRating: 0, totalReviews: 0 },
        // Persist upload metadata
        documents: {
          medicalDegree: uploadStatus.degree.metadata,
          registrationCertificate: uploadStatus.registration.metadata,
          idProof: uploadStatus.idProof.metadata,
          specializationCertificate: uploadStatus.specialization.metadata
        }
      };

      await api.auth.doctor.register(payload);
      localStorage.removeItem('doctor_reg_draft');
      navigate('/register/doctor/status', { state: { email: formData.email } });
    } catch (err) {
      alert("Submission failed. Check network connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-inter relative">
      {/* Hidden File Input */}
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange}
        accept=".pdf,.jpg,.jpeg,.png"
      />

      {/* OTP Modal */}
      {showOTP && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 max-w-sm w-full text-center space-y-6 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
              <Phone size={32} />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight">Verify Phone</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Enter OTP sent to +91 {formData.phoneNumber}</p>
            </div>
            <input 
              type="text" maxLength={6} placeholder="123456" 
              className="w-full bg-slate-50 border-2 border-slate-100 py-4 rounded-2xl text-center text-2xl font-black outline-none focus:border-blue-500 tracking-[0.5em]"
              value={otpValue} onChange={e => setOtpValue(e.target.value)}
            />
            <button 
              onClick={handleVerifyOTP}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95"
            >
              Verify & Continue
            </button>
            <button onClick={() => setShowOTP(false)} className="text-[10px] font-black uppercase text-slate-300 hover:text-rose-500">Cancel Registration</button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b px-8 py-5 sticky top-0 z-50 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-100">
            <Stethoscope className="text-white" size={20} />
          </div>
          <div>
            <h1 className="font-black text-lg text-slate-900 tracking-tight uppercase">Specialist Registry</h1>
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Medical Verification Hub</p>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] transition-all duration-500 ${
                currentStep === i ? 'bg-blue-600 text-white ring-4 ring-blue-50 scale-110' : 
                currentStep > i ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                {currentStep > i ? <CheckCircle size={16} /> : i + 1}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest ${
                currentStep >= i ? 'text-slate-900' : 'text-slate-300'
              }`}>{s.label}</span>
              {i < STEPS.length - 1 && <div className="w-4 h-[1px] bg-slate-100 ml-2" />}
            </div>
          ))}
        </div>
      </header>

      <main className="flex-1 p-6 md:p-12 max-w-5xl mx-auto w-full">
        <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
          
          <div className="p-10 border-b bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg text-blue-600">
                {React.createElement(STEPS[currentStep].icon, { size: 28 })}
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{STEPS[currentStep].label}</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Section {currentStep + 1} of {STEPS.length}</p>
              </div>
            </div>
            {currentStep > 0 && (
              <button 
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-all flex items-center gap-2"
              >
                <ArrowLeft size={16} /> Previous
              </button>
            )}
          </div>

          <div className="p-10 min-h-[400px]">
            {/* STEP 1: BASIC INFO */}
            {currentStep === 0 && (
              <div className="grid md:grid-cols-2 gap-10 animate-in fade-in duration-300">
                <div className="space-y-6">
                  <div className="flex flex-col items-center mb-8">
                    <div className="w-24 h-24 bg-slate-100 rounded-[2rem] border-4 border-white shadow-xl flex items-center justify-center text-slate-300 relative group cursor-pointer overflow-hidden">
                      {formData.profilePhoto ? <img src={formData.profilePhoto} className="w-full h-full object-cover" /> : <Camera size={32} />}
                      <div className="absolute inset-0 bg-blue-600/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Upload size={20} className="text-white" />
                      </div>
                    </div>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-3">Upload Profile Photo</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Full Name (Clinical Records)*</label>
                      <input type="text" className="w-full border-b-2 border-slate-100 py-3 outline-none focus:border-blue-500 font-bold transition-all" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} placeholder="e.g. Dr. Sameer Khan" />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Phone Number (+91)*</label>
                        <input type="tel" maxLength={10} className="w-full border-b-2 border-slate-100 py-3 outline-none focus:border-blue-500 font-bold" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value.replace(/\D/g, '')})} placeholder="10-digit number" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Date of Birth*</label>
                        <input type="date" className="w-full border-b-2 border-slate-100 py-3 outline-none focus:border-blue-500 font-bold" value={formData.dateOfBirth} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email Address*</label>
                    <input type="email" className="w-full border-b-2 border-slate-100 py-3 outline-none focus:border-blue-500 font-bold" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="doctor@clinical-email.com" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex justify-between">
                      Create Portal Password*
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${['bg-slate-100', 'bg-rose-500/10 text-rose-500', 'bg-amber-500/10 text-amber-500', 'bg-blue-500/10 text-blue-500', 'bg-emerald-500/10 text-emerald-500'][calculatePasswordStrength(formData.password)]}`}>
                        {['NONE', 'WEAK', 'FAIR', 'GOOD', 'STRONG'][calculatePasswordStrength(formData.password)]}
                      </span>
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input type="password" placeholder="Min 8 chars, 1 uppercase, 1 symbol" className="w-full pl-6 border-b-2 border-slate-100 py-3 outline-none focus:border-blue-500 font-bold" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Confirm Password*</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input type="password" className="w-full pl-6 border-b-2 border-slate-100 py-3 outline-none focus:border-blue-500 font-bold" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />
                    </div>
                  </div>
                  <div className="p-5 bg-blue-50/50 rounded-[1.5rem] border border-blue-100 flex items-start gap-3">
                    <Info className="text-blue-500 shrink-0" size={16} />
                    <p className="text-[10px] font-bold text-blue-800 leading-relaxed">
                      Your clinical password must be strong to protect sensitive patient records and EMR data.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: CREDENTIALS */}
            {currentStep === 1 && (
              <div className="grid md:grid-cols-2 gap-10 animate-in fade-in duration-300">
                <div className="space-y-6">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Medical Registration Number*</label>
                    <input type="text" className="w-full border-b-2 border-slate-100 py-3 outline-none focus:border-blue-500 font-black text-xl tracking-widest" value={formData.medicalRegistrationNumber} onChange={e => handleRegNoFormat(e.target.value)} placeholder="XXXXX-XXXXX-XXXXX" />
                    <p className="text-[8px] font-black text-slate-400 uppercase mt-1">Format: MCI/State Council ID</p>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Primary Qualification*</label>
                      <select className="w-full border-b-2 border-slate-100 py-3 outline-none focus:border-blue-500 font-bold bg-white" value={formData.primaryQualification} onChange={e => setFormData({...formData, primaryQualification: e.target.value})}>
                        {QUALIFICATIONS.map(q => <option key={q} value={q}>{q}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Specialization*</label>
                      <select className="w-full border-b-2 border-slate-100 py-3 outline-none focus:border-blue-500 font-bold bg-white" value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value as any})}>
                        {Object.values(Specialization).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Medical Council / University*</label>
                    <input type="text" className="w-full border-b-2 border-slate-100 py-3 outline-none focus:border-blue-500 font-bold" value={formData.medicalCouncil} onChange={e => setFormData({...formData, medicalCouncil: e.target.value})} placeholder="e.g. Medical Council of India" />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Year of Registration*</label>
                      <input type="number" className="w-full border-b-2 border-slate-100 py-3 outline-none focus:border-blue-500 font-bold" value={formData.yearOfRegistration} onChange={e => setFormData({...formData, yearOfRegistration: parseInt(e.target.value)})} max={new Date().getFullYear()} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Years of Experience*</label>
                      <input type="number" className="w-full border-b-2 border-slate-100 py-3 outline-none focus:border-blue-500 font-bold" value={formData.yearsOfExperience} onChange={e => setFormData({...formData, yearsOfExperience: parseInt(e.target.value)})} min={0} max={60} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Areas of Expertise (Tags)</label>
                    <div className="flex gap-2">
                      <input type="text" className="flex-1 border-2 border-slate-100 rounded-xl px-4 py-2 text-xs font-bold" placeholder="Add specialty e.g. Diabetes" value={expertiseInput} onChange={e => setExpertiseInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && expertiseInput && (setFormData({...formData, areasOfExpertise: [...formData.areasOfExpertise, expertiseInput]}), setExpertiseInput(''))} />
                      <button onClick={() => expertiseInput && (setFormData({...formData, areasOfExpertise: [...formData.areasOfExpertise, expertiseInput]}), setExpertiseInput(''))} className="p-2 bg-blue-600 text-white rounded-xl"><Plus size={18} /></button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.areasOfExpertise.map((tag: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black uppercase tracking-tight flex items-center gap-2">
                          {tag} <X size={10} className="cursor-pointer hover:text-rose-500" onClick={() => setFormData({...formData, areasOfExpertise: formData.areasOfExpertise.filter((_: any, idx: number) => idx !== i)})} />
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: DOCUMENTS (Part 4 Enhanced) */}
            {currentStep === 2 && (
              <div className="animate-in fade-in duration-300">
                <div className="grid md:grid-cols-2 gap-8">
                  {[
                    { key: 'degree', label: 'Medical Degree Certificate*', sub: 'MBBS/BDS Degree • PDF/JPG' },
                    { key: 'registration', label: 'Registration Certificate*', sub: 'Council Registration • PDF/JPG' },
                    { key: 'idProof', label: 'Government ID Proof*', sub: 'Aadhar/PAN/Passport • PDF/JPG' },
                    { key: 'specialization', label: 'Specialization Cert', sub: 'Post-Graduation Proof • Optional' }
                  ].map((doc) => {
                    const status = uploadStatus[doc.key];
                    const isSuccess = status.status === 'success';
                    const isUploading = status.status === 'uploading';
                    const isPdf = status.metadata?.format === 'pdf';

                    return (
                      <div 
                        key={doc.key} 
                        onClick={() => !isUploading && triggerUpload(doc.key)}
                        className={`p-10 border-4 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center text-center transition-all cursor-pointer group relative ${
                          isSuccess ? 'border-emerald-500 bg-emerald-50/30' : 
                          isUploading ? 'border-blue-300 bg-blue-50/20' : 
                          status.error ? 'border-rose-300 bg-rose-50/20' : 'border-slate-100 hover:border-blue-500 hover:bg-blue-50/30'
                        }`}
                      >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all ${
                          isSuccess ? 'bg-emerald-500 text-white' : 
                          isUploading ? 'bg-blue-500 text-white' : 
                          status.error ? 'bg-rose-500 text-white' : 'bg-slate-50 text-slate-300 group-hover:bg-blue-600 group-hover:text-white'
                        }`}>
                          {isSuccess ? (isPdf ? <FileIcon size={28} /> : <ImageIcon size={28} />) : 
                           isUploading ? <Loader2 size={28} className="animate-spin" /> : 
                           status.error ? <AlertCircle size={28} /> : <Upload size={28} />}
                        </div>
                        
                        <h4 className={`text-sm font-black uppercase tracking-tight ${
                          isSuccess ? 'text-emerald-700' : 
                          status.error ? 'text-rose-700' : 'text-slate-900'
                        }`}>{doc.label}</h4>
                        
                        <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                          {status.error ? status.error : doc.sub}
                        </p>

                        {isSuccess && (
                          <div className="mt-4 flex flex-col items-center gap-1">
                            <span className="text-[8px] font-black text-emerald-600 uppercase tracking-[0.2em] flex items-center gap-1">
                              <Check size={10} /> Validated & Encrypted
                            </span>
                            <span className="text-[7px] text-slate-400 truncate max-w-[150px]">{status.metadata.url.split('/').pop()}</span>
                          </div>
                        )}

                        {isUploading && (
                          <div className="absolute bottom-6 left-10 right-10 h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 animate-progress origin-left"></div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-10 p-8 bg-blue-50 rounded-[2rem] border-2 border-blue-100 flex items-center gap-6">
                  <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-blue-200">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h5 className="font-black text-blue-900 uppercase tracking-tight text-sm">Clinical Data Protection</h5>
                    <p className="text-xs font-bold text-blue-800 leading-relaxed max-w-2xl mt-1">
                      All medical documents are stored in a HIPAA-compliant VPC. Files are accessible only during the 48-hour verification window by our Medical Board.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: PRACTICE */}
            {currentStep === 3 && (
              <div className="grid md:grid-cols-2 gap-10 animate-in fade-in duration-300">
                <div className="space-y-6">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Currently Practicing At*</label>
                    <input type="text" className="w-full border-b-2 border-slate-100 py-3 outline-none focus:border-blue-500 font-bold" value={formData.currentPracticePlace} onChange={e => setFormData({...formData, currentPracticePlace: e.target.value})} placeholder="Hospital or Clinic Name" />
                  </div>
                  <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2"><MapPin size={16} className="text-blue-600" /> Clinic Address</h4>
                    <input type="text" placeholder="Street Address" className="w-full bg-transparent border-b-2 border-slate-200 py-2 font-bold text-sm outline-none focus:border-blue-500" value={formData.clinicAddress.street} onChange={e => setFormData({...formData, clinicAddress: {...formData.clinicAddress, street: e.target.value}})} />
                    <div className="grid grid-cols-2 gap-6">
                      <input type="text" placeholder="City / Village" className="bg-transparent border-b-2 border-slate-200 py-2 font-bold text-sm outline-none focus:border-blue-500" value={formData.clinicAddress.city} onChange={e => setFormData({...formData, clinicAddress: {...formData.clinicAddress, city: e.target.value}})} />
                      <input type="text" placeholder="PIN Code" className="bg-transparent border-b-2 border-slate-200 py-2 font-bold text-sm outline-none focus:border-blue-500" maxLength={6} value={formData.clinicAddress.pinCode} onChange={e => setFormData({...formData, clinicAddress: {...formData.clinicAddress, pinCode: e.target.value.replace(/\D/g, '')}})} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Consultation Fee (₹)*</label>
                    <div className="relative">
                      <BadgeIndianRupee className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
                      <input type="number" step={50} min={100} className="w-full pl-8 border-b-2 border-slate-100 py-3 outline-none focus:border-blue-500 font-black text-3xl text-emerald-600" value={formData.consultationFee} onChange={e => setFormData({...formData, consultationFee: parseInt(e.target.value)})} />
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-4 flex items-center gap-2"><Languages size={14} className="text-blue-600" /> Languages Spoken*</label>
                    <div className="flex flex-wrap gap-2">
                      {LANGUAGES.map(l => (
                        <button key={l} onClick={() => {
                          const exists = formData.languagesSpoken.includes(l);
                          setFormData({...formData, languagesSpoken: exists ? formData.languagesSpoken.filter((x: string) => x !== l) : [...formData.languagesSpoken, l]});
                        }} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 transition-all ${
                          formData.languagesSpoken.includes(l) ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'border-slate-100 text-slate-400 hover:border-blue-200'
                        }`}>{l}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-4">Consultation Modes*</label>
                    <div className="flex gap-4">
                      {['video', 'phone', 'in-person'].map(mode => (
                        <label key={mode} className="flex-1 p-4 border-2 rounded-2xl cursor-pointer transition-all flex flex-col items-center gap-2 hover:bg-blue-50 shadow-sm relative overflow-hidden group">
                          <input type="checkbox" className="sr-only" checked={formData.consultationModes.includes(mode)} onChange={() => {
                            const exists = formData.consultationModes.includes(mode);
                            setFormData({...formData, consultationModes: exists ? formData.consultationModes.filter((m: any) => m !== mode) : [...formData.consultationModes, mode]});
                          }} />
                          <div className={`w-3 h-3 rounded-full border-2 border-slate-200 transition-all ${formData.consultationModes.includes(mode) ? 'bg-blue-600 border-blue-600 ring-4 ring-blue-100' : ''}`} />
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">{mode}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Professional Bio</label>
                    <textarea maxLength={500} className="w-full border-2 border-slate-100 p-6 rounded-[2rem] outline-none focus:border-blue-500 font-medium text-sm transition-all h-36 resize-none bg-slate-50/30" placeholder="Briefly describe your clinical approach..." value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: AVAILABILITY */}
            {currentStep === 4 && (
              <div className="animate-in fade-in duration-300 space-y-10">
                <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Default Appointment Duration*</label>
                    <div className="flex gap-2">
                      {DURATIONS.map(d => (
                        <button key={d} onClick={() => setFormData({...formData, appointmentDuration: d})} className={`flex-1 py-4 rounded-xl font-black text-xs uppercase tracking-widest border-2 transition-all ${
                          formData.appointmentDuration === d ? 'bg-slate-900 border-slate-900 text-white shadow-xl' : 'border-slate-100 text-slate-400 hover:border-slate-200'
                        }`}>{d} Min</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-8 bg-blue-50/50 rounded-[2rem] border-2 border-blue-100">
                    <div>
                      <h5 className="font-black text-blue-900 uppercase tracking-tight text-sm">Instant Availability</h5>
                      <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest mt-1">Accepting New Patient Tokens</p>
                    </div>
                    <button onClick={() => setFormData({...formData, acceptingNewPatients: !formData.acceptingNewPatients})} className={`w-14 h-8 rounded-full p-1 transition-all ${formData.acceptingNewPatients ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                      <div className={`w-6 h-6 bg-white rounded-full transition-transform shadow-md ${formData.acceptingNewPatients ? 'translate-x-6' : ''}`} />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2"><Calendar size={14} className="text-blue-600" /> Weekly Shift Scheduling</h4>
                   <div className="border-2 border-slate-100 rounded-[2.5rem] overflow-hidden bg-white shadow-sm divide-y divide-slate-50">
                     {DAYS.map(day => (
                        <div key={day} className={`flex items-center justify-between p-6 transition-all ${formData.availability[day].isAvailable ? 'bg-white' : 'bg-slate-50 opacity-60'}`}>
                           <div className="w-40 flex items-center gap-4">
                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs uppercase transition-all ${formData.availability[day].isAvailable ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                               {day.slice(0, 3)}
                             </div>
                             <div>
                               <p className="font-black text-slate-900 uppercase text-xs tracking-tight">{day}</p>
                               <button onClick={() => setFormData({...formData, availability: {...formData.availability, [day]: {...formData.availability[day], isAvailable: !formData.availability[day].isAvailable}}})} className="text-[9px] font-black uppercase text-blue-500 hover:underline">{formData.availability[day].isAvailable ? 'Close Day' : 'Open Day'}</button>
                             </div>
                           </div>

                           <div className="flex-1 grid grid-cols-2 gap-10">
                              <div className="flex items-center gap-4">
                                <span className="text-[9px] font-black uppercase text-slate-400 shrink-0 tracking-widest">Morning Shift</span>
                                <div className="flex items-center gap-2">
                                  <input type="time" disabled={!formData.availability[day].isAvailable} className="bg-slate-50 border rounded-lg px-2 py-1.5 text-[10px] font-black" value={formData.availability[day].morning.start} onChange={e => setFormData({...formData, availability: {...formData.availability, [day]: {...formData.availability[day], morning: {...formData.availability[day].morning, start: e.target.value}}}})} />
                                  <span className="text-slate-300">-</span>
                                  <input type="time" disabled={!formData.availability[day].isAvailable} className="bg-slate-50 border rounded-lg px-2 py-1.5 text-[10px] font-black" value={formData.availability[day].morning.end} onChange={e => setFormData({...formData, availability: {...formData.availability, [day]: {...formData.availability[day], morning: {...formData.availability[day].morning, end: e.target.value}}}})} />
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-[9px] font-black uppercase text-slate-400 shrink-0 tracking-widest">Evening Shift</span>
                                <div className="flex items-center gap-2">
                                  <input type="time" disabled={!formData.availability[day].isAvailable} className="bg-slate-50 border rounded-lg px-2 py-1.5 text-[10px] font-black" value={formData.availability[day].evening.start} onChange={e => setFormData({...formData, availability: {...formData.availability, [day]: {...formData.availability[day], evening: {...formData.availability[day].evening, start: e.target.value}}}})} />
                                  <span className="text-slate-300">-</span>
                                  <input type="time" disabled={!formData.availability[day].isAvailable} className="bg-slate-50 border rounded-lg px-2 py-1.5 text-[10px] font-black" value={formData.availability[day].evening.end} onChange={e => setFormData({...formData, availability: {...formData.availability, [day]: {...formData.availability[day], evening: {...formData.availability[day].evening, end: e.target.value}}}})} />
                                </div>
                              </div>
                           </div>
                        </div>
                     ))}
                   </div>
                </div>
              </div>
            )}

            {/* STEP 6: SUBMIT */}
            {currentStep === 5 && (
              <div className="animate-in fade-in duration-300 space-y-10">
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-[2rem] flex items-center justify-center mb-6 shadow-xl shadow-emerald-50">
                    <FileSearch size={40} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Final Professional Review</h3>
                  <p className="text-slate-500 font-medium max-w-lg mt-2">Almost there! Review our clinical code of conduct before finishing your registration.</p>
                </div>

                <div className="bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group border-2 border-slate-800">
                   <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12 transition-transform group-hover:scale-110">
                     <ShieldCheck size={160} />
                   </div>
                   <div className="relative z-10 space-y-4 max-h-64 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/20">
                     <h4 className="font-black text-emerald-400 uppercase tracking-widest text-xs">Clinical Usage Agreement v2025</h4>
                     <p className="text-sm font-medium text-slate-300 leading-relaxed">By submitting this application, I solemnly swear to uphold the professional ethics defined by the Medical Council of India and Telemedicine Guidelines (2020)...</p>
                     <p className="text-sm font-medium text-slate-300 leading-relaxed">I understand that HealthDost acts as a technology intermediary bridging rural kiosks with urban specialists. I agree to keep my session availability updated to avoid patient wait-times...</p>
                     <p className="text-sm font-medium text-slate-300 leading-relaxed">I confirm that all clinical advice provided through the platform will be based on high-fidelity video assessment of the patient at the kiosk station...</p>
                   </div>
                </div>

                <div className="space-y-6">
                  <label className="flex items-start gap-5 p-6 bg-white border-2 border-slate-100 rounded-[1.5rem] hover:border-blue-500 cursor-pointer transition-all group">
                    <input type="checkbox" className="mt-1 w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <div className="flex-1">
                      <p className="text-sm font-black text-slate-900 uppercase tracking-tight">I agree to the Terms & Clinical Usage Policies</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Platform-Wide Requirement</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-5 p-6 bg-white border-2 border-slate-100 rounded-[1.5rem] hover:border-blue-500 cursor-pointer transition-all group">
                    <input type="checkbox" className="mt-1 w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <div className="flex-1">
                      <p className="text-sm font-black text-slate-900 uppercase tracking-tight">I certify that all provided credentials are true and accurate</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Self-Declaration Statement</p>
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="p-10 bg-slate-50 border-t flex items-center justify-between">
            <div className="hidden md:block">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">HealthDost Infrastructure • Verified Session</p>
            </div>
            
            <div className="flex gap-4 w-full md:w-auto">
              {currentStep < STEPS.length - 1 ? (
                <button 
                  onClick={handleNext}
                  disabled={!validateCurrentStep()}
                  className="w-full md:w-auto px-12 py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-lg uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 shadow-2xl shadow-blue-100 transition-all flex items-center justify-center gap-4 active:scale-95"
                >
                  Next Section <ArrowRight size={24} />
                </button>
              ) : (
                <button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full md:w-auto px-12 py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black text-lg uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50 shadow-2xl shadow-emerald-100 transition-all flex items-center justify-center gap-4 active:scale-95"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <ShieldCheck size={28} />}
                  Complete Registration
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="py-8 text-center border-t bg-white">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Qualified Specialists Only • India Rural Health Network</p>
      </footer>
      
      <style>{`
        @keyframes progress {
          0% { transform: scaleX(0); }
          50% { transform: scaleX(0.7); }
          100% { transform: scaleX(1); }
        }
        .animate-progress {
          animation: progress 1.2s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
};

export default DoctorRegister;
