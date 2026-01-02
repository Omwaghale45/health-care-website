
import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ShieldCheck, UserIcon, StethoscopeIcon, ArrowRight, LayoutDashboardIcon, Activity, Globe, Lock, UserCircle } from 'lucide-react';
import { UserAuth, UserRole } from '../types';

interface HomeProps {
  auth: UserAuth | null;
  onLogin?: (auth: UserAuth) => void;
}

const Home: React.FC<HomeProps> = ({ auth, onLogin }) => {
  if (auth) {
    const target = auth.role === UserRole.AGENT ? '/dashboard' : 
                   auth.role === UserRole.PATIENT ? '/patient/portal' : 
                   auth.role === UserRole.ADMIN ? '/admin/portal' : 
                   auth.role === UserRole.GUEST ? '/patient/ai-assistant' : '/doctor/portal';
    return <Navigate to={target} replace />;
  }

  const handleGuestLogin = () => {
    if (onLogin) {
      onLogin({
        id: 'guest_' + Math.random().toString(36).substr(2, 9),
        name: 'Guest User',
        role: UserRole.GUEST
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center justify-center text-center px-4 overflow-hidden bg-slate-900">
        <div className="absolute inset-0 opacity-30">
          <img 
            src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=2000" 
            alt="Rural Healthcare" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-center z-20">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-teal-400" size={32} />
            <span className="text-white font-black text-2xl tracking-tighter uppercase">HealthDost</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login/admin" className="p-2 text-white/40 hover:text-white transition-colors" title="Admin Portal">
              <Lock size={20} />
            </Link>
          </div>
        </div>

        <div className="relative z-10 max-w-5xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-teal-400 font-black text-[10px] uppercase tracking-[0.3em] mb-8 border border-white/10">
            <Activity size={14} className="animate-pulse" /> Digital Health Kiosk v3.1
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tighter leading-[0.9]">
            QUALITY CARE <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">ANYWHERE.</span>
          </h1>
          <p className="text-xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
            Bridging the specialist gap for India's villages. AI-powered symptom analysis, real-time doctor matching, and transparent health tracking at your local kiosk.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link to="/login/agent" className="w-full sm:w-auto px-12 py-5 bg-teal-500 text-slate-900 rounded-2xl font-black text-lg uppercase tracking-widest hover:bg-teal-400 transition-all shadow-2xl shadow-teal-500/20">
              Agent Dashboard
            </Link>
            <Link to="/login/patient" className="w-full sm:w-auto px-12 py-5 bg-white text-slate-900 rounded-2xl font-black text-lg uppercase tracking-widest border border-white/20 hover:bg-slate-50 transition-all">
              Patient Portal
            </Link>
            <button 
              onClick={handleGuestLogin}
              className="w-full sm:w-auto px-12 py-5 bg-white/10 backdrop-blur-md text-white rounded-2xl font-black text-lg uppercase tracking-widest border border-white/20 hover:bg-white/20 transition-all"
            >
              Continue as Guest
            </button>
          </div>
        </div>
      </section>

      {/* Access Grid */}
      <section className="py-24 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-4">Choose Your Entry</h2>
          <div className="w-20 h-1.5 bg-teal-500 mx-auto rounded-full"></div>
        </div>

        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-10">
          {/* Guest Card */}
          <div className="bg-emerald-50 p-10 rounded-[3rem] border-2 border-transparent hover:border-emerald-500 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12">
              <UserCircle size={120} />
            </div>
            <div className="w-16 h-16 bg-white text-emerald-600 rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-emerald-100 ring-4 ring-white transition-transform group-hover:scale-110">
              <UserCircle size={32} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-4 uppercase tracking-tight">Quick Guest AI</h3>
            <p className="text-slate-500 mb-10 leading-relaxed font-medium">
              Immediate AI symptom analysis without an account. Note: History and booking require login.
            </p>
            <button 
              onClick={handleGuestLogin}
              className="inline-flex items-center gap-3 text-emerald-600 font-black uppercase tracking-widest text-sm hover:gap-5 transition-all"
            >
              Start AI Screening <ArrowRight size={20} />
            </button>
          </div>

          {/* Patient Card */}
          <div className="bg-slate-50 p-10 rounded-[3rem] border-2 border-transparent hover:border-teal-500 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12">
              <UserIcon size={120} />
            </div>
            <div className="w-16 h-16 bg-white text-teal-600 rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-teal-100 ring-4 ring-white transition-transform group-hover:scale-110">
              <UserIcon size={32} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-4 uppercase tracking-tight">Citizen Portal</h3>
            <p className="text-slate-500 mb-10 leading-relaxed font-medium">
              Securely access your medical journey, view past AI screening reports, and manage follow-up sessions.
            </p>
            <Link to="/login/patient" className="inline-flex items-center gap-3 text-teal-600 font-black uppercase tracking-widest text-sm hover:gap-5 transition-all">
              Access Health History <ArrowRight size={20} />
            </Link>
          </div>

          {/* Doctor Card */}
          <div className="bg-slate-50 p-10 rounded-[3rem] border-2 border-transparent hover:border-blue-500 transition-all group relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12">
              <StethoscopeIcon size={120} />
            </div>
            <div className="w-16 h-16 bg-white text-blue-600 rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-blue-100 ring-4 ring-white transition-transform group-hover:scale-110">
              <StethoscopeIcon size={32} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-4 uppercase tracking-tight">Physician Hub</h3>
            <p className="text-slate-500 mb-10 leading-relaxed font-medium">
              A clinical dashboard for remote specialists to review high-fidelity AI triage data and conduct consultations.
            </p>
            <div className="flex gap-4">
               <Link to="/login/doctor" className="inline-flex items-center gap-3 text-blue-600 font-black uppercase tracking-widest text-sm hover:gap-5 transition-all">
                Login <ArrowRight size={16} />
              </Link>
              <Link to="/register/doctor" className="inline-flex items-center gap-3 text-slate-400 font-black uppercase tracking-widest text-sm hover:text-blue-600 transition-all">
                Register <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Agent Card */}
          <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl transition-all group relative overflow-hidden border-2 border-slate-800 hover:border-teal-500">
             <div className="absolute top-0 right-0 p-8 opacity-10 -rotate-12">
              <LayoutDashboardIcon size={120} />
            </div>
            <div className="w-16 h-16 bg-white/10 text-teal-400 rounded-2xl flex items-center justify-center mb-8 shadow-xl ring-4 ring-white/5 transition-transform group-hover:scale-110">
              <LayoutDashboardIcon size={32} />
            </div>
            <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">Kiosk Operations</h3>
            <p className="text-slate-400 mb-10 leading-relaxed font-medium">
              Mission-critical control for local kiosk agents to register patients and run the AI diagnostic wizard.
            </p>
            <Link to="/login/agent" className="inline-flex items-center gap-3 text-teal-400 font-black uppercase tracking-widest text-sm hover:gap-5 transition-all">
              Launch Kiosk Station <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Rural Impact Stat */}
      <footer className="py-12 bg-slate-50 border-t">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-100">
               <ShieldCheck size={20} className="text-white" />
             </div>
             <p className="text-sm font-black text-slate-400 uppercase tracking-widest">HealthDost Rural Network © 2025</p>
           </div>
           <div className="flex gap-12">
             <div className="text-center">
               <p className="text-2xl font-black text-slate-900">420+</p>
               <p className="text-[10px] font-black text-slate-400 uppercase">Villages Connected</p>
             </div>
             <div className="text-center">
               <p className="text-2xl font-black text-slate-900">12k+</p>
               <p className="text-[10px] font-black text-slate-400 uppercase">Consultations</p>
             </div>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
