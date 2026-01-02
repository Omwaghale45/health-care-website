
import React, { useState } from 'react';
import { api } from '../api';
import { UserRole, UserAuth } from '../types';
import { Lock, User as UserIcon } from 'lucide-react';

interface AgentLoginProps {
  onLogin: (auth: UserAuth) => void;
}

const AgentLogin: React.FC<AgentLoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // result is of type AuthResult<Agent>, which contains a 'user' property if successful
    const result = await api.auth.agent.login(username, pin);
    if (result.user) {
      onLogin({ id: result.user._id, name: `Agent ${result.user.username}`, role: UserRole.AGENT });
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white p-12 rounded-[3rem] shadow-2xl w-full max-w-md border border-slate-200">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-teal-100 text-teal-600 rounded-[2rem] flex items-center justify-center mb-6 shadow-xl shadow-teal-50">
            <Lock size={40} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Agent Access</h2>
          <p className="text-slate-500 font-medium">Verify credentials for Kiosk RHK-204</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
            <input 
              type="text" placeholder="Agent ID / Username" required
              value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-12 pr-5 py-4 border-2 border-slate-100 rounded-2xl outline-none focus:border-teal-500 font-bold"
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center">4-Digit Verification PIN</label>
            <div className="flex justify-center gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="w-12 h-16 bg-slate-50 border-2 rounded-xl flex items-center justify-center">
                  {pin.length > i ? <div className="w-3 h-3 bg-teal-600 rounded-full" /> : <div className="w-3 h-3 bg-slate-200 rounded-full" />}
                </div>
              ))}
            </div>
            
            <input 
              autoFocus type="password" maxLength={4}
              value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              className="sr-only"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => pin.length < 4 && setPin(pin + num)}
                className="h-14 bg-slate-50 hover:bg-slate-100 rounded-xl font-black text-xl text-slate-700 transition-colors"
              >
                {num}
              </button>
            ))}
            <button 
              type="button" 
              onClick={() => setPin('')}
              className="col-span-2 h-14 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl font-bold transition-colors"
            >
              Clear
            </button>
          </div>

          {error && <p className="text-rose-500 text-center text-sm font-black uppercase tracking-widest">Authentication Failed</p>}
          
          <button 
            type="submit" disabled={pin.length < 4 || !username}
            className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black text-lg uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95"
          >
            Access Kiosk
          </button>
        </form>
      </div>
    </div>
  );
};

export default AgentLogin;
