
import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { UserAuth, Appointment, Patient, AIConsultation, Doctor, AIDiagnosis } from '../types';
import { 
  Calendar, 
  History, 
  Stethoscope, 
  ShieldCheck, 
  User, 
  ArrowRight,
  ClipboardList,
  AlertCircle,
  ChevronRight,
  MapPin,
  Phone,
  Droplets,
  Settings,
  Lock,
  Bot,
  Activity,
  Zap,
  ArrowUpRight,
  Download,
  ShieldAlert,
  Clock,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Map as MapIcon,
  Info,
  Pill,
  Heart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

declare var google: any;

const PatientPortal: React.FC<{ auth: UserAuth }> = ({ auth }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [aiConsultations, setAiConsultations] = useState<AIConsultation[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [nearbyDoctors, setNearbyDoctors] = useState<Doctor[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'profile' | 'emergency'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Patient>>({});
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  
  // Emergency Workflow States
  const [emergencySymptoms, setEmergencySymptoms] = useState('');
  const [isAnalyzingEmergency, setIsAnalyzingEmergency] = useState(false);
  const [emergencyAiResult, setEmergencyAiResult] = useState<AIDiagnosis | null>(null);
  
  // Feedback states
  const [activeFeedbackId, setActiveFeedbackId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'emergency' && !googleMapRef.current) {
      initMap();
    }
  }, [activeTab]);

  const loadData = async () => {
    const apps = await api.appointments.listForPatient(auth.id);
    const aiCons = await api.ai.listForPatient(auth.id);
    const p = await api.patients.get(auth.id);
    
    setAppointments(apps);
    setAiConsultations(aiCons);
    setPatient(p || null);
    if (p) setEditData(p);

    setIsLoadingNearby(true);
    const docs = await api.doctors.list('All');
    setNearbyDoctors(docs.slice(0, 3));
    setIsLoadingNearby(false);
  };

  const handleFeedback = async (id: string, helpful: boolean) => {
    await api.ai.submitFeedback(id, helpful, feedbackText);
    setActiveFeedbackId(null);
    setFeedbackText('');
    loadData();
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.patients.updateProfile(auth.id, editData);
    setIsEditing(false);
    loadData();
  };

  const runEmergencyTriage = async () => {
    if (!emergencySymptoms.trim()) return;
    setIsAnalyzingEmergency(true);
    try {
      const result = await api.ai.selfDiagnose({
        age: patient?.age || 30,
        gender: patient?.gender || 'male',
        symptoms: `EMERGENCY: ${emergencySymptoms}`,
        duration: 'Less than 1 hour',
        severity: 'severe',
        existingConditions: [],
        currentMedications: 'None'
      });
      setEmergencyAiResult(result);
    } catch (err) {
      alert("AI triage overloaded. Proceeding to direct doctor alert.");
    } finally {
      setIsAnalyzingEmergency(false);
    }
  };

  const initMap = () => {
    if (!mapRef.current) return;
    
    const center = { lat: 28.6139, lng: 77.2090 };
    const map = new google.maps.Map(mapRef.current, {
      center: center,
      zoom: 12,
      styles: [
        { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] }
      ]
    });
    googleMapRef.current = map;

    nearbyDoctors.forEach(doc => {
      if (doc.location) {
        const marker = new google.maps.Marker({
          position: doc.location,
          map: map,
          title: doc.name,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
            scaledSize: new google.maps.Size(40, 40)
          }
        });
        
        const infoWindow = new google.maps.InfoWindow({
          content: `<div style="padding:10px;">
                      <h4 style="font-weight:900; margin:0;">${doc.name}</h4>
                      <p style="font-size:10px; color:#666; margin:4px 0;">${doc.specialization}</p>
                      <button id="book-${doc._id}" style="background:#0d9488; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:10px; cursor:pointer;">Alert Specialist</button>
                    </div>`
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });

        markersRef.current.push(marker);
      }
    });
  };

  const triggerEmergency = async () => {
    if (nearbyDoctors.length === 0) return;
    const closest = nearbyDoctors[0];
    
    setIsLoadingNearby(true);
    try {
      await api.appointments.book({
        patientId: auth.id,
        patientName: auth.name,
        doctorId: closest._id,
        doctorName: closest.name,
        appointmentTime: 'IMMEDIATE EMERGENCY',
        paymentMethod: 'cash',
        amount: closest.fee,
        symptoms: emergencySymptoms || 'EMERGENCY TRIGGER: SEVERE DISTRESS',
        analysis: emergencyAiResult || undefined,
        isPriorityEmergency: true
      });
      alert(`🚨 RED ALERT ACTIVATED. Dr. ${closest.name} has received your full AI Triage report. Please proceed to the clinic or await contact.`);
      setEmergencyAiResult(null);
      setEmergencySymptoms('');
      setActiveTab('overview');
    } catch (e) {
      alert("Emergency alert system down. Call 108 immediately.");
    } finally {
      setIsLoadingNearby(false);
    }
  };

  const unifiedHistory = [
    ...appointments.map(a => ({ type: 'APPOINTMENT' as const, date: new Date(a.createdAt), data: a })),
    ...aiConsultations.map(c => ({ type: 'AI_ASSESSMENT' as const, date: new Date(c.createdAt), data: c }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-teal-600 text-white rounded-3xl flex items-center justify-center shadow-xl shadow-teal-100 ring-8 ring-white">
              <User size={32} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Citizen ID: {auth.id}</p>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">{patient?.name || auth.name}</h1>
            </div>
          </div>
          <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto scrollbar-hide">
            {['overview', 'history', 'profile', 'emergency'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeTab === tab 
                    ? (tab === 'emergency' ? 'bg-rose-600 text-white shadow-lg shadow-rose-100' : 'bg-teal-600 text-white shadow-lg shadow-teal-100') 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab === 'emergency' ? '🚨 Emergency' : tab}
              </button>
            ))}
          </div>
        </header>

        {activeTab === 'overview' && (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="mb-10 bg-rose-50 border-4 border-rose-100 p-8 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-rose-50">
               <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-rose-600 text-white rounded-[1.5rem] flex items-center justify-center animate-pulse shadow-xl shadow-rose-200">
                    <AlertTriangle size={36} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-rose-900 uppercase tracking-tight">Need Urgent Help?</h2>
                    <p className="text-rose-700 font-bold text-sm">Describe symptoms to AI for immediate aid and alert specialists.</p>
                  </div>
               </div>
               <button 
                onClick={() => setActiveTab('emergency')}
                className="px-10 py-5 bg-rose-600 text-white rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-rose-700 transition-all shadow-xl active:scale-95 border-b-4 border-rose-800"
               >
                 Launch Emergency Hub
               </button>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl inline-block mb-4">
                    <History size={24} />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Health Records</p>
                  <p className="text-4xl font-black text-slate-900">{unifiedHistory.length}</p>
                </div>
                <button onClick={() => setActiveTab('history')} className="mt-6 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-2">View Timeline <ChevronRight size={12} /></button>
              </div>

              <div className="bg-gradient-to-br from-indigo-900 to-indigo-700 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group cursor-pointer" onClick={() => navigate('/patient/ai-assistant')}>
                <div className="absolute top-0 right-0 p-6 opacity-10 -rotate-12 transition-transform group-hover:scale-110 group-hover:rotate-0"><Bot size={120} /></div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6"><Zap className="text-indigo-300 animate-pulse" size={24} /></div>
                    <h3 className="text-2xl font-black uppercase tracking-tight leading-tight">AI Health Assistant</h3>
                    <p className="text-indigo-200 text-xs font-medium mt-2 leading-relaxed">AI screening with proximity logic.</p>
                  </div>
                  <div className="mt-8 flex items-center gap-3 font-black uppercase tracking-widest text-[10px]">Launch Station <ArrowUpRight size={16} /></div>
                </div>
              </div>

              <div className="bg-teal-600 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-teal-100 flex flex-col justify-between group cursor-pointer" onClick={() => navigate('/doctors')}>
                <div>
                  <div className="p-3 bg-white/10 rounded-2xl inline-block mb-4"><Stethoscope size={24} /></div>
                  <h3 className="text-2xl font-black uppercase tracking-tight leading-tight">Consult Physician</h3>
                </div>
                <div className="mt-8 flex items-center gap-2 font-black uppercase tracking-widest text-[10px] text-teal-100">Find Specialists <ArrowRight size={16} /></div>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-6">
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                  <ClipboardList className="text-teal-600" /> Nearby Specialists (AI Ranked)
                </h2>
                <div className="space-y-4">
                  {nearbyDoctors.map((doc) => (
                    <div key={doc._id} className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm flex items-center justify-between group hover:border-teal-500 transition-all">
                      <div className="flex items-center gap-5">
                        <img src={doc.avatar} className="w-14 h-14 rounded-2xl object-cover shadow-lg" />
                        <div>
                          <p className="font-black text-slate-900 uppercase tracking-tight">{doc.name}</p>
                          <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">{doc.specialization} • 2.4 KM AWAY</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => navigate(`/doctor/${doc._id}`)}
                        className="p-3 bg-slate-50 rounded-xl text-slate-400 group-hover:bg-teal-600 group-hover:text-white transition-all"
                      >
                        <ArrowUpRight size={20} />
                      </button>
                    </div>
                  ))}
                  {isLoadingNearby && <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-teal-600" /></div>}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-6">Live Kiosk Stats</h2>
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 space-y-4 shadow-sm">
                   <div className="p-5 bg-teal-50 rounded-3xl border border-teal-100">
                    <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-1">Clinic Status</p>
                    <p className="text-xs font-bold text-teal-800 leading-relaxed">Village Health Center is <strong>OPEN</strong>. 4 Patients in queue.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-6 duration-500 pb-20">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                <History className="text-teal-600" /> Clinical Timeline
              </h2>
              <button onClick={loadData} className="p-2 text-slate-400 hover:text-teal-600 transition-colors">
                <Activity size={20} />
              </button>
            </div>
            
            {unifiedHistory.length === 0 ? (
              <div className="py-24 text-center bg-white rounded-[3rem] border-4 border-dashed border-slate-100 flex flex-col items-center">
                 <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6">
                    <ClipboardList size={40} />
                 </div>
                 <p className="text-slate-500 font-bold text-lg">No health records yet.</p>
                 <p className="text-slate-400 text-sm mt-1">Your AI assessments and doctor visits will appear here.</p>
              </div>
            ) : (
              unifiedHistory.map((item, idx) => (
                <div key={idx} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
                  <div className="p-6 border-b flex flex-col md:flex-row md:items-center justify-between bg-slate-50/50 gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`px-4 py-1.5 rounded-full font-mono font-bold text-[10px] tracking-widest text-white ${item.type === 'AI_ASSESSMENT' ? 'bg-indigo-600' : 'bg-slate-900'}`}>
                        {item.type === 'AI_ASSESSMENT' ? 'AI_ENGINE_LOG' : 'PHYSICIAN_VISIT'}
                      </div>
                      <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1">
                        <Clock size={12} /> {item.date.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-8 grid lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-6">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${item.type === 'AI_ASSESSMENT' ? 'bg-indigo-50 text-indigo-600' : 'bg-teal-50 text-teal-600'}`}>
                          {item.type === 'AI_ASSESSMENT' ? <Bot size={24} /> : <Stethoscope size={24} />}
                        </div>
                        <div>
                          <p className={`text-xl font-black uppercase tracking-tight ${item.type === 'AI_ASSESSMENT' ? 'text-indigo-900' : 'text-slate-900'}`}>
                            {item.type === 'AI_ASSESSMENT' ? (item.data as AIConsultation).diagnosis.primary : (item.data as Appointment).doctorName}
                          </p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                            {item.type === 'AI_ASSESSMENT' ? 'Systematic Symptom Analysis' : `Consulation Fee Paid: ₹${(item.data as Appointment).amount}`}
                          </p>
                        </div>
                      </div>
                      
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Patient Input</p>
                        <p className="text-slate-700 font-bold italic leading-relaxed">"{(item.data as any).symptoms || 'General wellness check'}"</p>
                      </div>

                      {item.type === 'APPOINTMENT' && (item.data as Appointment).clinicalNotes && (
                        <div className="p-6 bg-teal-50/50 rounded-2xl border border-teal-100">
                           <p className="text-[9px] font-black text-teal-600 uppercase tracking-widest mb-2">Physician's Summary</p>
                           <p className="text-teal-900 font-bold text-sm leading-relaxed">{(item.data as Appointment).clinicalNotes}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 flex flex-col justify-between">
                       <div className="space-y-4">
                          <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                             <ShieldCheck size={14} /> Diagnostic Meta
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                             <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Confidence</p>
                                <p className={`text-xs font-black uppercase ${(item.data as any).confidence >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>{(item.data as any).confidence || 100}% Accurate</p>
                             </div>
                          </div>
                       </div>

                       {item.type === 'AI_ASSESSMENT' && (item.data as AIConsultation).wasHelpful === undefined && (
                         <div className="mt-8">
                            {activeFeedbackId === (item.data as AIConsultation)._id ? (
                               <div className="bg-white p-4 rounded-2xl border-2 border-indigo-100 space-y-3 animate-in zoom-in-95 duration-200">
                                  <p className="text-[10px] font-black text-indigo-600 uppercase">Helpfulness Survey</p>
                                  <textarea className="w-full p-2 border rounded-lg text-xs font-medium h-16 outline-none focus:border-indigo-500" placeholder="Notes for board..." value={feedbackText} onChange={e => setFeedbackText(e.target.value)} />
                                  <div className="flex gap-2">
                                     <button onClick={() => handleFeedback((item.data as AIConsultation)._id, true)} className="flex-1 py-1.5 bg-emerald-500 text-white rounded-lg text-[10px] font-black flex items-center justify-center gap-1"><ThumbsUp size={12} /> Yes</button>
                                     <button onClick={() => handleFeedback((item.data as AIConsultation)._id, false)} className="flex-1 py-1.5 bg-rose-500 text-white rounded-lg text-[10px] font-black flex items-center justify-center gap-1"><ThumbsDown size={12} /> No</button>
                                  </div>
                               </div>
                            ) : (
                               <button 
                                onClick={() => setActiveFeedbackId((item.data as AIConsultation)._id)}
                                className="w-full py-3 bg-white border border-indigo-100 rounded-xl font-black uppercase text-[10px] text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2"
                               >
                                  <MessageCircle size={14} /> Submit Accuracy Review
                               </button>
                            )}
                         </div>
                       )}
                       
                       <button className="w-full mt-4 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                          <Download size={14} /> Export Report
                       </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'profile' && patient && (
          <div className="max-w-3xl mx-auto animate-in zoom-in-95 duration-500">
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden">
               <div className="p-10 border-b bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-50">
                        <Settings size={24} />
                     </div>
                     <div>
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Citizen Profile</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Medical Board ID • v4.0</p>
                     </div>
                  </div>
                  <button 
                    onClick={() => setIsEditing(!isEditing)} 
                    className={`px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${isEditing ? 'bg-rose-50 text-rose-600' : 'bg-teal-50 text-teal-600 hover:bg-teal-100'}`}
                  >
                    {isEditing ? 'Cancel' : 'Update Profile'}
                  </button>
               </div>

               <div className="p-10 space-y-12">
                  <form onSubmit={handleUpdateProfile} className="space-y-10">
                     <div className="grid md:grid-cols-2 gap-10">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Full Legal Name</label>
                           {isEditing ? (
                             <input className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-bold text-slate-900 outline-none focus:border-teal-500" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} />
                           ) : (
                             <div className="p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black text-lg text-slate-900">{patient.name}</div>
                           )}
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Kiosk Primary Phone</label>
                           <div className="p-4 bg-slate-100/50 border-2 border-transparent rounded-2xl font-black text-lg text-slate-400 flex items-center justify-between">
                              {patient.phone}
                              <Lock size={16} className="opacity-30" />
                           </div>
                        </div>
                     </div>

                     {isEditing && (
                        <div className="pt-6 animate-in slide-in-from-top-4 duration-300">
                           <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black uppercase text-sm tracking-widest shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-95">
                              <CheckCircle2 size={24} className="text-teal-400" /> Save Profile Updates
                           </button>
                        </div>
                     )}
                  </form>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'emergency' && (
          <div className="animate-in fade-in zoom-in-95 duration-500 space-y-10 pb-20">
             <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden">
                <div className="p-10 bg-rose-600 text-white flex items-center justify-between">
                   <div className="flex items-center gap-5">
                      <div className="p-3 bg-white/20 rounded-2xl"><ShieldAlert size={32} /></div>
                      <div>
                        <h2 className="text-3xl font-black uppercase tracking-tight">Emergency Intake</h2>
                        <p className="text-xs font-bold uppercase tracking-widest opacity-80">Priority Diagnostic Triage v4.1</p>
                      </div>
                   </div>
                   <div className="text-right hidden md:block">
                      <p className="text-[10px] font-black uppercase tracking-widest">Protocol Version</p>
                      <p className="text-xl font-black">R-EMG v2.0</p>
                   </div>
                </div>
                
                <div className="p-10 space-y-12">
                   {!emergencyAiResult ? (
                     <div className="space-y-8 animate-in slide-in-from-bottom-6">
                        <div className="bg-rose-50 p-8 rounded-[2rem] border-2 border-rose-100 flex items-start gap-6">
                           <div className="w-12 h-12 bg-rose-600 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-rose-200"><MessageCircle size={24} /></div>
                           <div className="space-y-4 w-full">
                              <h3 className="text-xl font-black text-rose-900 uppercase tracking-tight">Step 1: Describe the Emergency</h3>
                              <p className="text-sm font-bold text-rose-700 leading-relaxed">Tell the AI exactly what is happening. Describe any pain location, consciousness levels, or breathing issues.</p>
                              <textarea 
                                className="w-full p-6 bg-white border-2 border-rose-100 rounded-3xl outline-none focus:border-rose-500 font-bold text-slate-900 transition-all min-h-[160px] resize-none text-lg shadow-inner"
                                placeholder="Describe current emergency symptoms..."
                                value={emergencySymptoms}
                                onChange={e => setEmergencySymptoms(e.target.value)}
                              />
                              <button 
                                onClick={runEmergencyTriage}
                                disabled={isAnalyzingEmergency || !emergencySymptoms.trim()}
                                className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                              >
                                 {isAnalyzingEmergency ? <Loader2 className="animate-spin" /> : <Bot size={24} />}
                                 {isAnalyzingEmergency ? "AI Configuring Triage..." : "Configure Emergency & Prescribe Aid"}
                              </button>
                           </div>
                        </div>
                     </div>
                   ) : (
                     <div className="space-y-10 animate-in fade-in zoom-in-95">
                        <div className="bg-emerald-600 text-white p-8 rounded-[2.5rem] shadow-xl">
                           <div className="flex items-center gap-4 mb-6">
                              <Bot className="text-emerald-300" size={32} />
                              <h3 className="text-xl font-black uppercase tracking-tight">AI Diagnostic Configuration</h3>
                           </div>
                           <div className="grid md:grid-cols-2 gap-8">
                              <div className="bg-white/10 p-6 rounded-3xl border border-white/10 backdrop-blur-md">
                                 <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-emerald-100">Primary Configuration</p>
                                 <p className="text-2xl font-black leading-tight uppercase">{emergencyAiResult.diagnosis.primary}</p>
                              </div>
                              <div className="bg-white/10 p-6 rounded-3xl border border-white/10 backdrop-blur-md">
                                 <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-emerald-100">Urgency Level</p>
                                 <p className="text-2xl font-black leading-tight uppercase text-rose-200 flex items-center gap-2">
                                    <ShieldAlert size={24} /> {emergencyAiResult.urgencyLevel}
                                 </p>
                              </div>
                           </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                           <div className="space-y-4">
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                                 <Pill className="text-emerald-500" size={16} /> Immediate First-Aid Prescription
                              </h4>
                              <div className="bg-white p-8 rounded-[2.5rem] border-2 border-emerald-50 space-y-4">
                                 {emergencyAiResult.prescription.medicines.length > 0 ? (
                                    emergencyAiResult.prescription.medicines.map((m, i) => (
                                       <div key={i} className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                          <p className="font-black text-emerald-900 text-lg uppercase">{m.name}</p>
                                          <p className="text-xs font-bold text-emerald-700">{m.dosage} • {m.purpose}</p>
                                          <p className="text-[10px] text-rose-600 font-bold mt-2 uppercase tracking-tighter">⚠️ {m.precautions}</p>
                                       </div>
                                    ))
                                 ) : (
                                    <p className="text-slate-400 font-bold italic">No oral medication advised. Await physical exam.</p>
                                 )}
                              </div>
                           </div>

                           <div className="space-y-4">
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                                 <Heart className="text-rose-500" size={16} /> Life Saving Protocol
                              </h4>
                              <div className="bg-rose-50 border border-rose-100 p-8 rounded-[2.5rem] space-y-4">
                                 {emergencyAiResult.prescription.homeRemedies.map((r, i) => (
                                    <div key={i} className="flex gap-3 items-start">
                                       <div className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-2 shrink-0" />
                                       <p className="text-sm font-bold text-rose-900 leading-tight uppercase">{r}</p>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        </div>

                        <div className="pt-6 border-t flex flex-col md:flex-row gap-4">
                           <button 
                             onClick={() => setEmergencyAiResult(null)}
                             className="flex-1 py-5 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-100 transition-all"
                           >
                              Retake Symptoms
                           </button>
                           <button 
                             onClick={triggerEmergency}
                             disabled={isLoadingNearby}
                             className="flex-[2] bg-rose-600 text-white py-6 rounded-[2rem] font-black uppercase text-lg tracking-[0.2em] shadow-2xl shadow-rose-200 hover:bg-rose-700 active:scale-95 transition-all flex items-center justify-center gap-4"
                           >
                              {isLoadingNearby ? <Loader2 className="animate-spin" /> : <ShieldAlert size={28} />}
                              Alert Specialist Station
                           </button>
                        </div>
                     </div>
                   )}

                   <div className="grid md:grid-cols-2 gap-10 pt-10 border-t border-slate-100">
                      <div className="space-y-6">
                         <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2"><MapIcon className="text-teal-600" /> Specialist Map</h3>
                         <div className="map-container border-4 border-slate-100" ref={mapRef}></div>
                      </div>

                      <div className="space-y-8">
                         <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 text-center">Patient Resource Access</h4>
                            <div className="grid grid-cols-2 gap-4">
                               <a href="tel:108" className="p-8 bg-slate-900 text-white rounded-[2rem] flex flex-col items-center justify-center gap-3 text-center group hover:bg-slate-800 transition-all shadow-xl">
                                  <Phone size={32} className="text-teal-400" />
                                  <span className="font-black uppercase tracking-widest text-[10px]">Call 108</span>
                               </a>
                               <button onClick={() => window.open('https://maps.google.com/?q=hospital+near+me')} className="p-8 bg-white border-2 border-slate-100 rounded-[2rem] flex flex-col items-center justify-center gap-3 text-center group hover:border-teal-500 transition-all shadow-md">
                                  <MapPin size={32} className="text-rose-500" />
                                  <span className="font-black uppercase tracking-widest text-[10px] text-slate-900">Hospital Routing</span>
                               </button>
                            </div>
                         </div>
                         
                         <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl flex items-start gap-4">
                            <Info className="text-blue-500 shrink-0 mt-1" size={20} />
                            <p className="text-[10px] font-bold text-blue-800 leading-relaxed uppercase"> Specialists shown on map are active. "Trigger Alert" will send your AI configuration, symptoms, and prescribed aid directly to the selected doctor for pre-readiness.</p>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientPortal;
