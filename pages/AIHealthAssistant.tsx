
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bot, 
  ArrowLeft, 
  Zap, 
  Activity, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Pill, 
  Heart,
  Clock,
  ShieldCheck,
  UserPlus,
  Phone,
  AlertCircle,
  Building2,
  BadgeIndianRupee,
  ChevronRight,
  Info,
  MapPin,
  ShieldQuestion,
  Check,
  X,
  ClipboardList,
  Stethoscope,
  Lock,
  // Added Calendar icon import to fix the error on line 351
  Calendar
} from 'lucide-react';
import { api } from '../api';
import { UserAuth, AIDiagnosis, Patient, Doctor, Medicine, UserRole } from '../types';

const COMMON_ISSUES = [
  "Fever & Chills",
  "Severe Cough",
  "Stomach Ache",
  "Headache / Migraine",
  "Body Pain",
  "Skin Rash",
  "Diarrhea / Loose Motion",
  "Weakness / Fatigue",
  "Dizziness",
  "Eye Irritation"
];

const DURATIONS = [
  "Less than 24 hours",
  "1-3 Days",
  "3-7 Days",
  "1-2 Weeks",
  "More than a month"
];

const SCREENING_QUESTIONS = [
  { id: 'fever_high', label: 'Fever above 102°F?' },
  { id: 'difficulty_breathing', label: 'Difficulty breathing?' },
  { id: 'pain_severe', label: 'Pain is unbearable?' },
  { id: 'drowsy', label: 'Feeling unusually drowsy?' },
  { id: 'travel', label: 'Recent travel history?' },
  { id: 'med_history', label: 'History of similar issue?' }
];

const AIHealthAssistant: React.FC<{ auth: UserAuth }> = ({ auth }) => {
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(false);
  const [symptoms, setSymptoms] = useState('');
  const [duration, setDuration] = useState(DURATIONS[0]);
  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe'>('moderate');
  const [conditions, setConditions] = useState<string[]>([]);
  const [medications, setMedications] = useState('');
  
  // Structured Clinical Inputs
  const [bpSys, setBpSys] = useState('');
  const [bpDia, setBpDia] = useState('');
  const [screeningAnswers, setScreeningAnswers] = useState<Record<string, boolean>>({});
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIDiagnosis | null>(null);
  const [matchedDoctors, setMatchedDoctors] = useState<Doctor[]>([]);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [showGuestBookingAlert, setShowGuestBookingAlert] = useState(false);

  const isGuest = auth.role === UserRole.GUEST;

  // Persistence: Load draft from Session Storage
  useEffect(() => {
    if (!isGuest) loadPatient();
    
    const savedDraft = sessionStorage.getItem(`ai_draft_${auth.id}`);
    if (savedDraft) {
      const draft = JSON.parse(savedDraft);
      setSymptoms(draft.symptoms || '');
      setDuration(draft.duration || DURATIONS[0]);
      setSeverity(draft.severity || 'moderate');
      setBpSys(draft.bpSys || '');
      setBpDia(draft.bpDia || '');
      setScreeningAnswers(draft.screeningAnswers || {});
      setMedications(draft.medications || '');
      setConditions(draft.conditions || []);
    }
  }, [auth.id, isGuest]);

  // Persistence: Save draft on change
  useEffect(() => {
    const draft = { symptoms, duration, severity, bpSys, bpDia, screeningAnswers, medications, conditions };
    sessionStorage.setItem(`ai_draft_${auth.id}`, JSON.stringify(draft));
  }, [symptoms, duration, severity, bpSys, bpDia, screeningAnswers, medications, conditions, auth.id]);

  const loadPatient = async () => {
    const p = await api.patients.get(auth.id);
    setPatient(p || null);
  };

  const toggleScreening = (id: string) => {
    setScreeningAnswers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleQuickSelect = (issue: string) => {
    setSymptoms(prev => {
      const trimmed = prev.trim();
      if (!trimmed) return issue;
      if (trimmed.toLowerCase().includes(issue.toLowerCase())) return prev;
      return `${trimmed}, ${issue}`;
    });
  };

  const checkEdgeCases = (data: any): AIDiagnosis | null => {
    // 1. Pediatric Check
    if (data.age && data.age < 12) {
      return {
        confidence: 0,
        diagnosis: { primary: "Pediatric Evaluation Required", differential: [] },
        analysis: "HealthDost AI is optimized for adult screening. Children require high-fidelity examination by a qualified pediatrician due to distinct physiological needs.",
        prescription: { medicines: [], homeRemedies: ["Maintain hydration", "Monitor temperature hourly"] },
        precautions: ["No OTC drugs for children without doctor's consent"],
        whenToSeekDoctor: ["Fever > 102°F", "Lethargy", "Decreased urination"],
        recommendedSpecialization: "Pediatrician",
        urgencyLevel: "urgent"
      };
    }

    // 2. Blood Pressure Emergency (Hypertensive Crisis)
    const sys = parseInt(bpSys);
    const dia = parseInt(bpDia);
    if ((sys >= 180) || (dia >= 120)) {
      return {
        confidence: 100,
        diagnosis: { primary: "Hypertensive Emergency / Crisis", differential: [] },
        analysis: "CRITICAL: Your blood pressure is dangerously high (Hypertensive Crisis). This level of BP can cause immediate organ damage (stroke, heart attack, or kidney failure).",
        prescription: { medicines: [], homeRemedies: ["Sit down quietly", "Do not panic", "Do not drink caffeine"] },
        precautions: ["DO NOT TAKE ANY OTC MEDICATION", "Stop all physical activity"],
        whenToSeekDoctor: ["Immediate Emergency Help Required"],
        recommendedSpecialization: "Cardiologist",
        urgencyLevel: "emergency"
      };
    }

    // 3. Pregnancy Check
    if (data.existingConditions.includes('pregnant') || symptoms.toLowerCase().includes('pregnant')) {
      return {
        confidence: 0,
        diagnosis: { primary: "Obstetric Triage Required", differential: [] },
        analysis: "Safety Protocol: Any symptoms during pregnancy require immediate verification by an OB/GYN to ensure both maternal and fetal safety.",
        prescription: { medicines: [], homeRemedies: ["Rest in left lateral position", "Hydrate"] },
        precautions: ["Avoid all self-medication"],
        whenToSeekDoctor: ["Vaginal bleeding", "Fluid leakage", "Reduced fetal movement"],
        recommendedSpecialization: "Gynecologist",
        urgencyLevel: "urgent"
      };
    }

    // 4. Emergency Keywords
    const emergencyKeywords = ['chest pain', 'can\'t breathe', 'difficulty breathing', 'bleeding heavily', 'unconscious', 'seizure', 'face drooping', 'slurred speech'];
    const hasBreathingDifficulty = screeningAnswers['difficulty_breathing'] === true;
    
    if (emergencyKeywords.some(k => symptoms.toLowerCase().includes(k)) || hasBreathingDifficulty) {
      return {
        confidence: 0,
        diagnosis: { primary: "Critical Clinical Emergency", differential: [] },
        analysis: "EMERGENCY: Symptoms indicate a potentially life-threatening condition (Stroke, MI, or Respiratory Failure). Every minute counts.",
        prescription: { medicines: [], homeRemedies: [] },
        precautions: ["IMMEDIATE HOSPITALIZATION REQUIRED", "Call 108 Emergency Service"],
        whenToSeekDoctor: ["Call Emergency Services Immediately"],
        recommendedSpecialization: "Emergency Specialist",
        urgencyLevel: "emergency"
      };
    }

    return null;
  };

  const runAnalysis = async () => {
    if (!symptoms.trim()) return;
    setIsAnalyzing(true);
    try {
      const screeningSummary = Object.entries(screeningAnswers)
        .filter(([_, val]) => val)
        .map(([id]) => SCREENING_QUESTIONS.find(q => q.id === id)?.label)
        .join(', ');

      const inputData = {
        age: patient?.age || 30, // Default for guests
        gender: patient?.gender || 'other',
        symptoms: `${symptoms}. BP: ${bpSys}/${bpDia} mmHg. Additional markers: ${screeningSummary || 'None'}.`,
        duration,
        severity,
        existingConditions: conditions.length > 0 ? conditions : ['none'],
        currentMedications: medications || 'none'
      };

      const edgeCaseResult = checkEdgeCases(inputData);
      if (edgeCaseResult) {
        setAiResult(edgeCaseResult);
        const docs = await api.doctors.list(edgeCaseResult.recommendedSpecialization);
        setMatchedDoctors(docs.slice(0, 3));
        setIsAnalyzing(false);
        return;
      }
      
      const result = await api.ai.selfDiagnose(inputData);
      setAiResult(result);

      if (!isGuest) {
        await api.ai.saveConsultation({
          patientId: auth.id,
          symptoms: inputData.symptoms,
          duration: inputData.duration,
          severity: inputData.severity,
          existingConditions: inputData.existingConditions,
          currentMedications: inputData.currentMedications,
          ...result
        });
        // Clear persistence upon successful analysis for logged in users
        sessionStorage.removeItem(`ai_draft_${auth.id}`);
      }

      const docs = await api.doctors.list(result.recommendedSpecialization);
      setMatchedDoctors(docs.slice(0, 3));
    } catch (err) {
      alert("AI Diagnostics is temporarily offline. Please consult a doctor directly.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBookingClick = (docId?: string) => {
    if (isGuest) {
      setShowGuestBookingAlert(true);
    } else if (docId) {
      navigate(`/doctor/${docId}`, { state: { prefilledSymptoms: symptoms, aiAnalysis: aiResult } });
    }
  };

  const reset = () => {
    setAiResult(null);
    setSymptoms('');
    setDuration(DURATIONS[0]);
    setSeverity('moderate');
    setConditions([]);
    setMedications('');
    setMatchedDoctors([]);
    setBpSys('');
    setBpDia('');
    setScreeningAnswers({});
    sessionStorage.removeItem(`ai_draft_${auth.id}`);
  };

  const renderHighConfidenceResult = (res: AIDiagnosis) => (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-500">
      <div className="bg-emerald-600 text-white p-8 rounded-[2.5rem] flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner"><CheckCircle2 size={32} /></div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">HIGH CONFIDENCE SCREENING</h2>
            <p className="text-xs font-bold uppercase tracking-widest opacity-80">AI Certainty Score: {res.confidence}%</p>
          </div>
        </div>
        {isGuest && (
          <div className="hidden md:flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/20">
            <Lock size={14} className="text-emerald-200" />
            <span className="text-[10px] font-black uppercase tracking-widest">Guest Mode - Not Saved</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2"><Activity size={14} className="text-emerald-500" /> 📋 Clinical Assessment</h3>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
          <p className="text-3xl font-black text-slate-900 uppercase tracking-tight">{res.diagnosis.primary}</p>
          <p className="text-slate-600 font-medium italic leading-relaxed text-lg">"{res.analysis}"</p>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2"><Pill size={14} className="text-blue-500" /> 💊 Symptom Relief Guidance</h3>
        <div className="grid gap-4">
          {res.prescription.medicines.map((m, i) => (
            <div key={i} onClick={() => setSelectedMedicine(m)} className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-50 flex flex-col md:flex-row items-center gap-8 group hover:border-emerald-200 transition-all cursor-pointer">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <p className="text-xl font-black text-slate-900 uppercase">{m.name}</p>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase rounded">OTC RELIEF</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex flex-col"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Dosage</span><span className="text-xs font-bold text-slate-700">{m.dosage}</span></div>
                  <div className="flex flex-col"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Duration</span><span className="text-xs font-bold text-slate-700">{m.duration}</span></div>
                  <div className="flex flex-col"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Purpose</span><span className="text-xs font-bold text-slate-700">{m.purpose}</span></div>
                </div>
              </div>
              <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 max-w-xs w-full">
                <p className="text-[8px] font-black text-amber-600 uppercase mb-1">Drug Caution</p>
                <p className="text-[10px] font-bold text-amber-800 leading-relaxed">{m.precautions}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2"><Heart size={14} className="text-rose-500" /> 💡 Home Recovery</h3>
          <div className="bg-indigo-50 border border-indigo-100 p-8 rounded-[2.5rem] space-y-4">
            {res.prescription.homeRemedies.map((h, i) => (
              <div key={i} className="flex gap-4 items-start"><div className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-2 shrink-0" /><p className="text-sm font-bold text-indigo-900 leading-relaxed">{h}</p></div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2"><AlertTriangle size={14} className="text-amber-500" /> ⚠️ Watch-Out List</h3>
          <div className="bg-rose-50 border border-rose-100 p-8 rounded-[2.5rem] space-y-4">
            {res.whenToSeekDoctor.map((w, i) => (
              <div key={i} className="flex gap-4 items-start"><div className="w-1.5 h-1.5 bg-rose-400 rounded-full mt-2 shrink-0" /><p className="text-sm font-bold text-rose-900 leading-relaxed">{w}</p></div>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recommended Step</h4>
            <p className="text-lg font-black text-slate-900 uppercase">Consult {res.recommendedSpecialization}</p>
          </div>
          <button 
            onClick={() => handleBookingClick()}
            className="px-12 py-5 bg-teal-600 text-white rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl shadow-teal-100 hover:bg-teal-700 active:scale-95 transition-all flex items-center gap-3"
          >
            {isGuest ? <UserPlus size={20} /> : <Calendar size={20} />}
            {isGuest ? "Sign In to Book Specialist" : "Book Specialist Visit"}
          </button>
      </div>
    </div>
  );

  const renderModerateConfidenceResult = (res: AIDiagnosis) => (
    <div className="space-y-12 animate-in fade-in slide-in-from-right-6 duration-500">
      <div className="bg-amber-500 text-white p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-6 shadow-xl">
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shrink-0"><AlertTriangle size={36} /></div>
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight">MANUAL VERIFICATION REQUIRED</h2>
          <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Confidence Score: {res.confidence}%</p>
          <p className="text-sm font-medium opacity-90 leading-tight">I have identified several possibilities. Please consult a specialist to confirm the diagnosis and receive long-term treatment.</p>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
          <Pill size={14} className="text-blue-500" /> 💊 Immediate Comfort Measures
        </h3>
        <div className="grid gap-4">
          {res.prescription.medicines.map((m, i) => (
            <div key={i} className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-50 flex flex-col md:flex-row items-center gap-8 group hover:border-amber-200 transition-all">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <p className="text-xl font-black text-slate-900 uppercase">{m.name}</p>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-black uppercase rounded">TEMPORARY</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex flex-col"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Dosage</span><span className="text-xs font-bold text-slate-700">{m.dosage}</span></div>
                  <div className="flex flex-col"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Purpose</span><span className="text-xs font-bold text-slate-700">{m.purpose}</span></div>
                </div>
              </div>
              <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 max-w-xs w-full">
                <p className="text-[8px] font-black text-blue-600 uppercase mb-1">Instruction</p>
                <p className="text-10px font-bold text-blue-800 leading-relaxed">Take only for symptom management until you meet the specialist.</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2"><Building2 size={14} className="text-teal-500" /> 🏥 Specialized Clinicians</h3>
        <div className="grid gap-6">
          {matchedDoctors.map(doc => (
            <div key={doc._id} className="p-8 bg-white border-2 border-slate-100 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 group hover:border-teal-500 transition-all shadow-sm hover:shadow-xl">
              <img src={doc.avatar} className="w-20 h-20 rounded-2xl object-cover shadow-lg group-hover:scale-105 transition-transform" />
              <div className="flex-1 space-y-2">
                 <div>
                    <h4 className="text-xl font-black text-slate-900">{doc.name}</h4>
                    <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest">{doc.specialization} • {doc.yearsOfExperience} YRS EXP</p>
                 </div>
                 <div className="flex items-center gap-4 pt-2 border-t border-slate-50">
                    <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase"><BadgeIndianRupee size={12} /> ₹{doc.fee}</span>
                    <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase"><CheckCircle2 size={12} /> SYNCED REPORT</span>
                 </div>
              </div>
              <button 
                onClick={() => handleBookingClick(doc._id)} 
                className={`px-8 py-4 ${isGuest ? 'bg-slate-900' : 'bg-teal-600'} text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-2`}
              >
                {isGuest ? <Lock size={14} /> : null}
                {isGuest ? 'Login to Book' : 'Select Specialist'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderLowConfidenceResult = (res: AIDiagnosis) => (
    <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-700">
      <div className="bg-rose-600 text-white p-10 rounded-[3rem] text-center space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10"><ShieldAlert size={140} /></div>
        <div className="w-20 h-20 bg-white/20 rounded-[2.5rem] flex items-center justify-center mx-auto animate-bounce shadow-xl"><ShieldAlert size={48} /></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-black uppercase tracking-tight leading-tight">CRITICAL ALERT: PHYSICAL EVALUATION NEEDED</h2>
          <p className="text-xs font-bold uppercase tracking-widest opacity-80 mt-2">Complexity Warning: AI Confidence Low</p>
          <p className="text-lg font-bold mt-4 opacity-90">I am unable to safely identify the cause of your symptoms. Do not attempt self-medication.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 pt-10">
        <button onClick={() => window.open('https://maps.google.com/?q=hospital')} className="bg-slate-900 text-white py-8 rounded-[3rem] font-black uppercase tracking-[0.2em] text-sm shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-4"><MapPin size={28} className="text-teal-400" /> Route to Hospital</button>
        <a href="tel:108" className="bg-rose-600 text-white py-8 rounded-[3rem] font-black uppercase tracking-[0.2em] text-sm shadow-2xl hover:bg-rose-700 transition-all flex items-center justify-center gap-4 border-4 border-rose-500 animate-pulse"><Phone size={28} /> Call Ambulance (108)</a>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-inter">
      {/* Guest Booking Alert Overlay */}
      {showGuestBookingAlert && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
             <div className="p-10 bg-slate-900 text-white text-center space-y-4">
               <div className="w-16 h-16 bg-white/20 rounded-[1.5rem] flex items-center justify-center mx-auto"><UserPlus size={32} /></div>
               <h2 className="text-2xl font-black uppercase tracking-tight">Login Required</h2>
             </div>
             <div className="p-10 space-y-6">
               <p className="text-slate-600 font-bold leading-relaxed text-center">Clinical consultations require a verified patient account for medical record keeping and secure communication with specialists.</p>
               <div className="flex gap-4 pt-4">
                 <button onClick={() => setShowGuestBookingAlert(false)} className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-100">Cancel</button>
                 <button onClick={() => {
                    sessionStorage.removeItem('rhh_auth');
                    navigate('/login/patient');
                 }} className="flex-[2] py-4 bg-teal-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-teal-100 hover:bg-teal-700 transition-all">Login / Register</button>
               </div>
             </div>
          </div>
        </div>
      )}

      {selectedMedicine && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b bg-blue-600 text-white flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-2xl"><Pill size={24} /></div>
                    <div><h3 className="text-xl font-black uppercase tracking-tight">{selectedMedicine.name}</h3><p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Clinical Fact-Sheet</p></div>
                 </div>
                 <button onClick={() => setSelectedMedicine(null)} className="p-2 hover:bg-white/20 rounded-xl transition-colors"><X size={24} /></button>
              </div>
              <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto">
                 <div className="space-y-2"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Medical Purpose</p><p className="font-bold text-slate-700 leading-relaxed italic text-lg">"{selectedMedicine.purpose}"</p></div>
                 <div className="space-y-4"><p className="text-[9px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1"><AlertTriangle size={10} /> Safety Contraindications</p><div className="flex flex-wrap gap-2">{['History of Allergy', 'Liver/Kidney issues', 'Pregnancy'].map(c => (<span key={c} className="px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black uppercase border border-rose-100">{c}</span>))}</div></div>
                 <button onClick={() => setSelectedMedicine(null)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs">Acknowledge</button>
              </div>
           </div>
        </div>
      )}

      {!hasAcceptedDisclaimer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
             <div className="p-10 bg-amber-500 text-white text-center space-y-4"><div className="w-16 h-16 bg-white/20 rounded-[1.5rem] flex items-center justify-center mx-auto"><ShieldQuestion size={32} /></div><h2 className="text-2xl font-black uppercase tracking-tight">⚠️ AI SCREENING PROTOCOL</h2></div>
             <div className="p-10 space-y-6"><p className="text-slate-600 font-bold leading-relaxed text-center">I am an AI assistant. I can provide preliminary screening but I cannot provide a final medical diagnosis or cure. Use this report only as guidance for your doctor's visit.</p><div className="flex gap-4 pt-4">
                <button onClick={() => navigate('/')} className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-100 transition-all">Exit Assistant</button>
                <button onClick={() => setHasAcceptedDisclaimer(true)} className="flex-[2] py-4 bg-amber-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-amber-100 hover:bg-amber-600 active:scale-95 transition-all">Agree & Start</button>
             </div></div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto p-4 md:p-12 pb-32">
        <header className="mb-10 flex items-center justify-between bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4"><div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-50"><Bot size={28} /></div><div><h1 className="text-xl font-black uppercase tracking-tight text-slate-900">AI Health Assistant</h1><p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Medical Logic Core v4.2</p></div></div>
          <button onClick={() => navigate(isGuest ? '/' : '/patient/portal')} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all hover:bg-indigo-50 flex items-center gap-2 text-xs font-black uppercase tracking-widest"><ArrowLeft size={18} /> Exit</button>
        </header>

        {!aiResult ? (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="bg-indigo-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12"><Heart size={140} /></div>
              <div className="relative z-10 space-y-4">
                <h2 className="text-3xl font-black tracking-tight">Hi {auth.name.split(' ')[0]}! 👋</h2>
                <p className="text-indigo-100 font-medium text-lg leading-relaxed max-w-xl">I'm here to help you understand your symptoms. {isGuest ? 'Note: Guest sessions are temporary.' : 'Your data is saved automatically as you type.'}</p>
                {isGuest && (
                    <button 
                        onClick={() => navigate('/login/patient')}
                        className="bg-white/10 backdrop-blur-md px-6 py-2 rounded-xl border border-white/20 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-white/20"
                    >
                        <UserPlus size={14} /> Register to save history
                    </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2"><Zap size={14} className="text-amber-500" /> Quick-Start Symptoms</h3>
              <div className="flex flex-wrap gap-3">
                {COMMON_ISSUES.map(issue => (
                  <button 
                    key={issue} 
                    onClick={() => handleQuickSelect(issue)}
                    className="px-5 py-3 bg-white border-2 border-slate-100 rounded-2xl text-xs font-bold text-slate-700 hover:border-indigo-500 hover:text-indigo-600 transition-all active:scale-95 shadow-sm"
                  >
                    {issue}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden divide-y divide-slate-50">
              <div className="p-10 space-y-10">
                <div className="space-y-6">
                  <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-3"><Activity className="text-indigo-600" /> Patient Observations</h3>
                  <textarea 
                    className="w-full p-8 bg-slate-50 border-4 border-slate-100 rounded-[2rem] outline-none focus:border-indigo-500 font-bold text-lg text-slate-900 placeholder:text-slate-400 transition-all min-h-[140px] resize-none shadow-inner" 
                    placeholder="Describe your pain, fever, or any specific discomfort in detail..." 
                    value={symptoms} 
                    onChange={e => setSymptoms(e.target.value)} 
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-tight flex items-center gap-2"><Clock className="text-blue-500" /> Total Duration</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {DURATIONS.map(d => (
                        <button 
                          key={d} 
                          onClick={() => setDuration(d)}
                          className={`w-full p-4 rounded-2xl text-left text-xs font-black transition-all border-2 ${duration === d ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'}`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-tight flex items-center gap-2"><Stethoscope className="text-rose-500" /> Vital Statistics</h3>
                    <div className="bg-slate-50 p-8 rounded-[2.5rem] space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Blood Pressure (mmHg)*</label>
                        <div className="flex items-center gap-4">
                          <input 
                            type="number" placeholder="Sys"
                            className={`w-full p-4 bg-white border-2 rounded-2xl font-black text-center text-xl outline-none focus:border-indigo-500 ${(parseInt(bpSys) >= 180) ? 'border-rose-500 text-rose-600' : 'border-slate-100'}`}
                            value={bpSys} onChange={e => setBpSys(e.target.value.replace(/\D/g, ''))}
                          />
                          <span className="text-2xl font-black text-slate-300">/</span>
                          <input 
                            type="number" placeholder="Dia"
                            className={`w-full p-4 bg-white border-2 rounded-2xl font-black text-center text-xl outline-none focus:border-indigo-500 ${(parseInt(bpDia) >= 120) ? 'border-rose-500 text-rose-600' : 'border-slate-100'}`}
                            value={bpDia} onChange={e => setBpDia(e.target.value.replace(/\D/g, ''))}
                          />
                        </div>
                        {(parseInt(bpSys) >= 180 || parseInt(bpDia) >= 120) && (
                          <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest text-center animate-pulse">Critical BP Level Detected</p>
                        )}
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Severity</label>
                         <div className="flex gap-2">
                            {['mild', 'moderate', 'severe'].map((s) => (
                               <button 
                                key={s} 
                                onClick={() => setSeverity(s as any)}
                                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${severity === s ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}
                               >
                                 {s}
                               </button>
                            ))}
                         </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 pt-4">
                  <h3 className="text-sm font-black uppercase tracking-tight flex items-center gap-2"><ClipboardList className="text-indigo-600" /> Diagnostic Markers</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {SCREENING_QUESTIONS.map(q => (
                      <button 
                        key={q.id}
                        onClick={() => toggleScreening(q.id)}
                        className={`p-5 rounded-2xl text-left border-2 transition-all flex items-center justify-between group ${screeningAnswers[q.id] ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-slate-100 hover:border-slate-200'}`}
                      >
                        <span className={`text-xs font-bold ${screeningAnswers[q.id] ? 'text-emerald-700' : 'text-slate-600'}`}>{q.label}</span>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${screeningAnswers[q.id] ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 group-hover:border-slate-300'}`}>
                          {screeningAnswers[q.id] && <Check size={14} />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-10 bg-slate-50/50">
                <button 
                  onClick={runAnalysis} 
                  disabled={!symptoms.trim() || isAnalyzing} 
                  className="w-full bg-indigo-600 text-white py-6 rounded-[2rem] font-black text-xl uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-2xl shadow-indigo-100 active:scale-95"
                >
                  {isAnalyzing ? <Loader2 className="animate-spin" size={32} /> : <Zap size={32} />}
                  {isAnalyzing ? "Processing Clinical Parameters..." : "Generate Screening Report"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div id="aiResults" className="space-y-10">
            {aiResult.confidence === 100 && renderHighConfidenceResult(aiResult)}
            {aiResult.confidence >= 60 && aiResult.confidence < 100 && renderModerateConfidenceResult(aiResult)}
            {aiResult.confidence < 60 && renderLowConfidenceResult(aiResult)}
            <div className="p-6 bg-slate-100 rounded-3xl border border-slate-200 flex items-start gap-4 shadow-sm"><Info className="text-slate-400 shrink-0 mt-0.5" size={20} /><p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase">Important: This AI screening is generated for educational and preliminary purposes. It does not replace a clinical examination by a registered physician.</p></div>
            <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6"><button onClick={reset} className="px-10 py-4 bg-white border-2 border-slate-100 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all">Start New Screening</button></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIHealthAssistant;
