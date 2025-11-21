export interface SetLog {
  id: string;
  reps: number;
  weight: number;
  completed: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  targetSets: number;
  targetReps: string; // e.g., "8-12"
  notes?: string;
}

export interface WorkoutDay {
  id: string;
  name: string; // e.g., "Push Day"
  exercises: Exercise[];
}

export interface TrainingPlan {
  id: string;
  name: string;
  description: string;
  days: WorkoutDay[];
  isAiGenerated?: boolean;
  createdAt: number;
}

export interface ActiveSession {
  id: string;
  planId: string;
  dayId: string;
  startTime: number;
  exercises: {
    [exerciseId: string]: SetLog[];
  };
}

export interface WorkoutLogDetail {
  name: string;
  sets: { weight: number; reps: number; completed: boolean }[];
}

export interface WorkoutHistory {
  id: string;
  date: number;
  planName: string;
  dayName: string;
  durationSeconds: number;
  totalVolume: number;
  exercisesCompleted: number;
  exercises?: WorkoutLogDetail[];
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  PLANS = 'PLANS',
  ACTIVE_WORKOUT = 'ACTIVE_WORKOUT',
  STATS = 'STATS',
}