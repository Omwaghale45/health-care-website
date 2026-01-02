
/* 
  REFERENCE IMPLEMENTATION FOR PHASE 2 BACKEND
  This file contains the Node.js/Express code for your real server.
*/

// import express from 'express';
// import mongoose from 'mongoose';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import { Patient, Doctor, Appointment } from './models';

// dotenv.config();
// const app = express();
// app.use(express.json());
// app.use(cors());

// // MongoDB Connection
// mongoose.connect(process.env.MONGODB_URI!)
//   .then(() => console.log("Connected to MongoDB Atlas"))
//   .catch(err => console.error("Could not connect to MongoDB", err));

// // Patients Endpoints
// app.post('/api/patients', async (req, res) => {
//   try {
//     const patient = new Patient(req.body);
//     await patient.save();
//     res.status(201).send(patient);
//   } catch (error) {
//     res.status(400).send(error);
//   }
// });

// app.get('/api/patients', async (req, res) => {
//   const patients = await Patient.find().sort({ createdAt: -1 });
//   res.send(patients);
// });

// // Doctors Endpoints
// app.get('/api/doctors', async (req, res) => {
//   const { specialization } = req.query;
//   const filter = specialization ? { specialization } : {};
//   const doctors = await Doctor.find(filter);
//   res.send(doctors);
// });

// // Appointments Endpoints
// app.post('/api/appointments', async (req, res) => {
//   try {
//     const appointment = new Appointment(req.body);
//     await appointment.save();
//     res.status(201).send(appointment);
//   } catch (error) {
//     res.status(400).send(error);
//   }
// });

// app.get('/api/appointments/today', async (req, res) => {
//   const start = new Date(); start.setHours(0,0,0,0);
//   const end = new Date(); end.setHours(23,59,59,999);
//   const appointments = await Appointment.find({
//     createdAt: { $gte: start, $lte: end }
//   }).populate('patientId').populate('doctorId');
//   res.send(appointments);
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
