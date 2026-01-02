
import { db } from './db';
import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION_ANALYSIS } from './constants';
import { AppointmentStatus, Patient, Doctor, VerificationStatus, AIDiagnosis, AIConsultation } from './types';
import { sendSimulatedEmail, EMAIL_TEMPLATES } from './services/emailService';
import { geminiPrescriptionService } from './services/gemini-prescription.service';

export const api = {
  auth: {
    patient: {
      login: async (phone: string, pass: string) => db.patients.login(phone, pass),
      register: async (data: any) => db.patients.create(data),
    },
    doctor: {
      login: async (email: string, pass: string) => db.doctors.login(email, pass),
      register: async (data: any) => {
        const doc = db.doctors.create(data);
        await sendSimulatedEmail(doc.email, EMAIL_TEMPLATES.REGISTRATION_CONFIRMATION(doc.fullName));
        return doc;
      },
      getRegistrationStatus: async (email: string): Promise<{ status: VerificationStatus; badges: string[]; rejectionReason?: string }> => {
        const doc = db.doctors.getAll().find(d => d.email === email);
        if (!doc) throw new Error("Doctor not found");
        return {
          status: doc.verificationStatus,
          badges: doc.badges,
          rejectionReason: doc.rejectionReason
        };
      },
      verifyPhoneOTP: async (otp: string) => {
        const isValid = otp === '123456'; 
        return { success: isValid, message: isValid ? "Phone verified." : "Invalid OTP." };
      },
      sendPhoneOTP: async (phone: string) => {
        return { success: true, otpId: "otp_" + Math.random().toString(36).substr(2, 5) };
      },
      verifyEmail: async (token: string) => {
        return { success: true, message: "Email verified successfully." };
      },
      uploadDocument: async (file: File) => {
        const sanitizedName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
        const uniqueId = Math.random().toString(36).substr(2, 9);
        const fileName = `${uniqueId}_${sanitizedName}`;
        await new Promise(r => setTimeout(r, 1200));
        return { 
          url: `https://storage.healthdost.com/v1/clinical-docs/verified/${fileName}`,
          public_id: uniqueId,
          bytes: file.size,
          format: file.name.split('.').pop(),
          uploadedAt: new Date().toISOString()
        };
      },
    },
    agent: {
      login: async (username: string, pin: string) => db.agents.login(username, pin),
    },
    admin: {
      login: async (user: string, pass: string) => db.admins.login(user, pass),
    }
  },
  admin: {
    listPendingDoctors: async () => {
      return db.doctors.getAll().filter(d => d.verificationStatus !== 'verified');
    },
    verifyDoctor: async (id: string, status: VerificationStatus, reason?: string) => {
      db.doctors.verify(id, status, reason);
      const doc = db.doctors.getById(id);
      if (doc) {
        if (status === 'verified') {
          await sendSimulatedEmail(doc.email, EMAIL_TEMPLATES.VERIFICATION_APPROVED(doc.fullName));
        } else if (status === 'rejected') {
          await sendSimulatedEmail(doc.email, EMAIL_TEMPLATES.VERIFICATION_REJECTED(doc.fullName, reason || "Documents unclear."));
        }
      }
      return { success: true };
    },
    sendReminder: async (id: string, docs: string[]) => {
      const doc = db.doctors.getById(id);
      if (doc) {
        await sendSimulatedEmail(doc.email, EMAIL_TEMPLATES.DOCUMENT_REMINDER(doc.fullName, docs));
      }
      return { success: true };
    }
  },
  notifications: {
    listForUser: async (email: string) => {
      const all = JSON.parse(localStorage.getItem('rhh_notifications') || '[]');
      return all.filter((n: any) => n.to === email);
    }
  },
  patients: {
    get: async (id: string) => db.patients.getById(id),
    create: async (data: any) => db.patients.create(data),
    updateProfile: async (id: string, updates: Partial<Patient>) => db.patients.update(id, updates),
  },
  doctors: {
    list: async (specialization?: string) => {
      const docs = db.doctors.getAll().filter(d => d.isActive && d.verificationStatus === 'verified');
      return specialization && specialization !== 'All' 
        ? docs.filter(d => d.specialization === specialization) 
        : docs;
    },
    get: async (id: string) => db.doctors.getById(id),
    updateProfile: async (id: string, updates: Partial<Doctor>) => db.doctors.update(id, updates),
    updateAvailability: async (id: string, available: boolean) => db.doctors.updateAvailability(id, available),
    informDoctor: async (docId: string, caseData: any) => {
      const doc = db.doctors.getById(docId);
      if (doc) {
        const template = {
          subject: "🚨 PRIORITY EMERGENCY ALERT: Incoming Patient Case",
          body: `
            <div style="font-family: sans-serif; padding: 20px; border: 2px solid #ef4444; border-radius: 12px;">
              <h1 style="color: #ef4444; margin: 0;">EMERGENCY CASE INCOMING</h1>
              <p>Dear Dr. ${doc.fullName},</p>
              <p>An emergency case has been routed to your station from a Rural Kiosk.</p>
              <div style="background: #fef2f2; padding: 15px; border-radius: 8px;">
                <strong>Patient:</strong> ${caseData.patientName}<br/>
                <strong>Symptoms:</strong> ${caseData.symptoms}<br/>
                <strong>Urgency:</strong> HIGH CRITICAL
              </div>
              <p>Please prepare for an immediate consultation.</p>
            </div>
          `
        };
        await sendSimulatedEmail(doc.email, template);
      }
    }
  },
  appointments: {
    book: async (data: any) => {
      const app = db.appointments.create(data);
      if (data.isPriorityEmergency) {
        await api.doctors.informDoctor(data.doctorId, { patientName: data.patientName, symptoms: data.symptoms });
      }
      return app;
    },
    listAll: async () => db.appointments.getAll(),
    listForPatient: async (id: string) => db.appointments.getForPatient(id),
    listForDoctor: async (id: string) => db.appointments.getForDoctor(id),
    updateStatus: async (id: string, status: AppointmentStatus) => db.appointments.update(id, { status }),
    updateClinicalNotes: async (id: string, clinicalNotes: string) => db.appointments.update(id, { clinicalNotes })
  },
  ai: {
    selfDiagnose: async (patientData: any): Promise<AIDiagnosis> => {
      return geminiPrescriptionService.getPrescription(patientData);
    },
    saveConsultation: async (consultationData: Omit<AIConsultation, '_id' | 'createdAt' | 'patientFollowedUp' | 'doctorConsulted'>) => {
      return db.ai_consultations.create(consultationData);
    },
    listForPatient: async (patientId: string) => {
      return db.ai_consultations.getForPatient(patientId);
    },
    updateConsultation: async (id: string, updates: Partial<AIConsultation>) => {
      db.ai_consultations.update(id, updates);
      return { success: true };
    },
    submitFeedback: async (id: string, wasHelpful: boolean, feedback: string) => {
      db.ai_consultations.update(id, { wasHelpful, patientFeedback: feedback });
      return { success: true };
    },
    analyze: async (patientData: any) => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze these symptoms for a rural patient: ${JSON.stringify(patientData)}`,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION_ANALYSIS,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              possibleConditions: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              urgency: { type: Type.STRING },
              recommendedDoctor: { type: Type.STRING },
              advice: { type: Type.STRING },
              precautions: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
            },
            required: ["possibleConditions", "urgency", "recommendedDoctor", "advice", "precautions"]
          }
        },
      });
      return JSON.parse(response.text);
    }
  }
};
