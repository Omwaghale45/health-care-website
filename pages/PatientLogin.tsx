
import React, { useState } from 'react';
import { api } from '../api';
import { UserRole, UserAuth } from '../types';
import { UserPlus, LogIn, Phone, Lock, UserCircle, AlertCircle } from 'lucide-react';

interface PatientLoginProps {
  onLogin: (auth: UserAuth) => void;
}

const PatientLogin: React.FC<PatientLoginProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    age: '',
    gender: 'male',
    village: '',
    password: ''
  });

  const getErrorMessage = (errCode?: string) => {
    switch(errCode) {
      case 'NOT_FOUND': return 'Phone number not registered. Please sign up below.';
      case 'WRONG_PASSWORD': return 'Incorrect password. Try again or reset it.';
      case 'INACTIVE': return 'Account is inactive. Please contact helpdesk support.';
      default: return 'Authentication failed. Please check your connection.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isLogin) {
        const result = await api.auth.patient.login(formData.phone, formData.password);
        if (result.user) {
          onLogin({ id: result.user._id, name: result.user.name, role: UserRole.PATIENT });
        } else {
          setError(getErrorMessage(result.error));
        }
      } else {
        const patient = await api.auth.patient.register({
          ...formData,
          age: Number(formData.age),
          symptoms: 'None'
        });
        onLogin({ id: patient._id, name: patient.name, role: UserRole.PATIENT });
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-teal-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-teal-100">
        <div className="flex bg-slate-50 border-b">
          <button 
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 py-5 font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isLogin ? 'bg-white text-teal-600 border-b-4 border-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <LogIn size={18} /> Login
          </button>
          <button 
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 py-5 font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${!isLogin ? 'bg-white text-teal-600 border-b-4 border-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <UserPlus size={18} /> Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-6">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserCircle size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
              {isLogin ? 'Patient Login' : 'Create Patient Account'}
            </h2>
            <p className="text-slate-500 text-sm">Access your healthcare history</p>
          </div>

          {!isLogin && (
            <div className="space-y-4">
              <input 
                type="text" placeholder="Full Name" required
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full px-5 py-3 border-2 border-slate-100 rounded-xl outline-none focus:border-teal-500 font-bold"
              />
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="number" placeholder="Age" required
                  value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})}
                  className="px-5 py-3 border-2 border-slate-100 rounded-xl outline-none focus:border-teal-500 font-bold"
                />
                <select 
                  value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}
                  className="px-5 py-3 border-2 border-slate-100 rounded-xl outline-none focus:border-teal-500 font-bold bg-white"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <input 
                type="text" placeholder="Village Name" required
                value={formData.village} onChange={e => setFormData({...formData, village: e.target.value})}
                className="w-full px-5 py-3 border-2 border-slate-100 rounded-xl outline-none focus:border-teal-500 font-bold"
              />
            </div>
          )}

          <div className="relative">
            <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
            <input 
              type="tel" placeholder="10-digit Phone Number" required
              value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
              className="w-full pl-12 pr-5 py-3 border-2 border-slate-100 rounded-xl outline-none focus:border-teal-500 font-bold"
            />
          </div>

          <div className="relative">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
            <input 
              type="password" placeholder="Password" required
              value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
              className="w-full pl-12 pr-5 py-3 border-2 border-slate-100 rounded-xl outline-none focus:border-teal-500 font-bold"
            />
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-600">
              <AlertCircle size={18} className="shrink-0" />
              <p className="text-xs font-bold leading-tight">{error}</p>
            </div>
          )}

          <button 
            type="submit"
            className="w-full bg-teal-600 text-white py-4 rounded-2xl font-black text-lg uppercase tracking-widest hover:bg-teal-700 transition-all shadow-xl shadow-teal-100 active:scale-95"
          >
            {isLogin ? 'Sign In' : 'Register Now'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PatientLogin;
