
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Languages, 
  BadgeIndianRupee, 
  CalendarCheck, 
  UserRoundCheck, 
  Sparkles,
  Star,
  ShieldCheck,
  Building2,
  Stethoscope,
  ChevronRight,
  Clock
} from 'lucide-react';
import { DUMMY_DOCTORS } from '../constants';
import { Specialization } from '../types';

const Doctors: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Specialization | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (location.state?.specialty) {
      setFilter(location.state.specialty);
    }
  }, [location.state]);

  const filteredDoctors = DUMMY_DOCTORS.filter(doc => {
    const matchesFilter = filter === 'All' || doc.specialization === filter;
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        doc.specialization.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto font-inter">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Medical Directory</h1>
          <p className="text-slate-500 font-medium mt-1">
            {location.state?.specialty ? (
              <span className="flex items-center gap-2 text-teal-600 font-bold uppercase text-xs tracking-widest">
                <Sparkles size={14} /> Recommended {location.state.specialty} specialists
              </span>
            ) : 'Browse verified specialists available for rural consultations.'}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Specialist name..."
              className="pl-12 pr-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-teal-500 outline-none w-full md:w-80 shadow-sm transition-all font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <select 
              className="pl-12 pr-10 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-teal-500 outline-none appearance-none font-bold shadow-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
            >
              <option value="All">All Specialties</option>
              {Object.values(Specialization).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredDoctors.map((doc) => (
          <div key={doc._id} className="bg-white rounded-[2.5rem] border-2 border-slate-50 shadow-xl shadow-slate-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all group">
            <div className="p-8">
              {/* Trust Indicators Header */}
              <div className="flex justify-between items-start mb-6">
                <div className="relative">
                  <img 
                    src={doc.avatar} 
                    alt={doc.name} 
                    className="w-24 h-24 rounded-3xl object-cover shadow-lg ring-8 ring-slate-50 transition-transform group-hover:scale-105"
                  />
                  {doc.available && (
                    <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full shadow-md"></span>
                  )}
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end text-amber-500 mb-1">
                    <Star size={16} fill="currentColor" />
                    <span className="font-black text-slate-900">{doc.statistics.averageRating}</span>
                    <span className="text-[10px] font-bold text-slate-400">({doc.statistics.totalReviews})</span>
                  </div>
                  {doc.verificationStatus === 'verified' && (
                    <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 shadow-sm">
                      <ShieldCheck size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Verified</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-black text-slate-900 leading-tight mb-1 group-hover:text-teal-600 transition-colors">{doc.name}</h3>
                <div className="flex items-center gap-2 text-teal-600 font-bold uppercase text-xs tracking-widest mb-3">
                  <Stethoscope size={14} />
                  {doc.specialization}
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {doc.primaryQualification} • {doc.yearsOfExperience} yrs exp
                </p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="p-2 bg-slate-50 rounded-xl text-slate-400"><Building2 size={16} /></div>
                  <span className="text-sm font-bold truncate">{doc.currentPracticePlace}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="p-2 bg-slate-50 rounded-xl text-slate-400"><Languages size={16} /></div>
                  <span className="text-sm font-bold">{doc.languagesSpoken.slice(0, 3).join(', ')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-50 rounded-xl text-teal-500"><BadgeIndianRupee size={16} /></div>
                  <div className="flex flex-col">
                    <span className="text-lg font-black text-slate-900 leading-none">₹{doc.fee}</span>
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Consultation Fee</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => navigate(`/doctor/${doc._id}`)}
                  className="flex-1 py-4 px-4 bg-slate-100 text-slate-700 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                >
                  Profile <ChevronRight size={14} />
                </button>
                <button 
                  disabled={!doc.available}
                  className={`flex-[2] py-4 px-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 shadow-xl ${
                    doc.available 
                      ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-teal-100 active:scale-95' 
                      : 'bg-slate-50 text-slate-300'
                  }`}
                >
                  <CalendarCheck size={18} />
                  {doc.available ? 'Book Appointment' : 'Unavailable'}
                </button>
              </div>
            </div>
            
            <div className="px-8 py-4 bg-slate-50/50 border-t flex items-center justify-between">
               <div className="flex items-center gap-2">
                 <Clock size={12} className="text-slate-400" />
                 <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Responds in ~2 hrs</span>
               </div>
               <span className="text-[9px] font-black uppercase text-teal-600 tracking-widest">{doc.statistics.totalConsultations}+ Consultations</span>
            </div>
          </div>
        ))}
        
        {filteredDoctors.length === 0 && (
          <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border-4 border-dashed border-slate-100 flex flex-col items-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6">
              <Search size={40} />
            </div>
            <p className="text-slate-500 font-bold text-lg mb-2">No matching specialists found</p>
            <p className="text-slate-400 text-sm mb-6 max-w-sm">We couldn't find any doctors matching "{searchTerm}" in the {filter} category.</p>
            <button onClick={() => {setFilter('All'); setSearchTerm('')}} className="bg-teal-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-teal-700 transition-all">Clear All Filters</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Doctors;
