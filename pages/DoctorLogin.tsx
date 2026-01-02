
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { UserRole, UserAuth } from '../types';
import { LogIn, Mail, Lock, Stethoscope, AlertTriangle, UserPlus, FileSearch } from 'lucide-react';

interface DoctorLoginProps {
  onLogin: (auth: UserAuth) => void;
}

const DoctorLogin: React.FC<DoctorLoginProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const getErrorMessage = (errCode?: string) => {
    switch(errCode) {
      case 'NOT_FOUND': return 'Professional email not found in directory.';
      case 'WRONG_PASSWORD': return 'Incorrect clinical credentials.';
      case 'INACTIVE': return 'Your professional account is inactive. Please contact the Medical Board.';
      default: return 'Auth service unreachable. Check internal network.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const result = await api.auth.doctor.login(formData.email, formData.password);
      if (result.user) {
        if (result.user.verificationStatus !== 'verified') {
          // If not verified, redirect to status page
          navigate('/register/doctor/status', { state: { email: formData.email } });
          return;
        }
        onLogin({ id: result.user._id, name: result.user.fullName, role: UserRole.DOCTOR });
      } else {
        if (result.error === 'INACTIVE') {
          // Check if they are just pending
          navigate('/register/doctor/status', { state: { email: formData.email } });
        } else {
          setError(getErrorMessage(result.error));
        }
      }
    } catch (err) {
      setError('Auth service unreachable');
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-blue-100">
        <div className="p-10 space-y-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Stethoscope size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Clinical Login</h2>
            <p className="text-slate-500 text-sm">For registered medical professionals only</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
              <input 
                type="email" placeholder="Professional Email" required
                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full pl-12 pr-5 py-4 border-2 border-slate-100 rounded-xl outline-none focus:border-blue-500 font-bold"
              />
            </div>

            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
              <input 
                type="password" placeholder="Clinical Password" required
                value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full pl-12 pr-5 py-4 border-2 border-slate-100 rounded-xl outline-none focus:border-blue-500 font-bold"
              />
            </div>

            {error && (
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-3 text-amber-700">
                <AlertTriangle size={18} className="shrink-0" />
                <p className="text-xs font-bold leading-tight uppercase tracking-widest">{error}</p>
              </div>
            )}

            <button 
              type="submit"
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-95"
            >
              Access Portal
            </button>
          </form>

          <div className="grid grid-cols-2 gap-4">
             <div className="p-4 bg-slate-50 rounded-[1.5rem] text-center border-2 border-slate-100 border-dashed">
                <p className="text-[8px] text-slate-400 font-black uppercase tracking-wider mb-2">New Specialist?</p>
                <Link to="/register/doctor" className="inline-flex items-center gap-2 text-blue-600 font-black uppercase text-[10px] tracking-widest hover:underline">
                  <UserPlus size={14} /> Register
                </Link>
              </div>
              <div className="p-4 bg-slate-50 rounded-[1.5rem] text-center border-2 border-slate-100 border-dashed">
                <p className="text-[8px] text-slate-400 font-black uppercase tracking-wider mb-2">Check Progress?</p>
                <Link to="/register/doctor/status" className="inline-flex items-center gap-2 text-teal-600 font-black uppercase text-[10px] tracking-widest hover:underline">
                  <FileSearch size={14} /> View Status
                </Link>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorLogin;
