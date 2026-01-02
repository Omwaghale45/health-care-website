
import React, { useState } from 'react';
import { api } from '../api';
import { UserRole, UserAuth } from '../types';
import { Lock, ShieldCheck, User as UserIcon, AlertCircle } from 'lucide-react';

interface AdminLoginProps {
  onLogin: (auth: UserAuth) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const result = await api.auth.admin.login(username, password);
    if (result.user) {
      onLogin({ id: result.user._id, name: 'Medical Board Admin', role: UserRole.ADMIN });
    } else {
      setError('Invalid admin credentials. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
        <div className="p-12 space-y-10">
          <div className="text-center">
            <div className="w-20 h-20 bg-slate-900 text-teal-400 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <ShieldCheck size={40} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Verification Hub</h2>
            <p className="text-slate-500 font-medium">Internal Medical Board Access Only</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
              <input 
                type="text" placeholder="Admin Username" required
                value={username} onChange={e => setUsername(e.target.value)}
                className="w-full pl-12 pr-5 py-4 border-2 border-slate-100 rounded-2xl outline-none focus:border-slate-900 font-bold"
              />
            </div>

            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
              <input 
                type="password" placeholder="Admin Password" required
                value={password} onChange={e => setPassword(e.target.value)}
                className="w-full pl-12 pr-5 py-4 border-2 border-slate-100 rounded-2xl outline-none focus:border-slate-900 font-bold"
              />
            </div>

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-600">
                <AlertCircle size={18} className="shrink-0" />
                <p className="text-xs font-bold leading-tight uppercase tracking-widest">{error}</p>
              </div>
            )}

            <button 
              type="submit"
              className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black text-lg uppercase tracking-[0.3em] hover:bg-slate-800 transition-all shadow-xl active:scale-95"
            >
              Verify Session
            </button>
          </form>

          <div className="pt-6 border-t border-slate-100 text-center">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Authorized use only. All actions are logged.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
