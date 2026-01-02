
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Doctors from './pages/Doctors';
import DoctorProfile from './pages/DoctorProfile';
import Appointments from './pages/Appointments';
import PatientLogin from './pages/PatientLogin';
import DoctorLogin from './pages/DoctorLogin';
import AgentLogin from './pages/AgentLogin';
import AdminLogin from './pages/AdminLogin';
import AdminPortal from './pages/AdminPortal';
import PatientPortal from './pages/PatientPortal';
import AIHealthAssistant from './pages/AIHealthAssistant';
import DoctorPortal from './pages/DoctorPortal';
import DoctorRegister from './pages/DoctorRegister';
import DoctorRegistrationStatus from './pages/DoctorRegistrationStatus';
import { 
  HomeIcon, 
  LayoutDashboardIcon, 
  UsersIcon, 
  CalendarIcon, 
  LogOutIcon,
  ShieldCheckIcon,
  UserIcon,
  Activity,
  AlertCircle,
  Clock,
  ShieldCheck,
  Bot
} from 'lucide-react';
import { UserRole, UserAuth } from './types';

// Role-based Route Guard
const ProtectedRoute = ({ 
  auth, 
  allowedRole, 
  children 
}: { 
  auth: UserAuth | null, 
  allowedRole: UserRole, 
  children: React.ReactNode 
}) => {
  if (!auth) return <Navigate to="/" replace />;
  if (auth.role !== allowedRole) {
    const target = auth.role === UserRole.AGENT ? '/dashboard' : 
                   auth.role === UserRole.PATIENT ? '/patient/portal' : 
                   auth.role === UserRole.ADMIN ? '/admin/portal' : '/doctor/portal';
    return <Navigate to={target} replace />;
  }
  return <>{children}</>;
};

// Guard for login pages
const PublicRoute = ({ auth, children }: { auth: UserAuth | null, children: React.ReactNode }) => {
  if (auth) {
    const target = auth.role === UserRole.AGENT ? '/dashboard' : 
                   auth.role === UserRole.PATIENT ? '/patient/portal' : 
                   auth.role === UserRole.ADMIN ? '/admin/portal' : '/doctor/portal';
    return <Navigate to={target} replace />;
  }
  return <>{children}</>;
};

const Sidebar = ({ auth, onLogout }: { auth: UserAuth, onLogout: () => void }) => {
  const location = useLocation();
  
  const getNavItems = () => {
    switch(auth.role) {
      case UserRole.AGENT:
        return [
          { path: '/dashboard', label: 'Visit Wizard', icon: LayoutDashboardIcon },
          { path: '/doctors', label: 'Doctors', icon: UsersIcon },
          { path: '/appointments', label: 'Today\'s Queue', icon: CalendarIcon },
        ];
      case UserRole.DOCTOR:
        return [
          { path: '/doctor/portal', label: 'My Schedule', icon: CalendarIcon },
          { path: '/doctors', label: 'Peer Directory', icon: UsersIcon },
        ];
      case UserRole.PATIENT:
        return [
          { path: '/patient/portal', label: 'My Health History', icon: UserIcon },
          { path: '/patient/ai-assistant', label: 'AI Health Assistant', icon: Bot },
          { path: '/doctors', label: 'Book Consultation', icon: UsersIcon },
        ];
      case UserRole.ADMIN:
        return [
          { path: '/admin/portal', label: 'Verification Hub', icon: ShieldCheck },
          { path: '/doctors', label: 'Directory Audit', icon: UsersIcon },
        ];
      default:
        return [];
    }
  };

  return (
    <aside className="w-64 bg-white border-r h-screen sticky top-0 hidden md:flex flex-col shadow-sm">
      <div className="p-6 border-b flex items-center gap-2">
        <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
          <ShieldCheckIcon className="text-white" size={18} />
        </div>
        <h1 className="font-black text-xl text-teal-900 tracking-tighter uppercase">HealthDost</h1>
      </div>
      
      <div className="px-6 py-6 border-b bg-slate-50/50">
        <div className="flex items-center gap-2 mb-1">
          <Activity size={12} className="text-green-500 animate-pulse" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{auth.role} ONLINE</p>
        </div>
        <p className="font-black text-slate-800 truncate text-sm">{auth.name}</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {getNavItems().map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${
                isActive 
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-100 font-bold' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-teal-600'
              }`}
            >
              <Icon size={20} />
              <span className="text-sm uppercase tracking-tight font-bold">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all text-sm font-black uppercase tracking-widest"
        >
          <LogOutIcon size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

const App: React.FC = () => {
  const [auth, setAuth] = useState<UserAuth | null>(() => {
    const saved = sessionStorage.getItem('rhh_auth');
    return saved ? JSON.parse(saved) : null;
  });

  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimers = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    
    if (auth) {
      warningRef.current = setTimeout(() => setShowTimeoutWarning(true), 25 * 60 * 1000);
      timeoutRef.current = setTimeout(() => handleLogout(), 30 * 60 * 1000);
    }
  };

  useEffect(() => {
    window.addEventListener('mousemove', resetTimers);
    window.addEventListener('keydown', resetTimers);
    resetTimers();
    return () => {
      window.removeEventListener('mousemove', resetTimers);
      window.removeEventListener('keydown', resetTimers);
    };
  }, [auth]);

  const handleLogin = (userAuth: UserAuth) => {
    sessionStorage.setItem('rhh_auth', JSON.stringify(userAuth));
    setAuth(userAuth);
    setShowTimeoutWarning(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('rhh_auth');
    setAuth(null);
    setShowTimeoutWarning(false);
  };

  return (
    <HashRouter>
      <div className="flex min-h-screen bg-slate-50">
        {auth && <Sidebar auth={auth} onLogout={handleLogout} />}
        <main className="flex-1 overflow-y-auto relative">
          {showTimeoutWarning && (
            <div className="fixed top-6 right-6 z-[9999] animate-in slide-in-from-top-8 duration-300">
              <div className="bg-amber-600 text-white p-6 rounded-2xl shadow-2xl border-4 border-white flex items-center gap-4 max-w-sm">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                  <Clock className="animate-pulse" />
                </div>
                <div>
                  <p className="font-black text-sm uppercase tracking-tight">Session Expiring</p>
                  <p className="text-xs font-bold opacity-90">Auto-logout in 5 minutes for security.</p>
                </div>
              </div>
            </div>
          )}
          
          <Routes>
            <Route path="/" element={<Home auth={auth} />} />
            <Route path="/login/patient" element={<PublicRoute auth={auth}><PatientLogin onLogin={handleLogin} /></PublicRoute>} />
            <Route path="/login/doctor" element={<PublicRoute auth={auth}><DoctorLogin onLogin={handleLogin} /></PublicRoute>} />
            <Route path="/login/agent" element={<PublicRoute auth={auth}><AgentLogin onLogin={handleLogin} /></PublicRoute>} />
            <Route path="/login/admin" element={<PublicRoute auth={auth}><AdminLogin onLogin={handleLogin} /></PublicRoute>} />
            
            <Route path="/register/doctor" element={<PublicRoute auth={auth}><DoctorRegister /></PublicRoute>} />
            <Route path="/register/doctor/status" element={<PublicRoute auth={auth}><DoctorRegistrationStatus /></PublicRoute>} />
            
            <Route path="/dashboard" element={
              <ProtectedRoute auth={auth} allowedRole={UserRole.AGENT}>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/portal" element={
              <ProtectedRoute auth={auth} allowedRole={UserRole.ADMIN}>
                <AdminPortal />
              </ProtectedRoute>
            } />
            <Route path="/appointments" element={
              <ProtectedRoute auth={auth} allowedRole={UserRole.AGENT}>
                <Appointments />
              </ProtectedRoute>
            } />
            <Route path="/patient/portal" element={
              <ProtectedRoute auth={auth} allowedRole={UserRole.PATIENT}>
                <PatientPortal auth={auth} />
              </ProtectedRoute>
            } />
            <Route path="/patient/ai-assistant" element={
              <ProtectedRoute auth={auth} allowedRole={UserRole.PATIENT}>
                <AIHealthAssistant auth={auth} />
              </ProtectedRoute>
            } />
            <Route path="/doctor/portal" element={
              <ProtectedRoute auth={auth} allowedRole={UserRole.DOCTOR}>
                <DoctorPortal auth={auth} />
              </ProtectedRoute>
            } />
            <Route path="/doctors" element={auth ? <Doctors /> : <Navigate to="/" />} />
            <Route path="/doctor/:id" element={auth ? <DoctorProfile /> : <Navigate to="/" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
