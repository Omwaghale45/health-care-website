
import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  FileSearch, 
  Mail, 
  Phone, 
  ArrowLeft,
  Loader2,
  FileText
} from 'lucide-react';
import { api } from '../api';
import { VerificationStatus } from '../types';

const DoctorRegistrationStatus: React.FC = () => {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [status, setStatus] = useState<VerificationStatus | 'checking'>('checking');
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  const fetchStatus = async (targetEmail: string) => {
    setStatus('checking');
    setError('');
    try {
      const result = await api.auth.doctor.getRegistrationStatus(targetEmail);
      setStatus(result.status);
      setData(result);
    } catch (err) {
      setError("Email not found in our registration records.");
      setStatus('pending');
    }
  };

  useEffect(() => {
    if (email) fetchStatus(email);
  }, []);

  const getStatusColor = () => {
    switch(status) {
      case 'verified': return 'bg-emerald-500';
      case 'rejected': return 'bg-rose-500';
      case 'under_review': return 'bg-blue-500';
      default: return 'bg-amber-500';
    }
  };

  const steps = [
    { label: 'Email Verification', status: 'completed', icon: Mail },
    { label: 'Document Integrity Check', status: status === 'pending' ? 'pending' : 'completed', icon: FileText },
    { label: 'Medical Board Review', status: ['under_review', 'verified', 'rejected'].includes(status) ? 'completed' : 'pending', icon: FileSearch },
    { label: 'Final Approval', status: status === 'verified' ? 'completed' : 'pending', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-500">
        <div className={`p-10 text-white flex items-center justify-between ${getStatusColor()}`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              {status === 'checking' ? <Loader2 className="animate-spin" /> : <ShieldCheck size={24} />}
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight">Onboarding Status</h1>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{email}</p>
            </div>
          </div>
          <Link to="/login/doctor" className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <ArrowLeft size={20} />
          </Link>
        </div>

        <div className="p-10 space-y-10">
          {!email ? (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-sm font-bold text-slate-500 mb-6">Enter your registered professional email to check your verification progress.</p>
                <input 
                  type="email" 
                  placeholder="doctor@hospital.com"
                  className="w-full px-6 py-4 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold mb-4"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
                <button 
                  onClick={() => fetchStatus(email)}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl"
                >
                  Verify Status
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center text-center">
                <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6 shadow-xl ${getStatusColor()}`}>
                   {status === 'verified' ? <CheckCircle2 size={40} className="text-white" /> : 
                    status === 'rejected' ? <AlertCircle size={40} className="text-white" /> : <Clock size={40} className="text-white" />}
                </div>
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
                  {status === 'verified' ? 'Credentials Verified!' : 
                   status === 'rejected' ? 'Application Rejected' : 
                   status === 'under_review' ? 'Manual Review in Progress' : 'Pending Initial Verification'}
                </h2>
                <p className="text-slate-500 font-medium max-w-sm mt-2 leading-relaxed">
                  {status === 'verified' ? 'You can now log in to your clinical portal and start taking patients.' : 
                   status === 'rejected' ? `Our board found issues with your application: ${data?.rejectionReason || 'Documents unclear.'}` : 
                   'Our medical board is currently reviewing your medical degree and registration details.'}
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Onboarding Roadmap</h4>
                <div className="bg-slate-50 rounded-[2rem] border border-slate-100 divide-y divide-slate-100 overflow-hidden">
                  {steps.map((step, i) => (
                    <div key={i} className="p-5 flex items-center justify-between group hover:bg-white transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-xl ${step.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                          <step.icon size={18} />
                        </div>
                        <span className={`text-xs font-black uppercase tracking-tight ${step.status === 'completed' ? 'text-slate-900' : 'text-slate-400'}`}>{step.label}</span>
                      </div>
                      {step.status === 'completed' ? (
                        <CheckCircle2 size={18} className="text-emerald-500" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-slate-200" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {status === 'verified' && (
                <Link to="/login/doctor" className="block w-full bg-emerald-600 text-white py-5 rounded-[1.5rem] font-black text-center uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-100">
                  Access Portal
                </Link>
              )}
            </>
          )}
          
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-600">
              <AlertCircle size={18} className="shrink-0" />
              <p className="text-xs font-black leading-tight uppercase tracking-widest">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorRegistrationStatus;
