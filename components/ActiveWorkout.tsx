import React, { useState, useEffect } from 'react';
import { ActiveSession, WorkoutDay, SetLog, TrainingPlan, WorkoutHistory } from '../types';
import { Button, Card } from './ui';
import { Check, ChevronLeft, Clock, Plus, Minus } from 'lucide-react';

interface ActiveWorkoutProps {
  plan: TrainingPlan;
  day: WorkoutDay;
  history: WorkoutHistory[];
  onFinish: (session: ActiveSession) => void;
  onCancel: () => void;
}

// Helper to find the last weight used for a specific exercise
const findLastWeightForExercise = (exerciseName: string, history: WorkoutHistory[]): number => {
    for (const record of history) { // history is newest first
      if (record.exercises) {
        const exerciseLog = record.exercises.find(e => e.name === exerciseName);
        if (exerciseLog && exerciseLog.sets.length > 0) {
          // Find the last completed set to get the most relevant weight
          const lastCompletedSet = [...exerciseLog.sets].reverse().find(s => s.completed);
          if (lastCompletedSet) {
            return lastCompletedSet.weight;
          }
          // Fallback to the last set if none are marked completed
          return exerciseLog.sets[exerciseLog.sets.length - 1].weight;
        }
      }
    }
    return 0; // Default if never performed
};


// Helper Component for numeric input with stepper controls
const Stepper = ({ 
  value, 
  onChange, 
  step = 1, 
  min = 0,
  placeholder = "-"
}: { 
  value: number; 
  onChange: (val: number) => void; 
  step?: number; 
  min?: number;
  placeholder?: string;
}) => {
  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent focus loss
    onChange(Number((value + step).toFixed(2)));
  };
  
  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    onChange(Math.max(min, Number((value - step).toFixed(2))));
  };

  return (
    <div className="flex items-center h-11 w-full bg-zinc-950/50 rounded-xl border border-zinc-800 focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/20 transition-all relative overflow-hidden group">
      <button 
        onClick={handleDecrement}
        className="h-full w-9 flex items-center justify-center bg-zinc-900/30 text-zinc-500 hover:bg-emerald-500/10 hover:text-emerald-400 active:bg-emerald-500/20 transition-colors border-r border-zinc-800/50"
        type="button"
        tabIndex={-1} // Skip tab focus for smoother keyboard navigation
      >
        <Minus size={14} strokeWidth={2.5} />
      </button>
      <input 
        type="number" 
        className="w-full h-full bg-transparent text-center text-zinc-100 font-bold text-base focus:outline-none p-0 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none placeholder:text-zinc-700 font-mono" 
        value={value === 0 ? '' : value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        placeholder={placeholder}
        onClick={(e) => (e.target as HTMLInputElement).select()}
        onFocus={(e) => (e.target as HTMLInputElement).select()}
      />
      <button 
        onClick={handleIncrement}
        className="h-full w-9 flex items-center justify-center bg-zinc-900/30 text-zinc-500 hover:bg-emerald-500/10 hover:text-emerald-400 active:bg-emerald-500/20 transition-colors border-l border-zinc-800/50"
        type="button"
        tabIndex={-1}
      >
        <Plus size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
};

const ActiveWorkout: React.FC<ActiveWorkoutProps> = ({ plan, day, history, onFinish, onCancel }) => {
  const [elapsed, setElapsed] = useState(0);
  const [session, setSession] = useState<ActiveSession>({
    id: crypto.randomUUID(),
    planId: plan.id,
    dayId: day.id,
    startTime: Date.now(),
    exercises: {}
  });
  const [lastWeights, setLastWeights] = useState<Record<string, number>>({});

  // Timer
  useEffect(() => {
    const timer = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Initialize sets based on plan defaults if empty
  useEffect(() => {
    const initialExercises: Record<string, SetLog[]> = {};
    const initialLastWeights: Record<string, number> = {};

    day.exercises.forEach(ex => {
      const lastWeight = findLastWeightForExercise(ex.name, history);
      initialLastWeights[ex.id] = lastWeight;

      const sets: SetLog[] = [];
      for (let i = 0; i < ex.targetSets; i++) {
        sets.push({
          id: crypto.randomUUID(),
          reps: 0, 
          weight: lastWeight, // Use last recorded weight
          completed: false
        });
      }
      initialExercises[ex.id] = sets;
    });

    setLastWeights(initialLastWeights);
    setSession(prev => ({ ...prev, exercises: initialExercises }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const updateSet = (exerciseId: string, setIndex: number, field: keyof SetLog, value: any) => {
    setSession(prev => {
      const sets = [...(prev.exercises[exerciseId] || [])];
      sets[setIndex] = { ...sets[setIndex], [field]: value };
      
      return {
        ...prev,
        exercises: { ...prev.exercises, [exerciseId]: sets }
      };
    });
  };

  const toggleComplete = (exerciseId: string, setIndex: number) => {
    setSession(prev => {
      const sets = [...(prev.exercises[exerciseId] || [])];
      sets[setIndex] = { ...sets[setIndex], completed: !sets[setIndex].completed };
      return {
        ...prev,
        exercises: { ...prev.exercises, [exerciseId]: sets }
      };
    });
  };

  const addSet = (exerciseId: string) => {
    setSession(prev => {
        const currentSets = prev.exercises[exerciseId] || [];
        const lastSet = currentSets[currentSets.length - 1] || { weight: 0, reps: 0 };
        return {
            ...prev,
            exercises: {
                ...prev.exercises,
                [exerciseId]: [
                    ...currentSets,
                    { id: crypto.randomUUID(), weight: lastSet.weight, reps: lastSet.reps, completed: false }
                ]
            }
        }
    })
  }

  const removeSet = (exerciseId: string) => {
      setSession(prev => {
          const currentSets = prev.exercises[exerciseId] || [];
          if (currentSets.length <= 1) return prev;
          return {
              ...prev,
              exercises: {
                  ...prev.exercises,
                  [exerciseId]: currentSets.slice(0, -1)
              }
          }
      })
  }

  return (
    <div className="relative min-h-screen bg-zinc-950">
      <div className="max-w-3xl mx-auto h-full pb-24">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-zinc-950/90 backdrop-blur-lg border-b border-zinc-800 px-4 py-4 flex items-center justify-between">
            <button onClick={onCancel} className="p-2 -ml-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-full transition-colors">
            <ChevronLeft />
            </button>
            <div className="flex flex-col items-center">
            <h2 className="font-bold text-white text-sm md:text-base">{day.name}</h2>
            <div className="flex items-center gap-1 text-emerald-400 text-xs font-mono">
                <Clock size={12} />
                {formatTime(elapsed)}
            </div>
            </div>
            <Button variant="primary" className="!px-4 !py-1.5 !text-xs !rounded-lg" onClick={() => onFinish(session)}>
            Finish
            </Button>
        </div>

        <div className="p-4 md:p-6 space-y-6 md:space-y-8">
            {day.exercises.map((exercise) => {
            const sets = session.exercises[exercise.id] || [];
            
            return (
                <div key={exercise.id} className="space-y-3">
                <div className="flex justify-between items-end px-1">
                    <div>
                    <h3 className="text-lg md:text-xl font-bold text-zinc-100">{exercise.name}</h3>
                    <div className="flex gap-4 items-baseline">
                      <p className="text-xs md:text-sm text-zinc-500">Target: {exercise.targetSets} x {exercise.targetReps}</p>
                      {lastWeights[exercise.id] > 0 && <p className="text-xs text-blue-500 font-mono">Last: {lastWeights[exercise.id]}kg</p>}
                    </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => removeSet(exercise.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-900 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 border border-zinc-800 transition-colors">
                            <Minus size={16} />
                        </button>
                        <button onClick={() => addSet(exercise.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-900 text-zinc-500 hover:text-emerald-400 hover:bg-zinc-800 border border-zinc-800 transition-colors">
                            <Plus size={16} />
                        </button>
                    </div>
                </div>

                <Card className="!p-0 overflow-hidden shadow-lg">
                    {/* Table Header */}
                    <div className="grid grid-cols-10 bg-zinc-900/50 text-[10px] md:text-xs text-zinc-500 py-2 px-3 md:px-4 border-b border-zinc-800 font-bold uppercase tracking-wider text-center items-center">
                      <div className="col-span-1 text-left">#</div>
                      <div className="col-span-3 text-center">kg</div>
                      <div className="col-span-3 text-center">Reps</div>
                      <div className="col-span-3 flex justify-center">
                        <Check size={14} />
                      </div>
                    </div>
                    
                    {/* Sets */}
                    <div className="divide-y divide-zinc-800/50">
                      {sets.map((set, idx) => (
                      <div key={set.id} className={`grid grid-cols-10 items-center py-3 px-3 md:px-4 transition-colors ${set.completed ? 'bg-emerald-900/10' : ''}`}>
                          {/* Set Number */}
                          <div className="col-span-1 text-left text-zinc-500 font-mono text-sm font-semibold pl-1">
                            {idx + 1}
                          </div>
                          
                          {/* Weight Stepper */}
                          <div className="col-span-3 px-1">
                            <Stepper 
                              value={set.weight} 
                              onChange={(val) => updateSet(exercise.id, idx, 'weight', val)}
                              step={2.5}
                              placeholder="-"
                            />
                          </div>
                          
                          {/* Reps Stepper */}
                          <div className="col-span-3 px-1">
                            <Stepper 
                              value={set.reps} 
                              onChange={(val) => updateSet(exercise.id, idx, 'reps', val)}
                              step={1}
                              placeholder="-"
                            />
                          </div>
                          
                          {/* Complete Button */}
                          <div className="col-span-3 flex justify-center pl-2">
                            <button 
                                onClick={() => toggleComplete(exercise.id, idx)}
                                className={`w-full h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${
                                  set.completed 
                                  ? 'bg-emerald-500 text-zinc-950 shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-105' 
                                  : 'bg-zinc-800 text-zinc-600 hover:bg-zinc-700 hover:text-zinc-400 border border-zinc-700/50'
                                }`}
                            >
                                <Check size={20} strokeWidth={3} />
                            </button>
                          </div>
                      </div>
                      ))}
                    </div>
                </Card>
                </div>
            );
            })}
        </div>
      </div>
    </div>
  );
};

export default ActiveWorkout;