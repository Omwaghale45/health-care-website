
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
  Thermometer,
  ShieldCheck,
  Share2,
  Save,
  Phone,
  AlertCircle,
  Star,
  Plus,
  Calendar,
  Building2,
  Languages,
  BadgeIndianRupee,
  ChevronRight,
  Info,
  MapPin,
  ArrowUpRight,
  FileSearch,
  ShieldQuestion,
  Check,
  X,
  Printer,
  MessageCircle,
  Mail,
  Download
} from 'lucide-react';
import { api } from '../api';
import { UserAuth, AIDiagnosis, Patient, Doctor, Medicine } from '../types';

const AIHealthAssistant: React.FC<{ auth: UserAuth }> = ({ auth }) => {
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(false);
  const [symptoms, setSymptoms] = useState('');
  const [duration, setDuration] = useState('');
  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe'>('moderate');
  const [conditions, setConditions] = useState<string[]>([]);
  const [medications, setMedications] = useState('');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIDiagnosis | null>(null);
  const [matchedDoctors, setMatchedDoctors] = useState<Doctor[]>([]);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);

  useEffect(() => {
    loadPatient();
  }, []);

  const loadPatient = async () => {
    const p = await api.patients.get(auth.id);
    setPatient(p || null);
  };

  const handleConditionToggle = (c: string) => {
    setConditions(prev => prev.includes(c) ? prev.filter(item => item !== c) : [...prev, c]);
  };

  const checkEdgeCases = (data: any): AIDiagnosis | null => {
    if (data.age && data.age < 12) {
      return {
        confidence: 0,
        diagnosis: { primary: "Pediatric Evaluation Required", differential: [] },
        analysis: "HealthDost AI is designed for adult preliminary screening. Children require high-fidelity manual examination by a qualified pediatrician.",
        prescription: { medicines: [], homeRemedies: ["Maintain hydration", "Monitor temperature"] },
        precautions: ["Do not administer OTC drugs without pediatric consent"],
        whenToSeekDoctor: ["Fever > 102°F", "Difficulty breathing", "Lethargy"],
        recommendedSpecialization: "Pediatrician",
        urgencyLevel: "urgent"
      };
    }

    if (data.existingConditions.includes('pregnant') || symptoms.toLowerCase().includes('pregnant')) {
      return {
        confidence: 0,
        diagnosis: { primary: "Maternal Health Screening Required", differential: [] },
        analysis: "Safety Protocol: Any symptoms during pregnancy require immediate verification by your obstetrician to ensure fetal safety.",
        prescription: { medicines: [], homeRemedies: ["Rest", "Fluid intake"] },
        precautions: ["Strictly avoid self-medication during pregnancy"],
        whenToSeekDoctor: ["Any vaginal bleeding", "Severe abdominal pain", "High fever"],
        recommendedSpecialization: "Gynecologist",
        urgencyLevel: "urgent"
      };
    }

    const emergencyKeywords = ['chest pain', 'can\'t breathe', 'difficulty breathing', 'bleeding heavily', 'unconscious', 'seizure'];
    if (emergencyKeywords.some(k => symptoms.toLowerCase().includes(k))) {
      return {
        confidence: 0,
        diagnosis: { primary: "Critical Clinical Emergency", differential: [] },
        analysis: "EMERGENCY: Your symptoms indicate life-threatening risk. Proceed to the nearest hospital immediately or call emergency services.",
        prescription: { medicines: [], homeRemedies: [] },
        precautions: ["DO NOT DELAY TREATMENT", "Call 108 immediately"],
        whenToSeekDoctor: ["Immediate Emergency Help Required"],
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
      const inputData = {
        age: patient?.age,
        gender: patient?.gender,
        symptoms,
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

      await api.ai.saveConsultation({
        patientId: auth.id,
        symptoms: inputData.symptoms,
        duration: inputData.duration,
        severity: inputData.severity,
        existingConditions: inputData.existingConditions,
        currentMedications: inputData.currentMedications,
        ...result
      });

      const docs = await api.doctors.list(result.recommendedSpecialization);
      setMatchedDoctors(docs.slice(0, 3));
      
    } catch (err) {
      alert("AI Diagnostics is overloaded. Please seek standard consultation.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleShare = (method: 'whatsapp' | 'email' | 'print') => {
    if (!aiResult) return;
    const text = `HealthDost AI Report for ${auth.name}: ${aiResult.diagnosis.primary}. Recommendation: ${aiResult.analysis}`;
    if (method === 'whatsapp') window.open(`whatsapp://send?text=${encodeURIComponent(text)}`);
    else if (method === 'email') window.location.href = `mailto:?subject=AI Health Report&body=${encodeURIComponent(text)}`;
    else if (method === 'print') window.print();
  };

  const quickBook = (docId: string) => {
    navigate(`/doctor/${docId}`, { state: { prefilledSymptoms: symptoms, aiAnalysis: aiResult } });
  };

  const reset = () => {
    setAiResult(null);
    setSymptoms('');
    setDuration('');
    setSeverity('moderate');
    setConditions([]);
    setMedications('');
    setMatchedDoctors([]);
  };

  const renderHighConfidenceResult = (res: AIDiagnosis) => (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-500">
      <div className="bg-emerald-600 text-white p-8 rounded-[2.5rem] flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center"><CheckCircle2 size={32} /></div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">I AM 100% SURE ABOUT THIS DIAGNOSIS</h2>
            <p className="text-xs font-bold uppercase tracking-widest opacity-80">Confidence Score: {res.confidence}%</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2"><Activity size={14} className="text-emerald-500" /> 📋 Diagnosis</h3>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
          <p className="text-3xl font-black text-slate-900 uppercase tracking-tight">{res.diagnosis.primary}</p>
          <p className="text-slate-600 font-medium italic leading-relaxed text-lg">"{res.analysis}"</p>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2"><Pill size={14} className="text-blue-500" /> 💊 Prescribed Medications</h3>
        <div className="grid gap-4">
          {res.prescription.medicines.map((m, i) => (
            <div key={i} onClick={() => setSelectedMedicine(m)} className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-50 flex flex-col md:flex-row items-center gap-8 group hover:border-emerald-200 transition-all cursor-pointer">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <p className="text-xl font-black text-slate-900 uppercase">{m.name}</p>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase rounded">OTC</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex flex-col"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Dosage</span><span className="text-xs font-bold text-slate-700">{m.dosage}</span></div>
                  <div className="flex flex-col"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Duration</span><span className="text-xs font-bold text-slate-700">{m.duration}</span></div>
                  <div className="flex flex-col"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Purpose</span><span className="text-xs font-bold text-slate-700">{m.purpose}</span></div>
                </div>
              </div>
              <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 max-w-xs w-full">
                <p className="text-[8px] font-black text-amber-600 uppercase mb-1">Warning</p>
                <p className="text-[10px] font-bold text-amber-800 leading-relaxed">{m.precautions}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2"><Heart size={14} className="text-rose-500" /> 💡 Home Care</h3>
          <div className="bg-indigo-50 border border-indigo-100 p-8 rounded-[2.5rem] space-y-4">
            {res.prescription.homeRemedies.map((h, i) => (
              <div key={i} className="flex gap-4 items-start"><div className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-2 shrink-0" /><p className="text-sm font-bold text-indigo-900 leading-relaxed">{h}</p></div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2"><AlertTriangle size={14} className="text-amber-500" /> ⚠️ Urgent Indicators</h3>
          <div className="bg-rose-50 border border-rose-100 p-8 rounded-[2.5rem] space-y-4">
            {res.whenToSeekDoctor.map((w, i) => (
              <div key={i} className="flex gap-4 items-start"><div className="w-1.5 h-1.5 bg-rose-400 rounded-full mt-2 shrink-0" /><p className="text-sm font-bold text-rose-900 leading-relaxed">{w}</p></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderModerateConfidenceResult = (res: AIDiagnosis) => (
    <div className="space-y-12 animate-in fade-in slide-in-from-right-6 duration-500">
      <div className="bg-amber-500 text-white p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-6 shadow-xl">
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shrink-0"><AlertTriangle size={36} /></div>
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight">SPECIALIST EVALUATION REQUIRED</h2>
          <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Confidence Score: {res.confidence}%</p>
          <p className="text-sm font-medium opacity-90 leading-tight">Symptoms suggest a few possibilities. I've prescribed relief medicine below, but you must see a specialist for a definitive cure.</p>
        </div>
      </div>

      {/* NEW: Medicine for Relief in Moderate Confidence */}
      <div className="space-y-6">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
          <Pill size={14} className="text-blue-500" /> 💊 Immediate Relief Medications
        </h3>
        <div className="grid gap-4">
          {res.prescription.medicines.map((m, i) => (
            <div key={i} className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-50 flex flex-col md:flex-row items-center gap-8 group hover:border-amber-200 transition-all">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <p className="text-xl font-black text-slate-900 uppercase">{m.name}</p>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-black uppercase rounded">RELIEF ONLY</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex flex-col"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Dosage</span><span className="text-xs font-bold text-slate-700">{m.dosage}</span></div>
                  <div className="flex flex-col"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Purpose</span><span className="text-xs font-bold text-slate-700">{m.purpose}</span></div>
                </div>
              </div>
              <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 max-w-xs w-full">
                <p className="text-[8px] font-black text-blue-600 uppercase mb-1">Special Instruction</p>
                <p className="text-[10px] font-bold text-blue-800 leading-relaxed">Take for temporary comfort while waiting for your specialist appointment.</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2"><Info size={14} className="text-amber-500" /> 📋 Possible Conditions</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {res.diagnosis.differential.map((d, i) => (
            <div key={i} className="bg-white p-6 rounded-[2rem] border-2 border-slate-50 relative overflow-hidden group hover:border-indigo-100 transition-colors">
              <div className="absolute top-0 left-0 h-1 bg-indigo-500" style={{ width: `${d.probability}%` }} />
              <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{d.probability}% Likelihood</p>
              <p className="text-lg font-black text-slate-900 uppercase leading-tight group-hover:text-indigo-600 transition-colors">{d.condition}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2"><Building2 size={14} className="text-teal-500" /> 🏥 Recommended Specialists</h3>
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
                    <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase"><CheckCircle2 size={12} /> AI REPORT READY</span>
                 </div>
              </div>
              <button onClick={() => quickBook(doc._id)} className="px-8 py-4 bg-teal-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-teal-100 hover:bg-teal-700 active:scale-95 transition-all">Consult Specialist</button>
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
          <h2 className="text-2xl font-black uppercase tracking-tight leading-tight">IMMEDIATE DOCTOR CONSULTATION NEEDED</h2>
          <p className="text-xs font-bold uppercase tracking-widest opacity-80 mt-2">Confidence Score: {res.confidence}%</p>
          <p className="text-lg font-bold mt-4 opacity-90">I cannot safely determine the issue. Professional evaluation is required immediately.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 pt-10">
        <button onClick={() => alert("Finding nearest hospital...")} className="bg-slate-900 text-white py-8 rounded-[3rem] font-black uppercase tracking-[0.2em] text-sm shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-4"><MapPin size={28} className="text-teal-400" /> Find Nearest Hospital</button>
        <a href="tel:108" className="bg-rose-600 text-white py-8 rounded-[3rem] font-black uppercase tracking-[0.2em] text-sm shadow-2xl hover:bg-rose-700 transition-all flex items-center justify-center gap-4 border-4 border-rose-500 animate-pulse"><Phone size={28} /> Call Emergency: 108</a>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-inter">
      {selectedMedicine && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b bg-blue-600 text-white flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-2xl"><Pill size={24} /></div>
                    <div><h3 className="text-xl font-black uppercase tracking-tight">{selectedMedicine.name}</h3><p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Drug Details</p></div>
                 </div>
                 <button onClick={() => setSelectedMedicine(null)} className="p-2 hover:bg-white/20 rounded-xl transition-colors"><X size={24} /></button>
              </div>
              <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto">
                 <div className="space-y-2"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Clinical Purpose</p><p className="font-bold text-slate-700 leading-relaxed italic">"{selectedMedicine.purpose}"</p></div>
                 <div className="space-y-4"><p className="text-[9px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1"><AlertTriangle size={10} /> Contraindications</p><div className="flex flex-wrap gap-2">{['Allergy', 'Liver issues', 'Pregnancy'].map(c => (<span key={c} className="px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black uppercase border border-rose-100">{c}</span>))}</div></div>
                 <button onClick={() => setSelectedMedicine(null)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs">Dismiss</button>
              </div>
           </div>
        </div>
      )}

      {!hasAcceptedDisclaimer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
             <div className="p-10 bg-amber-500 text-white text-center space-y-4"><div className="w-16 h-16 bg-white/20 rounded-[1.5rem] flex items-center justify-center mx-auto"><ShieldQuestion size={32} /></div><h2 className="text-2xl font-black uppercase tracking-tight">⚠️ DISCLAIMER</h2></div>
             <div className="p-10 space-y-6"><p className="text-slate-600 font-bold leading-relaxed text-center">This AI provides preliminary guidance only and is NOT a substitute for professional medical advice.</p><div className="flex gap-4 pt-4"><button onClick={() => navigate('/patient/portal')} className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-100 transition-all">Cancel</button><button onClick={() => setHasAcceptedDisclaimer(true)} className="flex-[2] py-4 bg-amber-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-amber-100 hover:bg-amber-600 active:scale-95 transition-all">I Understand</button></div></div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto p-4 md:p-12 pb-32">
        <header className="mb-10 flex items-center justify-between bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4"><div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-50"><Bot size={28} /></div><div><h1 className="text-xl font-black uppercase tracking-tight text-slate-900">AI Health Assistant</h1><p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Digital Care Unit v3.2</p></div></div>
          <button onClick={() => navigate('/patient/portal')} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all hover:bg-indigo-50 flex items-center gap-2 text-xs font-black uppercase tracking-widest"><ArrowLeft size={18} /> Back</button>
        </header>

        {!aiResult ? (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="bg-indigo-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden"><div className="absolute top-0 right-0 p-10 opacity-10 rotate-12"><Heart size={140} /></div><div className="relative z-10 space-y-4"><h2 className="text-3xl font-black tracking-tight">Hi {auth.name.split(' ')[0]}! 👋</h2><p className="text-indigo-100 font-medium text-lg leading-relaxed max-w-xl">How are you feeling? Describe your symptoms below.</p></div></div>
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden divide-y divide-slate-50"><div className="p-10 space-y-6"><h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-3"><Activity className="text-indigo-600" /> Symptoms</h3><textarea className="w-full p-8 bg-slate-50 border-4 border-slate-100 rounded-[2rem] outline-none focus:border-indigo-500 font-bold text-lg text-slate-900 placeholder:text-slate-400 transition-all min-h-[160px] resize-none" placeholder="e.g. Fever for 2 days, body ache..." value={symptoms} onChange={e => setSymptoms(e.target.value)} /></div><div className="p-10 bg-slate-50/50"><button onClick={runAnalysis} disabled={!symptoms.trim() || isAnalyzing} className="w-full bg-indigo-600 text-white py-6 rounded-[2rem] font-black text-xl uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-2xl shadow-indigo-100 active:scale-95">{isAnalyzing ? <Loader2 className="animate-spin" size={32} /> : <Zap size={32} />}{isAnalyzing ? "Analyzing..." : "Get AI Advice"}</button></div></div>
          </div>
        ) : (
          <div id="aiResults" className="space-y-10">
            {aiResult.confidence === 100 && renderHighConfidenceResult(aiResult)}
            {aiResult.confidence >= 60 && aiResult.confidence < 100 && renderModerateConfidenceResult(aiResult)}
            {aiResult.confidence < 60 && renderLowConfidenceResult(aiResult)}
            <div className="p-6 bg-slate-100 rounded-3xl border border-slate-200 flex items-start gap-4"><Info className="text-slate-400 shrink-0 mt-0.5" size={20} /><p className="text-xs font-bold text-slate-500 leading-relaxed">This report is AI-generated and requires medical verification.</p></div>
            <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6"><button onClick={reset} className="px-10 py-4 bg-white border-2 border-slate-100 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all">New Assessment</button></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIHealthAssistant;
