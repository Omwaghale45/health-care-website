
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Award, 
  Search, 
  MoreHorizontal, 
  Clock, 
  ExternalLink, 
  Eye, 
  Download,
  Check,
  X,
  User,
  Activity,
  AlertTriangle,
  FileSearch,
  ChevronRight,
  Filter,
  Bell
} from 'lucide-react';
import { api } from '../api';
import { Doctor, VerificationStatus } from '../types';

const AdminPortal: React.FC = () => {
  const [pendingDoctors, setPendingDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionInput, setShowRejectionInput] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    setLoading(true);
    const docs = await api.admin.listPendingDoctors();
    setPendingDoctors(docs);
    setLoading(false);
  };

  const handleVerify = async (id: string, status: VerificationStatus) => {
    if (status === 'rejected' && !rejectionReason) {
      setShowRejectionInput(true);
      return;
    }
    
    await api.admin.verifyDoctor(id, status, rejectionReason);
    loadDoctors();
    setSelectedDoctor(null);
    setShowRejectionInput(false);
    setRejectionReason('');
  };

  const sendReminder = async () => {
    if (!selectedDoctor) return;
    await api.admin.sendReminder(selectedDoctor._id, ["MCI Registration Cert (Blurred)", "Medical Degree"]);
    setReminderSent(true);
    setTimeout(() => setReminderSent(false), 3000);
  };

  const filteredDocs = pendingDoctors.filter(d => 
    d.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.medicalRegistrationNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen bg-slate-50 font-inter">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Board Verification</h1>
          <p className="text-slate-500 font-medium">Verification Center for Medical Professionals</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search by Name / MCI ID..."
              className="pl-12 pr-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-slate-900 outline-none w-full md:w-80 shadow-sm transition-all font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b">
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Medical Specialist</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Registration Details</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Submission Date</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredDocs.map((doc) => (
              <tr key={doc._id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 shrink-0 overflow-hidden shadow-sm">
                      {doc.profilePhoto ? <img src={doc.profilePhoto} className="w-full h-full object-cover" /> : <User size={24} />}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 uppercase tracking-tight leading-tight">{doc.fullName}</h4>
                      <p className="text-xs font-bold text-teal-600 uppercase tracking-widest">{doc.specialization} • {doc.primaryQualification}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <p className="font-black text-slate-700 text-sm tracking-widest mb-1">{doc.medicalRegistrationNumber}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{doc.medicalCouncil}</p>
                </td>
                <td className="px-8 py-6">
                   <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{new Date(doc.createdAt).toLocaleDateString()}</p>
                </td>
                <td className="px-8 py-6">
                   <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${
                     doc.verificationStatus === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                     doc.verificationStatus === 'under_review' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                     'bg-rose-50 text-rose-600 border-rose-100'
                   }`}>
                     {doc.verificationStatus.replace('_', ' ')}
                   </span>
                </td>
                <td className="px-8 py-6 text-right">
                   <button 
                    onClick={() => setSelectedDoctor(doc)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md active:scale-95"
                   >
                     Inspect <ChevronRight size={14} />
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* INSPECTION MODAL */}
      {selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-4xl h-full bg-white shadow-[-32px_0_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col animate-in slide-in-from-right-full duration-500">
            <div className="p-10 border-b bg-slate-50 flex items-center justify-between">
               <div className="flex items-center gap-6">
                 <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center shrink-0 border border-slate-100 overflow-hidden">
                   {selectedDoctor.profilePhoto ? <img src={selectedDoctor.profilePhoto} className="w-full h-full object-cover" /> : <User size={32} className="text-slate-200" />}
                 </div>
                 <div>
                   <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{selectedDoctor.fullName}</h2>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">Credentials Hub • ID: {selectedDoctor._id}</p>
                 </div>
               </div>
               <div className="flex gap-3">
                 <button 
                    onClick={sendReminder}
                    disabled={reminderSent}
                    className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${
                      reminderSent ? 'bg-emerald-500 text-white' : 'bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100'
                    }`}
                 >
                   {reminderSent ? <Check size={14} /> : <Bell size={14} />}
                   {reminderSent ? 'Reminder Sent' : 'Send Doc Reminder'}
                 </button>
                 <button onClick={() => setSelectedDoctor(null)} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors">
                   <X size={24} className="text-slate-400" />
                 </button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-12">
               {/* Quick Info Grid */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Qualifications</p>
                    <p className="text-lg font-black text-slate-900">{selectedDoctor.primaryQualification}</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Registration</p>
                    <p className="text-lg font-black text-slate-900">{selectedDoctor.medicalRegistrationNumber}</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Experience</p>
                    <p className="text-lg font-black text-slate-900">{selectedDoctor.yearsOfExperience} Yrs</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">MCI Council</p>
                    <p className="text-lg font-black text-slate-900 truncate">{selectedDoctor.medicalCouncil}</p>
                  </div>
               </div>

               {/* Document Review Section */}
               <div className="space-y-6">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                    <FileSearch className="text-blue-600" /> Professional Documents
                  </h3>
                  <div className="grid md:grid-cols-2 gap-8">
                     {['medicalDegree', 'registrationCertificate', 'idProof'].map((docKey) => {
                       const docData = (selectedDoctor.documents as any)[docKey];
                       return (
                         <div key={docKey} className="p-8 bg-white border-2 border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center text-center group hover:border-slate-900 transition-all cursor-pointer">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm">
                               <FileText size={32} />
                            </div>
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{docKey.replace(/([A-Z])/g, ' $1')}</h4>
                            <div className="mt-6 flex gap-3">
                               <button className="p-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100"><Eye size={16} /></button>
                               <button className="p-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100"><Download size={16} /></button>
                            </div>
                         </div>
                       );
                     })}
                  </div>
               </div>
            </div>

            {/* Decision Footer */}
            <div className="p-10 border-t bg-slate-50 space-y-6">
              {showRejectionInput && (
                <div className="animate-in slide-in-from-bottom-4 duration-300">
                  <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest block mb-2">Specify Rejection Reason*</label>
                  <textarea 
                    autoFocus
                    className="w-full p-6 border-2 border-rose-100 rounded-3xl outline-none focus:border-rose-500 font-bold bg-white h-32 resize-none"
                    placeholder="e.g. Medical Registration Number is invalid, Documents are blurred..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>
              )}
              
              <div className="flex gap-4">
                {showRejectionInput ? (
                  <>
                    <button 
                      onClick={() => setShowRejectionInput(false)}
                      className="flex-1 py-5 bg-white border-2 border-slate-100 rounded-[1.5rem] font-black text-slate-500 uppercase tracking-widest text-sm"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => handleVerify(selectedDoctor._id, 'rejected')}
                      disabled={!rejectionReason}
                      className="flex-[2] py-5 bg-rose-600 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-rose-700 disabled:opacity-50 transition-all shadow-xl shadow-rose-100 flex items-center justify-center gap-3"
                    >
                      Confirm Rejection <XCircle size={20} />
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => setShowRejectionInput(true)}
                      className="flex-1 py-5 bg-white border-2 border-slate-100 text-rose-600 rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:border-rose-300 transition-all flex items-center justify-center gap-3"
                    >
                      <X size={20} /> Reject Application
                    </button>
                    <button 
                      onClick={() => handleVerify(selectedDoctor._id, 'verified')}
                      className="flex-[2] py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-2xl flex items-center justify-center gap-3"
                    >
                      <CheckCircle2 size={24} className="text-teal-400" /> Approve Credentials
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPortal;
