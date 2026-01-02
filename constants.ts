
import { Doctor, Specialization, Appointment, DoctorAvailability } from './types';

const DEFAULT_AVAIL: DoctorAvailability = {
  monday: { isAvailable: true, morning: { start: '09:00', end: '13:00' }, evening: { start: '17:00', end: '21:00' } },
  tuesday: { isAvailable: true, morning: { start: '09:00', end: '13:00' }, evening: { start: '17:00', end: '21:00' } },
  wednesday: { isAvailable: true, morning: { start: '09:00', end: '13:00' }, evening: { start: '17:00', end: '21:00' } },
  thursday: { isAvailable: true, morning: { start: '09:00', end: '13:00' }, evening: { start: '17:00', end: '21:00' } },
  friday: { isAvailable: true, morning: { start: '09:00', end: '13:00' }, evening: { start: '17:00', end: '21:00' } },
  saturday: { isAvailable: true, morning: { start: '09:00', end: '13:00' }, evening: { start: '17:00', end: '21:00' } },
  sunday: { isAvailable: false, morning: { start: '09:00', end: '13:00' }, evening: { start: '17:00', end: '21:00' } }
};

const DOC_BASE = {
  verificationStatus: 'verified' as const,
  badges: ['verified' as const],
  statistics: { totalConsultations: 120, completedConsultations: 110, cancelledConsultations: 10, averageRating: 4.8, totalReviews: 45 },
  documents: {
    medicalDegree: { url: '', verified: true, uploadedAt: new Date().toISOString() },
    registrationCertificate: { url: '', verified: true, uploadedAt: new Date().toISOString() },
    idProof: { url: '', verified: true, uploadedAt: new Date().toISOString() },
  },
  isActive: true,
  isEmailVerified: true,
  isPhoneVerified: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  availability: DEFAULT_AVAIL,
  appointmentDuration: 30,
  acceptingNewPatients: true,
  available: true 
};

export const DUMMY_DOCTORS: Doctor[] = [
  {
    ...DOC_BASE,
    _id: 'd1',
    fullName: 'Dr. Rajesh Kumar',
    name: 'Dr. Rajesh Kumar',
    email: 'rajesh.kumar@healthdost.com',
    phoneNumber: '9876543210',
    dateOfBirth: '1980-05-15',
    gender: 'male',
    profilePhoto: 'https://picsum.photos/seed/doc_rajesh/200',
    avatar: 'https://picsum.photos/seed/doc_rajesh/200',
    medicalRegistrationNumber: 'MCI-12345',
    primaryQualification: 'MBBS',
    specialization: Specialization.GENERAL_PHYSICIAN,
    additionalQualifications: ['MD'],
    yearOfRegistration: 2005,
    yearsOfExperience: 18,
    medicalCouncil: 'Medical Council of India',
    currentPracticePlace: 'HealthFirst Clinic',
    clinicAddress: { street: 'Main Road', city: 'Sonipat', state: 'Haryana', pinCode: '131001' },
    consultationFee: 300,
    fee: 300,
    languagesSpoken: ['Hindi', 'English'],
    consultationModes: ['video', 'phone'],
    areasOfExpertise: ['Diabetes', 'Hypertension'],
    bio: 'Experienced physician serving rural Haryana.',
    location: { lat: 28.9931, lng: 77.0194 } // Sonipat
  },
  {
    ...DOC_BASE,
    _id: 'd2',
    fullName: 'Dr. Priya Sharma',
    name: 'Dr. Priya Sharma',
    email: 'priya.sharma@healthdost.com',
    phoneNumber: '9876543211',
    dateOfBirth: '1985-08-22',
    gender: 'female',
    profilePhoto: 'https://picsum.photos/seed/doc_priya/200',
    avatar: 'https://picsum.photos/seed/doc_priya/200',
    medicalRegistrationNumber: 'MCI-67890',
    primaryQualification: 'MBBS',
    specialization: Specialization.GYNECOLOGIST,
    additionalQualifications: ['MS (OBG)'],
    yearOfRegistration: 2010,
    yearsOfExperience: 13,
    medicalCouncil: 'Punjab Medical Council',
    currentPracticePlace: 'Starlight Women Care',
    clinicAddress: { street: 'Oak Avenue', city: 'Amritsar', state: 'Punjab', pinCode: '143001' },
    consultationFee: 500,
    fee: 500,
    languagesSpoken: ['Hindi', 'Punjabi'],
    consultationModes: ['video', 'in-person'],
    areasOfExpertise: ['Maternal Health', 'PCOS'],
    bio: 'Specialist in women healthcare and maternal medicine.',
    location: { lat: 31.6340, lng: 74.8723 } // Amritsar
  },
  {
    ...DOC_BASE,
    _id: 'd3',
    fullName: 'Dr. Amit Singh',
    name: 'Dr. Amit Singh',
    email: 'amit.singh@healthdost.com',
    phoneNumber: '9876543212',
    dateOfBirth: '1975-12-05',
    gender: 'male',
    profilePhoto: 'https://picsum.photos/seed/doc_amit/200',
    avatar: 'https://picsum.photos/seed/doc_amit/200',
    medicalRegistrationNumber: 'MCI-99887',
    primaryQualification: 'MBBS',
    specialization: Specialization.CARDIOLOGIST,
    additionalQualifications: ['MD', 'DM (Cardio)'],
    yearOfRegistration: 2000,
    yearsOfExperience: 25,
    medicalCouncil: 'Delhi Medical Council',
    currentPracticePlace: 'HeartCare Multispecialty',
    clinicAddress: { street: 'Pusa Road', city: 'New Delhi', state: 'Delhi', pinCode: '110005' },
    consultationFee: 800,
    fee: 800,
    languagesSpoken: ['Hindi', 'English'],
    consultationModes: ['video', 'in-person'],
    areasOfExpertise: ['Heart Failure', 'Angioplasty'],
    bio: 'Senior cardiologist with focus on rural emergency heart care.',
    location: { lat: 28.6139, lng: 77.2090 } // Delhi
  }
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    _id: 'a1',
    patientId: 'p_init_1',
    patientName: 'Ram Lal',
    doctorId: 'd1',
    doctorName: 'Dr. Rajesh Kumar',
    appointmentTime: '09:30 AM',
    status: 'completed',
    paymentMethod: 'cash',
    amount: 300,
    createdAt: new Date().toISOString()
  }
];

export const SYSTEM_INSTRUCTION_ANALYSIS = `
You are a medical symptom analyzer for a Rural Health Helpdesk in India.
Analyze the patient data and provide a concise JSON report.
Include proximity logic: prioritize doctors within 50km if geographic data is provided.
Respond ONLY in JSON.
`;

export const SYSTEM_INSTRUCTION_LIVE = `
You are 'HealthDost', a compassionate AI assistant for rural health kiosks in India. 
Respond simply, politely and reassuringly.
`;
