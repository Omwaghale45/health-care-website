
import { Patient, Doctor, Appointment, Agent, UserRole, AdminUser, VerificationStatus, AIConsultation } from './types';
import { DUMMY_DOCTORS, INITIAL_APPOINTMENTS } from './constants';

const KEYS = {
  PATIENTS: 'rhh_patients',
  DOCTORS: 'rhh_doctors',
  APPOINTMENTS: 'rhh_appointments',
  AGENTS: 'rhh_agents',
  ADMINS: 'rhh_admins',
  AI_CONSULTATIONS: 'rhh_ai_consultations'
};

export type AuthResult<T> = {
  user?: T;
  error?: 'NOT_FOUND' | 'WRONG_PASSWORD' | 'INACTIVE';
};

export const db = {
  init: () => {
    if (!localStorage.getItem(KEYS.DOCTORS)) {
      localStorage.setItem(KEYS.DOCTORS, JSON.stringify(DUMMY_DOCTORS));
    }
    if (!localStorage.getItem(KEYS.AGENTS)) {
      const defaultAgent: Agent = {
        _id: 'agent1',
        username: 'agent_rampur',
        pin: '1234',
        assignedVillages: ['Rampur', 'Sonipat', 'Bilaspur'],
        isActive: true
      };
      localStorage.setItem(KEYS.AGENTS, JSON.stringify([defaultAgent]));
    }
    if (!localStorage.getItem(KEYS.ADMINS)) {
      const defaultAdmin = {
        _id: 'admin1',
        username: 'admin',
        password: 'admin123',
        role: UserRole.ADMIN
      };
      localStorage.setItem(KEYS.ADMINS, JSON.stringify([defaultAdmin]));
    }
    if (!localStorage.getItem(KEYS.APPOINTMENTS)) {
      localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(INITIAL_APPOINTMENTS));
    }
    if (!localStorage.getItem(KEYS.PATIENTS)) {
      localStorage.setItem(KEYS.PATIENTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(KEYS.AI_CONSULTATIONS)) {
      localStorage.setItem(KEYS.AI_CONSULTATIONS, JSON.stringify([]));
    }
  },

  patients: {
    getAll: (): Patient[] => JSON.parse(localStorage.getItem(KEYS.PATIENTS) || '[]'),
    getById: (id: string) => db.patients.getAll().find(p => p._id === id),
    create: (patient: Omit<Patient, '_id' | 'createdAt'>): Patient => {
      const newPatient: Patient = {
        ...patient,
        _id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString()
      };
      const patients = [newPatient, ...db.patients.getAll()];
      localStorage.setItem(KEYS.PATIENTS, JSON.stringify(patients));
      return newPatient;
    },
    update: (id: string, updates: Partial<Patient>) => {
      const patients = db.patients.getAll().map(p => 
        p._id === id ? { ...p, ...updates } : p
      );
      localStorage.setItem(KEYS.PATIENTS, JSON.stringify(patients));
    },
    login: (phone: string, password?: string): AuthResult<Patient> => {
      const patient = db.patients.getAll().find(p => p.phone === phone);
      if (!patient) return { error: 'NOT_FOUND' };
      if (patient.password !== password) return { error: 'WRONG_PASSWORD' };
      return { user: patient };
    }
  },

  doctors: {
    getAll: (): Doctor[] => JSON.parse(localStorage.getItem(KEYS.DOCTORS) || '[]'),
    getById: (id: string) => db.doctors.getAll().find(d => d._id === id),
    create: (doctor: any): Doctor => {
      const newDoc: Doctor = {
        ...doctor,
        _id: Math.random().toString(36).substr(2, 9),
        available: true,
        isActive: false 
      };
      const docs = [newDoc, ...db.doctors.getAll()];
      localStorage.setItem(KEYS.DOCTORS, JSON.stringify(docs));
      return newDoc;
    },
    update: (id: string, updates: Partial<Doctor>) => {
      const docs = db.doctors.getAll().map(d => 
        d._id === id ? { ...d, ...updates } : d
      );
      localStorage.setItem(KEYS.DOCTORS, JSON.stringify(docs));
    },
    verify: (id: string, status: VerificationStatus, reason?: string) => {
      const docs = db.doctors.getAll().map(d => 
        d._id === id ? { 
          ...d, 
          verificationStatus: status, 
          isActive: status === 'verified',
          rejectionReason: reason,
          verifiedAt: status === 'verified' ? new Date().toISOString() : undefined
        } : d
      );
      localStorage.setItem(KEYS.DOCTORS, JSON.stringify(docs));
    },
    updateAvailability: (id: string, available: boolean) => {
      const docs = db.doctors.getAll().map(d => 
        d._id === id ? { ...d, acceptingNewPatients: available } : d
      );
      localStorage.setItem(KEYS.DOCTORS, JSON.stringify(docs));
    },
    login: (email: string, password?: string): AuthResult<Doctor> => {
      const docs = db.doctors.getAll();
      const doc = docs.find(d => d.email === email);
      if (!doc) return { error: 'NOT_FOUND' };
      if (doc.password !== password) return { error: 'WRONG_PASSWORD' };
      if (doc.verificationStatus !== 'verified') return { error: 'INACTIVE' };
      return { user: doc };
    }
  },

  admins: {
    getAll: (): any[] => JSON.parse(localStorage.getItem(KEYS.ADMINS) || '[]'),
    login: (username: string, password?: string): AuthResult<AdminUser> => {
      const admin = db.admins.getAll().find(a => a.username === username);
      if (!admin) return { error: 'NOT_FOUND' };
      if (admin.password !== password) return { error: 'WRONG_PASSWORD' };
      return { user: { _id: admin._id, username: admin.username, role: UserRole.ADMIN } };
    }
  },

  agents: {
    getAll: (): Agent[] => JSON.parse(localStorage.getItem(KEYS.AGENTS) || '[]'),
    login: (username: string, pin: string): AuthResult<Agent> => {
      const agent = db.agents.getAll().find(a => a.username === username);
      if (!agent) return { error: 'NOT_FOUND' };
      if (agent.pin !== pin) return { error: 'WRONG_PASSWORD' };
      if (!agent.isActive) return { error: 'INACTIVE' };
      return { user: agent };
    }
  },

  ai_consultations: {
    getAll: (): AIConsultation[] => JSON.parse(localStorage.getItem(KEYS.AI_CONSULTATIONS) || '[]'),
    getForPatient: (patientId: string): AIConsultation[] => 
      db.ai_consultations.getAll().filter(c => c.patientId === patientId),
    create: (consultation: Omit<AIConsultation, '_id' | 'createdAt' | 'patientFollowedUp' | 'doctorConsulted'>): AIConsultation => {
      const newConsultation: AIConsultation = {
        ...consultation,
        _id: 'ai_' + Math.random().toString(36).substr(2, 9),
        patientFollowedUp: false,
        doctorConsulted: false,
        createdAt: new Date().toISOString()
      };
      const all = [newConsultation, ...db.ai_consultations.getAll()];
      localStorage.setItem(KEYS.AI_CONSULTATIONS, JSON.stringify(all));
      return newConsultation;
    },
    update: (id: string, updates: Partial<AIConsultation>) => {
      const all = db.ai_consultations.getAll().map(c => 
        c._id === id ? { ...c, ...updates } : c
      );
      localStorage.setItem(KEYS.AI_CONSULTATIONS, JSON.stringify(all));
    }
  },

  appointments: {
    getAll: (): Appointment[] => JSON.parse(localStorage.getItem(KEYS.APPOINTMENTS) || '[]'),
    getForPatient: (patientId: string): Appointment[] => 
      db.appointments.getAll().filter(a => a.patientId === patientId),
    getForDoctor: (doctorId: string): Appointment[] => 
      db.appointments.getAll().filter(a => a.doctorId === doctorId),
    create: (appointment: Omit<Appointment, '_id' | 'createdAt' | 'status'>): Appointment => {
      const newApp: Appointment = {
        ...appointment,
        _id: Math.random().toString(36).substr(2, 9),
        status: 'booked',
        createdAt: new Date().toISOString()
      };
      const apps = [newApp, ...db.appointments.getAll()];
      localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(apps));
      return newApp;
    },
    update: (id: string, updates: Partial<Appointment>) => {
      const apps = db.appointments.getAll().map(a => 
        a._id === id ? { ...a, ...updates } : a
      );
      localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(apps));
    }
  }
};
