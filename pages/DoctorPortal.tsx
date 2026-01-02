
import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { UserAuth, Appointment, Doctor } from '../types';
import { 
  CalendarCheck, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Info, 
  Power,
  Search,
  ChevronRight,
  MessageSquare,
  ShieldCheck,
  Clipboard,
  X,
  User as UserIcon,
  Loader2,
  TrendingUp,
  Award,
  Calendar,
  Mail,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Check
} from 'lucide-react';

const DoctorPortal: React.FC<{ auth: UserAuth }> = ({ auth }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'queue' | 'profile' | 'inbox'>('queue');
  const [selectedApp, setSelectedApp] = useState<Appointment | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const apps = await api.appointments.listForDoctor(auth.id);
    const doc = await api.doctors.get(auth.id);
    if (doc) {
      const msgs = await api.notifications.listForUser(doc.email);
      setNotifications(msgs);
    }
    setAppointments(apps);
    setDoctor(doc || null);
  };

  const calculateProfileStrength = () => {
    if (!doctor) return 0;
    let score = 70; // Default for registration
    if (doctor.profilePhoto && doctor.profilePhoto.length > 0) score += 5;
    if (doctor.bio && doctor.bio.length > 20) score += 10;
    if (doctor.areasOfExpertise && doctor.areasOfExpertise.length > 0) score += 5;
    if (doctor.verificationStatus === 'verified') score += 10;
    return Math.min(score, 100);
  };

  const toggleAvailability = async () => {
    if (!doctor) return;
    const nextState = !doctor.available;
    await api.doctors.updateProfile(auth.id, { available: nextState });
    setDoctor({ ...doctor, available: nextState });
  };

  const saveNotesAndComplete = async () => {
    if (!selectedApp) return;
    setIsUpdating(true);
    await api.appointments.updateClinicalNotes(selectedApp._id, notes);
    await api.appointments.updateStatus(selectedApp._id, 'completed');
    await loadData();
    setIsUpdating(false);
    setSelectedApp(null);
  };

  const filteredApps = appointments.filter(a => 
    a.patientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const strength = calculateProfileStrength();

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-slate-50">
      <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-blue-600 text-white rounded-3xl flex items-center justify-center shadow-xl shadow-blue-100 ring-8 ring-white overflow-hidden">
            {doctor?.avatar ? <img src={doctor.avatar} className="w-full h-full object-cover" /> : <UserIcon size={32} />}
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">{doctor?.name || auth.name}</h1>
            <p className="text-blue-600 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${doctor?.available ? 'bg-green-500' : 'bg-rose-500'}`}></span>
              {doctor?.specialization} • {doctor?.available ? 'Active Consultation' : 'On Break'}
            </p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="flex bg-white p-1 rounded-2xl border border-slate-200">
            {['queue', 'inbox', 'profile'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-6 py-2 rounded-xl font-black text-xs uppercase transition-all ${
                  activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button 
            onClick={toggleAvailability}
            className={`flex items-center gap-3 px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
              doctor?.available 
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                : 'bg-rose-50 text-rose-600 border border-rose-100'
            }`}
          >
            <Power size={18} />
            {doctor?.available ? 'Available' : 'Busy'}
          </button>
        </div>
      </header>

      {activeTab === 'queue' && (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
            {/* Status & Strength Column */}
            <div className="lg:col-span-1 space-y-6">
              {/* Verification Status Card */}
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Account Status</p>
                {doctor?.verificationStatus === 'verified' ? (
                  <div className="flex items-center gap-3 text-emerald-600">
                    <CheckCircle2 size={32} />
                    <div>
                      <p className="font-black uppercase tracking-tight text-sm">Verified Doctor</p>
                      <p className="text-[10px] font-bold text-slate-400">Board Approved</p>
                    </div>
                  </div>
                ) : doctor?.verificationStatus === 'rejected' ? (
                  <div className="flex items-center gap-3 text-rose-600">
                    <AlertTriangle size={32} />
                    <div>
                      <p className="font-black uppercase tracking-tight text-sm">Verification Failed</p>
                      <button className="text-[10px] font-bold text-blue-500 hover:underline">Click to Resubmit</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-amber-500">
                    <Clock size={32} />
                    <div>
                      <p className="font-black uppercase tracking-tight text-sm">Under Review</p>
                      <p className="text-[10px] font-bold text-slate-400">Usually takes 24-48h</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Strength Card */}
              <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Zap size={80} />
                </div>
                <div className="relative z-10">
                  <div className="flex justify-between items-end mb-4">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Profile Strength</p>
                    <span className="text-2xl font-black">{strength}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/10 rounded-full mb-6 overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${strength}%` }}></div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${strength >= 80 ? 'bg-emerald-500' : 'border border-white/20 text-white/40'}`}>
                        {strength >= 80 && <Check size={10} />}
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-widest ${strength >= 80 ? 'text-white' : 'text-white/40'}`}>Credentials Uploaded</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${doctor?.profilePhoto ? 'bg-emerald-500' : 'border border-white/20 text-white/40'}`}>
                        {doctor?.profilePhoto && <Check size={10} />}
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-widest ${doctor?.profilePhoto ? 'text-white' : 'text-white/40'}`}>Add Profile Photo (+5%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${doctor?.bio ? 'bg-emerald-500' : 'border border-white/20 text-white/40'}`}>
                        {doctor?.bio && <Check size={10} />}
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-widest ${doctor?.bio ? 'text-white' : 'text-white/40'}`}>Write Clinical Bio (+10%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* KPI Column */}
            <div className="lg:col-span-3 grid md:grid-cols-3 gap-6">
              {[
                { label: "Daily Load", val: appointments.length, icon: Users, color: "text-blue-600" },
                { label: "Waitlist", val: appointments.filter(a => a.status === 'booked').length, icon: Clock, color: "text-amber-500" },
                { label: "Finalized", val: appointments.filter(a => a.status === 'completed').length, icon: CheckCircle, color: "text-emerald-500" }
              ].map((kpi, i) => (
                <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm h-fit">
                  <div className={`p-4 rounded-2xl bg-slate-50 ${kpi.color} mb-6 inline-block`}>
                    <kpi.icon size={24} />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
                  <p className="text-4xl font-black text-slate-900">{kpi.val}</p>
                </div>
              ))}
              
              {/* Table Wrapper for remaining space */}
              <div className="md:col-span-3 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden mt-2">
                <div className="p-8 border-b bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h3 className="font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                    <CalendarCheck className="text-blue-600" /> Appointments Queue
                  </h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search patients..." 
                      className="pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b bg-white">
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient Details</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Village Unit</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Case Handling</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredApps.map(app => (
                        <tr key={app._id} className="hover:bg-blue-50/30 transition-colors group">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center font-black">
                                {app.patientName[0]}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{app.patientName}</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase">Token: #{app._id.substr(-4)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 font-bold text-slate-500 text-sm">
                            {app.appointmentTime || 'Immediate'}
                          </td>
                          <td className="px-8 py-6">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border-2 ${
                              app.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                              app.status === 'cancelled' ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                            }`}>
                              {app.status}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <button 
                              onClick={() => { setSelectedApp(app); setNotes(app.clinicalNotes || ''); }}
                              className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all"
                            >
                              {app.status === 'booked' ? 'Open Case' : 'View History'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'inbox' && (
        <div className="max-w-4xl mx-auto animate-in slide-in-from-right-8 duration-500">
          <div className="bg-white rounded-[3rem] shadow-xl overflow-hidden border border-slate-100 min-h-[600px] flex">
            {/* Sidebar list */}
            <div className="w-80 border-r flex flex-col">
              <div className="p-6 border-b bg-slate-50/50">
                <h3 className="font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <Mail className="text-blue-600" size={18} /> Clinical Inbox
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto">
                {notifications.map((msg) => (
                  <button 
                    key={msg.id}
                    onClick={() => setSelectedEmail(msg)}
                    className={`w-full p-6 text-left border-b hover:bg-blue-50 transition-colors ${selectedEmail?.id === msg.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}`}
                  >
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{new Date(msg.timestamp).toLocaleDateString()}</p>
                    <p className="font-black text-slate-900 text-xs truncate mb-1">{msg.subject}</p>
                    <p className="text-[10px] text-slate-500 truncate">HealthDost Medical Board</p>
                  </button>
                ))}
                {notifications.length === 0 && (
                  <div className="p-10 text-center text-slate-300">
                    <Mail size={32} className="mx-auto mb-2 opacity-20" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Inbox Empty</p>
                  </div>
                )}
              </div>
            </div>

            {/* Email Viewer */}
            <div className="flex-1 bg-slate-50/30 overflow-y-auto">
              {selectedEmail ? (
                <div className="p-10 animate-in fade-in duration-300">
                   <div className="mb-10 pb-6 border-b border-slate-200">
                     <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-4">Official Clinical Notice</p>
                     <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">{selectedEmail.subject}</h2>
                     <p className="text-xs text-slate-400 font-medium">From: board@healthdost.in • {new Date(selectedEmail.timestamp).toLocaleString()}</p>
                   </div>
                   <div className="bg-white rounded-3xl p-8 shadow-sm" dangerouslySetInnerHTML={{ __html: selectedEmail.body }} />
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-300">
                  <div className="text-center">
                    <Mail size={64} className="mx-auto mb-4 opacity-10" />
                    <p className="font-black text-xs uppercase tracking-widest">Select a message to view</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="max-w-3xl mx-auto bg-white rounded-[3rem] border border-slate-100 shadow-2xl p-12 animate-in zoom-in-95 duration-500">
          <div className="flex flex-col items-center text-center mb-12">
            <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-xl shadow-blue-50">
              <Award size={48} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Clinical Profile</h2>
            <p className="text-slate-500 font-medium">Manage your professional credentials and availability</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Registration Number</label>
                <div className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 font-black text-slate-700">
                  {doctor?.medicalRegistrationNumber || 'Verifying...'}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Specialization</label>
                <div className="p-4 bg-blue-50 rounded-2xl border-2 border-blue-100 font-black text-blue-700">
                  {doctor?.specialization}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Languages</label>
                <p className="font-bold text-slate-800">{doctor?.languagesSpoken.join(', ')}</p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white">
                <Calendar className="text-blue-400 mb-4" />
                <h4 className="font-black uppercase tracking-tight text-xl">Service Fees</h4>
                <p className="text-4xl font-black mb-4">₹{doctor?.fee}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Verified by HealthDost Admin</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 border-b bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-[1.5rem] flex items-center justify-center font-black text-2xl">
                  {selectedApp.patientName[0]}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{selectedApp.patientName}</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Patient Case Review • Token #{selectedApp._id.substr(-6)}</p>
                </div>
              </div>
              <button onClick={() => setSelectedApp(null)} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors">
                <X size={24} className="text-slate-400" />
              </button>
            </div>
            
            <div className="p-10 grid md:grid-cols-2 gap-12 max-h-[70vh] overflow-y-auto">
              <div className="space-y-10">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <MessageSquare size={16} className="text-blue-500" /> Intake Symptoms
                  </h4>
                  <div className="p-8 bg-blue-50 border border-blue-100 rounded-[2rem] text-slate-700 font-bold italic leading-relaxed text-lg">
                    "{selectedApp.symptoms || 'Patient did not provide a symptom summary.'}"
                  </div>
                </div>

                {/* Fix: Safely handle union type for analysis */}
                {selectedApp.analysis && (
                  <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-200 space-y-4">
                    <div className="flex items-center gap-2 text-slate-500">
                      <ShieldCheck size={20} />
                      <h4 className="text-[10px] font-black uppercase tracking-widest">Stored AI Report</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Conditions</p>
                        <div className="flex flex-wrap gap-2">
                          {/* Fix: Use ternary to handle different property names for SymptomAnalysis vs AIDiagnosis */}
                          {('possibleConditions' in selectedApp.analysis 
                            ? selectedApp.analysis.possibleConditions 
                            : [selectedApp.analysis.diagnosis.primary, ...selectedApp.analysis.diagnosis.differential.map(d => d.condition)]
                          ).map((c, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-white border rounded-md text-[10px] font-bold text-slate-700">{c}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Urgency</p>
                        <p className="text-xs font-black uppercase text-teal-600">
                          {/* Fix: Safely handle union type for urgency field */}
                          {'urgency' in selectedApp.analysis ? selectedApp.analysis.urgency : selectedApp.analysis.urgencyLevel}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">AI Recommendation</p>
                      <p className="text-sm font-medium text-slate-600 italic">
                        {/* Fix: Safely handle union type for advice/analysis string field */}
                        "{'advice' in selectedApp.analysis ? selectedApp.analysis.advice : selectedApp.analysis.analysis}"
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-8">
                <div className="flex flex-col h-full">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                     <Clipboard size={16} className="text-blue-500" /> Clinician Notes & Prescription
                  </h4>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter diagnosis, medicine advice, and follow-up instructions..."
                    className="flex-1 w-full min-h-[300px] p-8 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] outline-none focus:border-blue-500 font-bold transition-all resize-none text-slate-800 leading-relaxed"
                  />
                  
                  {selectedApp.status === 'booked' && (
                    <button 
                      onClick={saveNotesAndComplete}
                      disabled={isUpdating}
                      className="mt-8 w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black text-xl uppercase tracking-widest hover:bg-blue-700 transition-all shadow-2xl shadow-blue-100 flex items-center justify-center gap-4"
                    >
                      {isUpdating ? <Loader2 className="animate-spin" /> : <CheckCircle size={28} />}
                      Complete Consultation
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorPortal;
