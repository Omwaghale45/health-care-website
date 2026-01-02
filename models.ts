
/* 
  REFERENCE IMPLEMENTATION FOR PHASE 2 MODELS
  These are the Mongoose schemas for your MongoDB database.
*/

// import mongoose from 'mongoose';

// export const PatientSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   age: { type: Number, required: true },
//   gender: { type: String, enum: ['male', 'female', 'other'], required: true },
//   village: String,
//   symptoms: { type: String, required: true },
//   createdAt: { type: Date, default: Date.now }
// });

// export const DoctorSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   specialization: { type: String, required: true },
//   languages: [String],
//   fee: Number,
//   available: { type: Boolean, default: true },
//   phoneNumber: String,
//   avatar: String
// });

// export const AppointmentSchema = new mongoose.Schema({
//   patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
//   doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
//   appointmentTime: String,
//   status: { type: String, enum: ['booked', 'completed', 'cancelled'], default: 'booked' },
//   paymentMethod: { type: String, enum: ['cash', 'upi'], required: true },
//   amount: Number,
//   createdAt: { type: Date, default: Date.now }
// });

// export const Patient = mongoose.model('Patient', PatientSchema);
// export const Doctor = mongoose.model('Doctor', DoctorSchema);
// export const Appointment = mongoose.model('Appointment', AppointmentSchema);
