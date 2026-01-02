
import React, { useState } from 'react';
import { 
  PlusCircle, 
  Stethoscope, 
  CheckCircle2, 
  Loader2,
  ChevronRight,
  ShieldAlert,
  Info,
  UserCheck,
  CreditCard,
  CheckCircle,
  ArrowLeft,
  Printer,
  CalendarCheck,
  BadgeIndianRupee,
  AlertTriangle,
  // Moved misplaced imports from bottom of file
  LayoutDashboardIcon,
  ShieldCheck as ShieldCheckIcon
} from 'lucide-react';
import { api } from '../api';
import { SymptomAnalysis, Patient, Gender, Doctor, PaymentMethod } from '../types';

enum WizardStep {
  REGISTRATION,
  ANALYSIS,
  DOCTOR_SELECT,
  PAYMENT,
  CONFIRMATION
}

const Dashboard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<WizardStep>(WizardStep.REGISTRATION);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'male' as Gender,
    village: '',
    symptoms: ''
  });
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SymptomAnalysis | null>(null);
  const [availableDoctors, setAvailableDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [finalAppointmentId, setFinalAppointmentId] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const startAnalysis = async () => {
    if (!formData.symptoms || !formData.name) {
      alert("Required: Patient Name and Symptoms.");
      return;
    }
    setIsAnalyzing(true);
    try {
      const result = await api.ai.analyze(formData);
      setAnalysisResult(result);
      setCurrentStep(WizardStep.ANALYSIS);
      
      const docs = await api.doctors.list(result.recommendedDoctor);
      setAvailableDoctors(docs.length > 0 ? docs : await api.doctors.list('General Physician'));
    } catch (error) {
      console.error("Analysis Error:", error);
      alert("AI Service Unavailable. Continuing to manual doctor selection.");
      setAnalysisResult({
        possibleConditions: ["Assessment unavailable"],
        urgency: "routine",
        recommendedDoctor: "General Physician",
        advice: "Consult General Physician for primary checkup.",
        precautions: ["Monitor symptoms"]
      });
      setCurrentStep(WizardStep.ANALYSIS);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const finalizeBooking = async () => {
    if (!selectedDoctor) return;
    try {
      const patient = await api.patients.create({
        name: formData.name,
        age: Number(formData.age),
        gender: formData.gender,
        village: formData.village,
        symptoms: formData.symptoms,
        phone: '9999999999' // Dummy phone for agent booking
      });

      const app = await api.appointments.book({
        patientId: patient._id,
        patientName: patient.name,
        doctorId: selectedDoctor._id,
        doctorName: selectedDoctor.name,
        appointmentTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        paymentMethod: paymentMethod,
        amount: selectedDoctor.fee,
        symptoms: formData.symptoms,
        analysis: analysisResult // Persist AI result in DB
      });

      setFinalAppointmentId(app._id);
      setCurrentStep(WizardStep.CONFIRMATION);
    } catch (error) {
      alert("Booking failed. Please check connection.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const resetWizard = () => {
    setFormData({ name: '', age: '', gender: 'male', village: '', symptoms: '' });
    setAnalysisResult(null);
    setSelectedDoctor(null);
    setCurrentStep(WizardStep.REGISTRATION);
  };

  const getUrgencyStyles = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'emergency': return 'bg-rose-600 text-white animate-pulse';
      case 'urgent': return 'bg-amber-500 text-white';
      default: return 'bg-teal-600 text-white';
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen">
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-teal-100 text-teal-700 rounded-2xl">
            <LayoutDashboardIcon size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Visit Flow</h1>
            <p className="text-slate-500 text-sm font-medium">Session ID: {Math.floor(Math.random() * 900000 + 100000)}</p>
          </div>
        </div>
        
        {/* Progress Tracker */}
        <div className="flex items-center gap-2">
          {['Register', 'Analysis', 'Doctor', 'Pay', 'Final'].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                currentStep >= i ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {currentStep > i ? <CheckCircle size={16} /> : i + 1}
              </div>
              <span className={`hidden lg:block text-[10px] font-black uppercase tracking-widest ${
                currentStep >= i ? 'text-teal-700' : 'text-slate-400'
              }`}>{label}</span>
              {i < 4 && <div className="hidden lg:block w-4 h-[2px] bg-slate-100 mx-1" />}
            </div>
          ))}
        </div>
      </header>

      {/* STEP 1: REGISTRATION */}
      {currentStep === WizardStep.REGISTRATION && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="p-8 border-b bg-slate-50/50 flex items-center gap-3">
            <PlusCircle className="text-teal-600" size={24} />
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Step 1: Patient Intake</h2>
          </div>
          <div className="p-8 grid md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Patient Full Name</label>
                <input 
                  type="text" name="name" value={formData.name} onChange={handleInputChange}
                  className="w-full px-5 py-4 border-2 border-slate-100 rounded-2xl focus:border-teal-500 outline-none transition-all text-xl font-bold text-slate-900 placeholder:text-slate-200"
                  placeholder="e.g. Ramesh Chandra"
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Age (Years)</label>
                  <input 
                    type="number" name="age" value={formData.age} onChange={handleInputChange}
                    className="w-full px-5 py-4 border-2 border-slate-100 rounded-2xl focus:border-teal-500 outline-none text-xl font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Gender</label>
                  <select 
                    name="gender" value={formData.gender} onChange={handleInputChange}
                    className="w-full px-5 py-4 border-2 border-slate-100 rounded-2xl focus:border-teal-500 outline-none text-lg font-bold bg-white"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Village / Locality</label>
                <input 
                  type="text" name="village" value={formData.village} onChange={handleInputChange}
                  className="w-full px-5 py-4 border-2 border-slate-100 rounded-2xl focus:border-teal-500 outline-none text-lg font-bold"
                  placeholder="e.g. Sonipat District"
                />
              </div>
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-500" /> Current Symptoms
              </label>
              <textarea 
                name="symptoms" value={formData.symptoms} onChange={handleInputChange}
                className="flex-1 w-full px-5 py-4 border-2 border-slate-100 rounded-2xl focus:border-teal-500 outline-none transition-all resize-none text-lg font-medium leading-relaxed"
                placeholder="Describe fever duration, pain location, or any specific discomfort..."
              />
              <button 
                onClick={startAnalysis} disabled={isAnalyzing}
                className="mt-8 w-full bg-teal-600 text-white py-5 rounded-2xl font-black text-lg uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-teal-700 disabled:opacity-50 shadow-2xl shadow-teal-100 transition-all active:scale-95"
              >
                {isAnalyzing ? <Loader2 className="animate-spin" /> : <Stethoscope size={24} />}
                {isAnalyzing ? "Processing AI Analysis..." : "Continue to Analysis"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: ANALYSIS */}
      {currentStep === WizardStep.ANALYSIS && analysisResult && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
          <div className={`p-8 border-b flex items-center justify-between ${getUrgencyStyles(analysisResult.urgency)}`}>
            <div className="flex items-center gap-3">
              <ShieldAlert size={28} />
              <h2 className="text-xl font-black uppercase tracking-tight">AI Screening Report</h2>
            </div>
            <span className="text-xs font-black uppercase tracking-[0.2em] px-4 py-2 bg-white/20 rounded-full border border-white/30 backdrop-blur-sm">
              {analysisResult.urgency} Level
            </span>
          </div>
          <div className="p-8 space-y-10">
            {analysisResult.urgency === 'emergency' && (
              <div className="bg-rose-50 border-2 border-rose-100 p-6 rounded-2xl flex items-center gap-6 text-rose-800">
                <div className="w-16 h-16 bg-rose-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-rose-200">
                  <ShieldAlert size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight mb-1">Emergency Protocol</h3>
                  <p className="font-medium text-sm">Symptoms indicate critical risk. Suggest immediate transport to district hospital while waiting for specialist.</p>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Info size={16} className="text-teal-500" /> Possible Conditions
                  </h4>
                  <div className="grid gap-3">
                    {analysisResult.possibleConditions.map((c, i) => (
                      <div key={i} className="bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100 font-bold text-slate-800 text-lg">
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Immediate Advice</h4>
                  <div className="p-6 bg-teal-50 border border-teal-100 rounded-3xl text-teal-900 text-lg leading-relaxed font-semibold italic">
                    "{analysisResult.advice}"
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Recommended Precautions</h4>
                  <div className="space-y-4">
                    {analysisResult.precautions.map((p, i) => (
                      <div key={i} className="flex gap-4 text-slate-600 font-medium text-lg leading-snug">
                        <CheckCircle2 size={24} className="text-teal-500 shrink-0" />
                        {p}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-8 border-t border-slate-100">
                  <p className="text-slate-400 text-xs font-bold uppercase mb-4 tracking-widest">Target Specialist</p>
                  <p className="text-teal-700 font-black text-3xl mb-8">{analysisResult.recommendedDoctor}</p>
                  <button 
                    onClick={() => setCurrentStep(WizardStep.DOCTOR_SELECT)}
                    className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                  >
                    Select Best Doctor <ChevronRight size={24} />
                  </button>
                  <button onClick={() => setCurrentStep(WizardStep.REGISTRATION)} className="w-full py-4 mt-2 text-slate-400 font-bold text-sm hover:text-teal-600 transition-colors">
                    <ArrowLeft size={14} className="inline mr-2" /> Modify Intake Info
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: DOCTOR SELECT */}
      {currentStep === WizardStep.DOCTOR_SELECT && (
        <div className="animate-in fade-in slide-in-from-right-8 duration-500">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                <UserCheck size={28} className="text-teal-600" />
                Step 3: Specialist Matching
              </h2>
              <p className="text-slate-500 font-medium">Top doctors matching the AI's recommendation.</p>
            </div>
            <div className="px-5 py-2 bg-teal-50 text-teal-700 rounded-full font-black text-xs uppercase tracking-widest border border-teal-100">
              Filtering: {analysisResult?.recommendedDoctor}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {availableDoctors.map((doc) => (
              <div 
                key={doc._id} 
                onClick={() => doc.available && setSelectedDoctor(doc)}
                className={`p-8 bg-white rounded-3xl border-4 transition-all cursor-pointer relative overflow-hidden group ${
                  selectedDoctor?._id === doc._id 
                    ? 'border-teal-600 bg-teal-50/20 shadow-2xl shadow-teal-100' 
                    : doc.available ? 'border-slate-100 hover:border-teal-200 hover:shadow-xl' : 'border-slate-50 opacity-60 cursor-not-allowed'
                }`}
              >
                {selectedDoctor?._id === doc._id && (
                  <div className="absolute top-0 right-0 p-4 bg-teal-600 text-white rounded-bl-3xl shadow-lg">
                    <CheckCircle size={28} />
                  </div>
                )}
                {!doc.available && (
                  <div className="absolute inset-0 bg-white/40 flex items-center justify-center z-10 backdrop-blur-[1px]">
                    <span className="bg-rose-100 text-rose-600 px-6 py-2 rounded-full font-black uppercase text-sm tracking-widest border-2 border-rose-200 shadow-xl">Unavailable Today</span>
                  </div>
                )}
                
                <div className="flex items-center gap-6 mb-6">
                  <div className="relative">
                    <img src={doc.avatar} className="w-24 h-24 rounded-3xl object-cover shadow-lg ring-8 ring-slate-50" />
                    {doc.available && <span className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></span>}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-2xl mb-1">{doc.name}</h3>
                    <p className="text-teal-600 font-black text-sm uppercase tracking-[0.2em]">{doc.specialization}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-white p-3 rounded-2xl border border-slate-100 flex flex-col gap-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Languages</span>
                    {/* Fix: Use 'languagesSpoken' instead of 'languages' */}
                    <span className="text-sm font-bold text-slate-700 truncate">{doc.languagesSpoken.join(', ')}</span>
                  </div>
                  <div className="bg-white p-3 rounded-2xl border border-slate-100 flex flex-col gap-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Session Fee</span>
                    <span className="text-lg font-black text-emerald-600">₹{doc.fee}</span>
                  </div>
                </div>

                <button 
                  className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all ${
                    selectedDoctor?._id === doc._id 
                      ? 'bg-teal-600 text-white shadow-xl shadow-teal-100' 
                      : 'bg-slate-100 text-slate-400 group-hover:bg-teal-500 group-hover:text-white'
                  }`}
                >
                  {selectedDoctor?._id === doc._id ? 'Confirmed' : 'Select Specialist'}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-12 flex gap-4">
            <button 
              onClick={() => setCurrentStep(WizardStep.ANALYSIS)}
              className="px-10 py-5 bg-white border-2 border-slate-100 rounded-2xl font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50"
            >
              <ArrowLeft size={20} /> Back
            </button>
            <button 
              disabled={!selectedDoctor}
              onClick={() => setCurrentStep(WizardStep.PAYMENT)}
              className="flex-1 bg-teal-600 text-white py-5 rounded-2xl font-black text-xl uppercase tracking-widest hover:bg-teal-700 disabled:opacity-50 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-teal-100"
            >
              Confirm & Continue <ChevronRight size={24} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: PAYMENT */}
      {currentStep === WizardStep.PAYMENT && selectedDoctor && (
        <div className="max-w-xl mx-auto bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden animate-in fade-in zoom-in-95 duration-500">
          <div className="p-10 border-b bg-slate-50/50 flex items-center gap-4 text-teal-600">
            <CreditCard size={32} />
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Step 4: Finalize Visit</h2>
          </div>
          <div className="p-10 space-y-10">
            <div className="bg-slate-900 p-8 rounded-[2rem] text-white flex justify-between items-center shadow-2xl">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Patient Payable Amount</p>
                <p className="text-5xl font-black">₹{selectedDoctor.fee}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg mb-1">{selectedDoctor.name}</p>
                <div className="px-3 py-1 bg-white/10 rounded-full inline-block font-black text-[10px] uppercase tracking-widest text-teal-400">Specialist</div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] block mb-6">Preferred Payment Gateway</label>
              <div className="grid grid-cols-2 gap-6">
                <button 
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-8 rounded-[2rem] border-4 flex flex-col items-center gap-4 transition-all ${
                    paymentMethod === 'cash' 
                      ? 'border-teal-600 bg-teal-50 text-teal-700 shadow-xl shadow-teal-50' 
                      : 'border-slate-100 text-slate-400 hover:border-slate-200'
                  }`}
                >
                  <div className={`p-4 rounded-2xl ${paymentMethod === 'cash' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <BadgeIndianRupee size={40} />
                  </div>
                  <span className="font-black uppercase tracking-widest text-xs">Cash Desk</span>
                </button>
                <button 
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-8 rounded-[2rem] border-4 flex flex-col items-center gap-4 transition-all ${
                    paymentMethod === 'upi' 
                      ? 'border-teal-600 bg-teal-50 text-teal-700 shadow-xl shadow-teal-50' 
                      : 'border-slate-100 text-slate-400 hover:border-slate-200'
                  }`}
                >
                  <div className={`p-4 rounded-2xl flex items-center justify-center font-black italic text-2xl ${paymentMethod === 'upi' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    BHIM
                  </div>
                  <span className="font-black uppercase tracking-widest text-xs">UPI / Digital</span>
                </button>
              </div>
            </div>

            <div className="pt-4 space-y-4">
              <button 
                onClick={finalizeBooking}
                className="w-full bg-teal-600 text-white py-6 rounded-3xl font-black text-xl uppercase tracking-[0.2em] hover:bg-teal-700 shadow-2xl shadow-teal-100 transition-all flex items-center justify-center gap-4"
              >
                Submit Visit Request <CheckCircle size={28} />
              </button>
              <button 
                onClick={() => setCurrentStep(WizardStep.DOCTOR_SELECT)}
                className="w-full text-slate-400 font-bold text-sm hover:text-teal-600 transition-colors"
              >
                Change Selected Doctor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: CONFIRMATION */}
      {currentStep === WizardStep.CONFIRMATION && (
        <div className="max-w-2xl mx-auto text-center space-y-12 animate-in zoom-in-90 duration-700 py-12">
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 bg-teal-100 rounded-full animate-ping opacity-25"></div>
            </div>
            <div className="relative w-40 h-40 bg-teal-600 text-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-teal-200 rotate-12">
              <CheckCircle size={80} className="-rotate-12" />
            </div>
          </div>
          
          <div>
            <h2 className="text-5xl font-black text-slate-900 mb-4 tracking-tighter">SUCCESSFUL!</h2>
            <div className="inline-block px-6 py-2 bg-slate-900 text-white rounded-full font-mono font-bold tracking-[0.2em] text-sm">
              TOKEN #{finalAppointmentId}
            </div>
          </div>

          <div id="printable-token" className="bg-white p-10 rounded-[2.5rem] border-4 border-slate-900 text-left space-y-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
              <ShieldCheckIcon size={120} />
            </div>
            
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Patient Card</h4>
                <p className="text-3xl font-black text-slate-900">{formData.name}</p>
                <p className="font-bold text-slate-500">{formData.age}y / {formData.gender.toUpperCase()} • {formData.village}</p>
              </div>
              <div className="text-right">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Consultation</h4>
                <p className="text-xl font-black text-teal-600">{selectedDoctor?.name}</p>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{selectedDoctor?.specialization}</p>
              </div>
            </div>

            <div className="pt-8 border-t-2 border-dashed border-slate-100 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Receipt Summary</p>
                <p className="text-2xl font-black text-slate-900">₹{selectedDoctor?.fee}</p>
                <p className="text-[10px] font-bold text-teal-600 uppercase">Paid via {paymentMethod.toUpperCase()}</p>
              </div>
              <button 
                onClick={handlePrint}
                className="flex items-center gap-3 bg-slate-100 text-slate-900 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-colors shadow-sm"
              >
                <Printer size={20} /> Print Token
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 pt-8">
            <button 
              onClick={resetWizard}
              className="flex-1 bg-teal-600 text-white py-6 rounded-3xl font-black text-xl uppercase tracking-widest hover:bg-teal-700 shadow-2xl shadow-teal-100 transition-all active:scale-95"
            >
              Start New Visit
            </button>
            <button 
              onClick={() => window.location.hash = '#/appointments'}
              className="flex-1 bg-white border-2 border-slate-200 text-slate-600 py-6 rounded-3xl font-black text-xl uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
            >
              Queue Manager
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;