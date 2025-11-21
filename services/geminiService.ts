import { GoogleGenAI, Type } from "@google/genai";
import { TrainingPlan, WorkoutDay, Exercise } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key is missing");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateWorkoutPlan = async (
  goal: string,
  daysPerWeek: number,
  equipment: string,
  experience: string
): Promise<TrainingPlan | null> => {
  const ai = getClient();
  if (!ai) return null;

  const prompt = `Create a detailed workout split for a ${experience} lifter. 
  Goal: ${goal}. 
  Frequency: ${daysPerWeek} days per week. 
  Equipment available: ${equipment}.
  Provide a structured plan with specific exercises, target sets, and rep ranges.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            planName: { type: Type.STRING },
            description: { type: Type.STRING },
            days: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "e.g. Push A, Upper Body" },
                  exercises: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        targetSets: { type: Type.NUMBER },
                        targetReps: { type: Type.STRING, description: "e.g. 8-12 or Failure" },
                        notes: { type: Type.STRING, description: "Brief cues" }
                      },
                      required: ["name", "targetSets", "targetReps"]
                    }
                  }
                },
                required: ["name", "exercises"]
              }
            }
          },
          required: ["planName", "description", "days"]
        }
      }
    });

    if (!response.text) return null;
    
    const data = JSON.parse(response.text);
    
    // Map to internal types
    const plan: TrainingPlan = {
      id: crypto.randomUUID(),
      name: data.planName,
      description: data.description,
      createdAt: Date.now(),
      isAiGenerated: true,
      days: data.days.map((d: any) => ({
        id: crypto.randomUUID(),
        name: d.name,
        exercises: d.exercises.map((e: any) => ({
          id: crypto.randomUUID(),
          name: e.name,
          targetSets: e.targetSets,
          targetReps: e.targetReps,
          notes: e.notes || ""
        }))
      }))
    };

    return plan;
  } catch (error) {
    console.error("Error generating workout:", error);
    return null;
  }
};
