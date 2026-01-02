
export enum UserRole {
  PATIENT = 'patient',
  DOCTOR = 'doctor',
  AGENT = 'agent',
  ADMIN = 'admin'
}

export enum Specialization {
  GENERAL_PHYSICIAN = 'General Physician',
  CARDIOLOGIST = 'Cardiologist',
  DERMATOLOGIST = 'Dermatologist',
  GYNECOLOGIST = 'Gynecologist',
  PEDIATRICIAN = 'Pediatrician',
  ORTHOPEDIC = 'Orthopedic',
  ENT_SPECIALIST = 'ENT Specialist',
  OPHTHALMOLOGIST = 'Ophthalmologist',
  PSYCHIATRIST = 'Psychiatrist',
  NEUROLOGIST = 'Neurologist',
  GASTROENTEROLOGIST = 'Gastroenterologist',
  UROLOGIST = 'Urologist',
  DENTIST = 'Dentist',
  AYURVEDIC = 'Ayurvedic Doctor',
  HOMEOPATHIC = 'Homeopathic Doctor',
  OTHER = 'Other'
}

export type Gender = 'male' | 'female' | 'other';
export type AppointmentStatus = 'booked' | 'completed' | 'cancelled';
export type PaymentMethod = 'cash' | 'upi';
export type UrgencyLevel = 'routine' | 'urgent' | 'emergency';
export type ConsultationMode = 'in-person' | 'video' | 'phone';
export type VerificationStatus = 'pending' | 'under_review' | 'verified' | 'rejected';

export interface GeoLocation {
  lat: number;
  lng: number;
}

export interface TimeSlot {
  start: string;
  end: string;
}

export interface DayAvailability {
  isAvailable: boolean;
  morning: TimeSlot;
  evening: TimeSlot;
}

export interface DoctorAvailability {
  monday: DayAvailability;
  tuesday: DayAvailability;
  wednesday: DayAvailability;
  thursday: DayAvailability;
  friday: DayAvailability;
  saturday: DayAvailability;
  sunday: DayAvailability;
}

export interface DocumentMetadata {
  url: string;
  verified: boolean;
  uploadedAt: string;
}

export interface Doctor {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: Gender;
  profilePhoto: string | null;
  password?: string;
  location?: GeoLocation;

  // Professional
  medicalRegistrationNumber: string;
  primaryQualification: 'MBBS' | 'BDS' | 'BAMS' | 'BHMS' | 'Other';
  specialization: Specialization;
  additionalQualifications: string[];
  yearOfRegistration: number;
  yearsOfExperience: number;
  medicalCouncil: string;

  // Documents
  documents: {
    medicalDegree: DocumentMetadata;
    registrationCertificate: DocumentMetadata;
    specializationCertificate?: DocumentMetadata;
    idProof: DocumentMetadata;
  };

  verificationStatus: VerificationStatus;
  verifiedAt?: string;
  rejectionReason?: string;
  badges: ('verified' | 'top_rated' | 'experienced' | 'recommended')[];

  // Practice
  currentPracticePlace: string;
  clinicAddress: {
    street: string;
    city: string;
    state: string;
    pinCode: string;
  };
  consultationFee: number;
  languagesSpoken: string[];
  consultationModes: ConsultationMode[];
  areasOfExpertise: string[];
  bio: string;

  // Schedule
  availability: DoctorAvailability;
  appointmentDuration: number;
  acceptingNewPatients: boolean;

  statistics: {
    totalConsultations: number;
    completedConsultations: number;
    cancelledConsultations: number;
    averageRating: number;
    totalReviews: number;
  };

  isActive: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  
  // Backwards compatibility/Alias
  name: string; // Alias for fullName
  avatar: string; // Alias for profilePhoto
  fee: number; // Alias for consultationFee
  available: boolean; // Computed from acceptingNewPatients
}

export interface UserAuth {
  id: string;
  role: UserRole;
  name: string;
}

export interface Patient {
  _id: string;
  name: string;
  age: number;
  gender: Gender;
  village: string;
  symptoms: string;
  phone: string;
  password?: string;
  createdAt: string;
  location?: GeoLocation;
}

export interface SymptomAnalysis {
  possibleConditions: string[];
  urgency: UrgencyLevel;
  recommendedDoctor: string;
  advice: string;
  precautions: string[];
}

export interface Medicine {
  name: string;
  dosage: string;
  duration: string;
  purpose: string;
  precautions: string;
  sideEffects?: string[];
  contraindications?: string[];
  alternatives?: string[];
  type?: 'OTC' | 'Prescription';
}

export interface AIDiagnosis {
  confidence: number;
  diagnosis: {
    primary: string;
    differential: { condition: string; probability: number }[];
  };
  analysis: string;
  prescription: {
    medicines: Medicine[];
    homeRemedies: string[];
  };
  precautions: string[];
  whenToSeekDoctor: string[];
  recommendedSpecialization: string;
  urgencyLevel: UrgencyLevel;
  isEmergency?: boolean;
  proximityScore?: number; // Distance-based scoring
}

export interface AIConsultation extends AIDiagnosis {
  _id: string;
  patientId: string;
  symptoms: string;
  duration: string;
  severity: 'mild' | 'moderate' | 'severe';
  existingConditions: string[];
  currentMedications: string;
  patientFollowedUp: boolean;
  doctorConsulted: boolean;
  consultedDoctorId?: string;
  wasHelpful?: boolean;
  patientFeedback?: string;
  createdAt: string;
}

export interface Appointment {
  _id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  appointmentTime: string;
  status: AppointmentStatus;
  paymentMethod: PaymentMethod;
  amount: number;
  createdAt: string;
  symptoms?: string;
  analysis?: SymptomAnalysis | AIDiagnosis | AIConsultation;
  clinicalNotes?: string;
  isPriorityEmergency?: boolean;
}

export interface Agent {
  _id: string;
  username: string;
  pin: string;
  assignedVillages: string[];
  isActive: boolean;
}

export interface AdminUser {
  _id: string;
  username: string;
  role: UserRole.ADMIN;
}
