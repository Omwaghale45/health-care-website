
import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  Clock, 
  CreditCard, 
  MoreHorizontal, 
  CheckCircle, 
  XCircle, 
  CalendarCheck,
  Search,
  Filter,
  RefreshCw,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { Appointment } from '../types';

const Appointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    setIsLoading(true);
    const data = await api.appointments.listAll();
    setAppointments(data);
    setIsLoading(false);
  };

  const updateStatus = async (id: string, status: any) => {
    await api.appointments.updateStatus(id, status);
    loadAppointments();
  };

  const filteredApps = appointments.filter(a => {
    if (filter === 'all') return true;
    return a.status === filter;
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Today's Appointment Queue</h1>
          <p className="text-slate-500">Agent: RHK-204 • Session Active</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={loadAppointments} 
            disabled={isLoading}
            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 transition-colors"
          >
            <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <div className="relative">
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm font-medium appearance-none"
            >
              <option value="all">All Appointments</option>
              <option value="booked">Pending Only</option>
              <option value="completed">Completed Only</option>
              <option value="cancelled">Cancelled Only</option>
            </select>
          </div>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Queue Size</p>
          <p className="text-2xl font-bold text-slate-900">{appointments.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Avg Wait</p>
          <p className="text-2xl font-bold text-teal-600">12m</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Today's Rev</p>
          <p className="text-2xl font-bold text-indigo-600">₹{appointments.filter(a => a.status === 'completed').reduce((sum, a) => sum + a.amount, 0)}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Satisfaction</p>
          <div className="flex items-center gap-1">
            <p className="text-2xl font-bold text-emerald-500">98%</p>
            <TrendingUp size={16} className="text-emerald-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b">
              <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Time/Patient</th>
              <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Consultation With</th>
              <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Status</th>
              <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Payment Details</th>
              <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredApps.map((app) => (
              <tr key={app._id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-bold text-slate-400 w-12">{app.appointmentTime || 'Now'}</div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700 font-bold uppercase ring-4 ring-teal-50">
                        {app.patientName[0]}
                      </div>
                      <span className="font-bold text-slate-900">{app.patientName}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-700">{app.doctorName}</span>
                    <span className="text-[10px] font-bold text-teal-600 tracking-widest uppercase">Specialist Call</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center">
                    <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${
                      app.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      app.status === 'cancelled' ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                      <CreditCard size={14} className="text-slate-400" />
                      ₹{app.amount}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{app.paymentMethod}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    {app.status === 'booked' && (
                      <>
                        <button 
                          onClick={() => updateStatus(app._id, 'completed')} 
                          className="bg-emerald-500 text-white p-2 rounded-lg hover:bg-emerald-600 transition-all shadow-md shadow-emerald-100"
                          title="Complete Visit"
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button 
                          onClick={() => updateStatus(app._id, 'cancelled')} 
                          className="bg-rose-100 text-rose-500 p-2 rounded-lg hover:bg-rose-500 hover:text-white transition-all"
                          title="Cancel Appointment"
                        >
                          <XCircle size={18} />
                        </button>
                      </>
                    )}
                    <button className="text-slate-300 hover:text-slate-600 p-2">
                      <MoreHorizontal size={20} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredApps.length === 0 && (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400">
            <CalendarCheck size={64} className="opacity-10 mb-4" />
            <p className="font-medium italic">No appointments found in the current view.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Appointments;
