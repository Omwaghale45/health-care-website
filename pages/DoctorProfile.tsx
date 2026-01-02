
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ShieldCheck, 
  Star, 
  MapPin, 
  Clock, 
  Award, 
  Users, 
  Languages, 
  Stethoscope, 
  ArrowLeft,
  Share2,
  Calendar,
  CheckCircle2,
  Phone,
  Video,
  Info,
  ChevronRight,
  ChevronLeft,
  Building2,
  MessageCircle,
  Activity,
  ClipboardList,
  Zap,
  Loader2,
  CreditCard,
  QrCode,
  BadgeIndianRupee,
  Shield,
  X,
  Lock
} from 'lucide-react';
import { api } from '../api';
import { Doctor, DayAvailability, AIDiagnosis, PaymentMethod } from '../types';

const DoctorProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const prefilledSymptoms = location.state?.prefilledSymptoms || '';
  const aiAnalysis = location.state?.aiAnalysis as AIDiagnosis | null;

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [bookingInProgress, setBookingInProgress] = useState(false);

  useEffect(() => {
    if (id) loadDoctor(id);
  }, [id]);

  const loadDoctor = async (docId: string) => {
    setLoading(true);
    const data = await api.doctors.get(docId);
    setDoctor(data || null);
    setLoading(false);
  };

  const handleBooking = async () => {
    if (!doctor || !selectedSlot) return;
    setBookingInProgress(true);
    
    try {
      const auth = JSON.parse(sessionStorage.getItem('rhh_auth') || '{}');
      await api.appointments.book({
        patientId: auth.id,
        patientName: auth.name,
        doctorId: doctor._id,
        doctorName: doctor.name,
        appointmentTime: `${next7Days[selectedDay].toLocaleDateString()} ${selectedSlot}`,
        paymentMethod: paymentMethod,
        amount: doctor.fee,
        symptoms: prefilledSymptoms,
        analysis: aiAnalysis || undefined
      });
      
      setBookingInProgress(false);
      setShowPayment(false);
      alert("Consultation Booked Successfully! View in your Health History.");
      navigate('/patient/portal');
    } catch (err) {
      alert("Booking failed. Please try again.");
      setBookingInProgress(false);
    }
  };

  const startPayment = () => {
    if (!selectedSlot) return;
    setShowPayment(true);
  };

  const processSimulatedPayment = () => {
    setPaymentProcessing(true);
    setTimeout(() => {
      setPaymentProcessing(false);
      handleBooking();
    }, 2000);
  };

  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const getDayAvailability = (date: Date): any => {
    if (!doctor) return null;
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const key = days[date.getDay()];
    return (doctor.availability as any)[key];
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Activity className="text-teal-600 animate-spin" size={48} />
        <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Loading Specialist Data</p>
      </div>
    </div>
  );

  if (!doctor) return <div>Doctor not found</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-inter pb-32">
      {/* Payment Gateway Overlay */}
      {showPayment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="p-8 border-b bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-teal-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                  <Shield size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">Secure Checkout</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Transaction ID: TXN_{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                </div>
              </div>
              <button onClick={() => setShowPayment(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                <X size={24} className="text-slate-400" />
              </button>
            </div>

            <div className="p-10 grid md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Billing Summary</h4>
                  <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 space-y-3">
                    <div className="flex justify-between text-xs font-bold text-slate-600">
                      <span>Consultation Fee</span>
                      <span>₹{doctor.fee}.00</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-slate-600">
                      <span>Platform Convenience</span>
                      <span>₹0.00</span>
                    </div>
                    <div className="pt-3 border-t-2 border-dashed flex justify-between items-end">
                      <span className="text-[10px] font-black uppercase text-slate-400">Total Payable</span>
                      <span className="text-3xl font-black text-teal-600">₹{doctor.fee}</span>
                    </div>
                  </div>
                </div>

                <div>
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Select Method</h4>
                   <div className="grid grid-cols-1 gap-3">
                      {[
                        { id: 'upi', label: 'UPI / Google Pay', icon: QrCode },
                        { id: 'card', label: 'Debit / Credit Card', icon: CreditCard },
                        { id: 'cash', label: 'Cash at Kiosk', icon: BadgeIndianRupee },
                      ].map((method) => (
                        <button 
                          key={method.id}
                          onClick={() => setPaymentMethod(method.id as any)}
                          className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                            paymentMethod === method.id 
                            ? 'border-teal-600 bg-teal-50 text-teal-700' 
                            : 'border-slate-100 text-slate-500 hover:border-teal-200'
                          }`}
                        >
                          <method.icon size={20} />
                          <span className="text-sm font-black uppercase tracking-tight">{method.label}</span>
                          {paymentMethod === method.id && <CheckCircle2 size={16} className="ml-auto" />}
                        </button>
                      ))}
                   </div>
                </div>
              </div>

              <div className="flex flex-col justify-between">
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                   {paymentMethod === 'upi' ? (
                      <div className="space-y-4">
                        <div className="bg-white p-4 rounded-3xl shadow-xl inline-block border-4 border-slate-900">
                           <QrCode size={120} className="text-slate-900" />
                        </div>
                        <p className="text-[10px] font-black uppercase text-slate-400">Scan to pay securely</p>
                      </div>
                   ) : (
                      <div className="space-y-4">
                        <Lock size={48} className="mx-auto text-slate-200" />
                        <p className="text-sm font-bold text-slate-400 leading-tight">Pay securely using our encrypted gateway. All transactions are protected by 256-bit SSL.</p>
                      </div>
                   )}
                </div>

                <div className="mt-8 space-y-4">
                  <button 
                    onClick={processSimulatedPayment}
                    disabled={paymentProcessing}
                    className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-lg uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {paymentProcessing ? <Loader2 className="animate-spin" /> : <Shield size={20} />}
                    {paymentProcessing ? 'Verifying...' : 'Pay Securely'}
                  </button>
                  <p className="text-[9px] text-center font-bold text-slate-400 uppercase tracking-widest">Payment encrypted by HealthDost Secure</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border-b sticky top-0 z-40 px-6 py-4 flex items-center justify-between shadow-sm">
        <button onClick={() => navigate(-1)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-teal-600 transition-colors"><ArrowLeft size={24} /></button>
        <div className="flex flex-col items-center">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">{doctor.name}</h2>
          <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">{doctor.specialization}</p>
        </div>
        <button className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-teal-600 transition-colors"><Share2 size={24} /></button>
      </div>

      <div className="max-w-6xl mx-auto p-6 lg:p-12">
        {/* Referral Info Alert */}
        {prefilledSymptoms && (
          <div className="mb-10 p-6 bg-teal-600 text-white rounded-[2rem] shadow-xl flex items-center justify-between animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-5">
               <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0"><Zap size={24} className="animate-pulse" /></div>
               <div>
                  <h3 className="text-lg font-black uppercase tracking-tight">AI Referral Session</h3>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-80">Importing: {aiAnalysis?.diagnosis.primary || 'Symptom Triage'}</p>
               </div>
            </div>
            <div className="hidden md:block bg-white/20 px-6 py-2 rounded-full border border-white/30 text-[10px] font-black uppercase tracking-widest">Clinical Handover Active</div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            <section className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl flex flex-col md:flex-row items-center gap-10">
              <div className="relative shrink-0">
                <img src={doctor.avatar} className="w-48 h-48 rounded-[3rem] object-cover shadow-2xl ring-8 ring-slate-50" />
                {doctor.verificationStatus === 'verified' && (
                  <div className="absolute -bottom-3 -right-3 bg-emerald-500 text-white p-3 rounded-2xl shadow-xl border-4 border-white"><ShieldCheck size={24} /></div>
                )}
              </div>
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                  <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{doctor.name}</h1>
                  <div className="flex items-center gap-1 justify-center md:justify-start text-amber-500 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                    <Star size={16} fill="currentColor" /><span className="font-black text-slate-900 text-sm">{doctor.statistics.averageRating}</span>
                  </div>
                </div>
                <p className="text-teal-600 font-black uppercase tracking-widest text-sm mb-6"><Award size={18} className="inline mr-2" /> {doctor.primaryQualification} • {doctor.specialization}</p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                  <span className="px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-black uppercase text-slate-500 tracking-widest border border-slate-100">{doctor.yearsOfExperience}Y Experience</span>
                  <span className="px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-black uppercase text-slate-500 tracking-widest border border-slate-100">{doctor.medicalCouncil} Verified</span>
                </div>
              </div>
            </section>

            {/* Case Prefill Section */}
            {prefilledSymptoms && (
              <section className="space-y-6">
                 <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3"><ClipboardList className="text-teal-600" /> Patient Case Data</h3>
                 <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
                    <div>
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Imported Symptoms</p>
                       <p className="font-bold text-slate-700 italic text-lg leading-relaxed">"{prefilledSymptoms}"</p>
                    </div>
                    {aiAnalysis && (
                       <div className="p-8 bg-slate-50 rounded-[2rem] border-2 border-slate-100">
                          <p className="text-[9px] font-black text-teal-600 uppercase tracking-widest mb-4">AI Screening Logic (Encrypted)</p>
                          <div className="flex gap-10">
                             <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Primary Condition</p>
                                <p className="font-black text-slate-900">{aiAnalysis.diagnosis.primary}</p>
                             </div>
                             <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Confidence</p>
                                <p className="font-black text-emerald-600">{aiAnalysis.confidence}%</p>
                             </div>
                          </div>
                       </div>
                    )}
                 </div>
              </section>
            )}

            <section className="space-y-6">
               <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3"><Info className="text-teal-600" /> About Specialist</h3>
               <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                 <p className="text-slate-600 font-medium leading-relaxed text-lg italic">"{doctor.bio}"</p>
               </div>
            </section>
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl p-8 sticky top-32">
               <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-8">Consultation Slots</h3>

               <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide mb-8">
                  {next7Days.map((date, i) => {
                    const avail = getDayAvailability(date);
                    const isActive = selectedDay === i;
                    const isClosed = !avail?.isAvailable;
                    return (
                      <button key={i} onClick={() => !isClosed && setSelectedDay(i)} disabled={isClosed} className={`flex flex-col items-center gap-2 min-w-[70px] p-4 rounded-2xl border-2 transition-all ${isActive ? 'bg-teal-600 border-teal-600 text-white shadow-xl' : isClosed ? 'border-slate-50 opacity-30 cursor-not-allowed' : 'bg-white border-slate-100 text-slate-400 hover:border-teal-200'}`}>
                        <span className="text-[10px] font-black uppercase tracking-widest">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                        <span className="text-lg font-black">{date.getDate()}</span>
                      </button>
                    );
                  })}
               </div>

               <div className="space-y-6">
                  {getDayAvailability(next7Days[selectedDay])?.isAvailable ? (
                    <div className="grid grid-cols-2 gap-3">
                       {['09:00 AM', '10:00 AM', '05:00 PM', '06:00 PM'].map(slot => (
                          <button key={slot} onClick={() => setSelectedSlot(slot)} className={`py-3 rounded-xl border-2 text-xs font-black transition-all ${selectedSlot === slot ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'border-slate-100 text-slate-600 hover:border-slate-200'}`}>{slot}</button>
                       ))}
                    </div>
                  ) : (
                    <div className="p-10 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                      <Clock size={40} className="mx-auto text-slate-200 mb-4" /><p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Clinic Closed Today</p>
                    </div>
                  )}
               </div>

               <div className="mt-10 pt-8 border-t border-slate-50 space-y-4">
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span className="text-slate-400 uppercase tracking-widest text-[10px]">Session Fee</span>
                    <span className="text-xl font-black text-slate-900">₹{doctor.fee}</span>
                  </div>
                  <button onClick={startPayment} disabled={!selectedSlot} className="w-full bg-teal-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-teal-700 disabled:opacity-50 transition-all shadow-2xl flex items-center justify-center gap-3">
                    <CheckCircle2 size={18} />
                    Confirm & Pay
                  </button>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
