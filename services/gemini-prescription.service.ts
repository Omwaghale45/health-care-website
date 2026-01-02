
import { GoogleGenAI, Type } from "@google/genai";
import { AIDiagnosis } from "../types";

export const geminiPrescriptionService = {
  getPrescription: async (patientData: any): Promise<AIDiagnosis> => {
    const { age, gender, symptoms, duration, severity, existingConditions, currentMedications } = patientData;
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      You are an experienced medical AI assistant specialized in preliminary diagnosis and prescription for common ailments in rural Indian healthcare settings.

      PATIENT INFORMATION:
      - Age: ${age}
      - Gender: ${gender}
      - Symptoms: ${symptoms}
      - Duration: ${duration}
      - Severity: ${severity}
      - Existing Conditions: ${existingConditions}
      - Current Medications: ${currentMedications}

      TASK:
      Analyze the symptoms and provide a comprehensive assessment.

      CRITICAL INSTRUCTIONS:
      1. Calculate your CONFIDENCE SCORE (0-100%):
         - 100% = Common, well-understood condition with clear symptoms.
         - 60-99% = Likely diagnosis but some uncertainty or requires manual verification.
         - <60% = Requires professional examination for basic clarity.

      2. PRESCRIBING LOGIC:
         - If confidence is 60% or above, provide Over-The-Counter (OTC) medicines for SYMPTOM RELIEF.
         - If confidence is 100%, these can be curative for common minor ailments.
         - If confidence is 60-99%, label these clearly as "Relief Measures" while evaluation is pending.
         - If confidence is below 60%, do NOT prescribe oral medication.

      3. NEVER prescribe for:
         - Chest pain, severe abdominal pain, high fever (>103°F), breathing difficulties, or heavy bleeding.

      4. Use ONLY standard Over-The-Counter (OTC) medicines available in India:
         - Paracetamol, Cetirizine, Ibuprofen, Omeprazole, ORS, Antacids, or basic topical first aid.

      Prioritize patient safety while providing immediate relief for discomfort.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            confidence: { type: Type.NUMBER },
            diagnosis: {
              type: Type.OBJECT,
              properties: {
                primary: { type: Type.STRING },
                differential: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      condition: { type: Type.STRING },
                      probability: { type: Type.NUMBER }
                    },
                    required: ["condition", "probability"]
                  }
                }
              },
              required: ["primary", "differential"]
            },
            analysis: { type: Type.STRING },
            prescription: {
              type: Type.OBJECT,
              properties: {
                medicines: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      dosage: { type: Type.STRING },
                      duration: { type: Type.STRING },
                      purpose: { type: Type.STRING },
                      precautions: { type: Type.STRING }
                    },
                    required: ["name", "dosage", "duration", "purpose", "precautions"]
                  }
                },
                homeRemedies: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["medicines", "homeRemedies"]
            },
            precautions: { type: Type.ARRAY, items: { type: Type.STRING } },
            whenToSeekDoctor: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendedSpecialization: { type: Type.STRING },
            urgencyLevel: { type: Type.STRING }
          },
          required: ["confidence", "diagnosis", "analysis", "prescription", "precautions", "whenToSeekDoctor", "recommendedSpecialization", "urgencyLevel"]
        }
      }
    });

    const result = JSON.parse(response.text);
    result.isEmergency = result.urgencyLevel === 'emergency' || result.confidence < 60;
    return result as AIDiagnosis;
  }
};
