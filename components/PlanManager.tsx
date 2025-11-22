import React, { useState } from 'react';
import { TrainingPlan, WorkoutDay, Exercise } from '../types';
import { generateWorkoutPlan } from '../services/geminiService';
import { Button, Card, Select, Badge, Input } from './ui';
import { Trash2, Sparkles, Dumbbell, Calendar, ChevronRight, ChevronLeft, Play, Target, Layers, Plus, X } from 'lucide-react';

interface PlanManagerProps {
  plans: TrainingPlan[];
  onAddPlan: (plan: TrainingPlan) => void;
  onDeletePlan: (id: string) => void;
  onStartWorkout: (plan: TrainingPlan, dayId: string) => void;
}

const PlanManager: React.FC<PlanManagerProps> = ({ plans, onAddPlan, onDeletePlan, onStartWorkout }) => {
  const [selectedPlan, setSelectedPlan] = useState<TrainingPlan | null>(null);
  const [view, setView] = useState<'list' | 'ai' | 'custom'>('list');
  const [isLoading, setIsLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  
  // AI Form State
  const [goal, setGoal] = useState('Hypertrophy (Muscle Growth)');
  const [days, setDays] = useState(4);
  const [equipment, setEquipment] = useState('Full Gym');
  const [experience, setExperience] = useState('Intermediate');

  // Custom Plan Form State
  const [customPlan, setCustomPlan] = useState<Omit<TrainingPlan, 'id' | 'createdAt' | 'isAiGenerated'>>({ name: '', description: '', days: []});

  const handleGenerate = async () => {
    setIsLoading(true);
    setAiError(null);
    try {
      const plan = await generateWorkoutPlan(goal, days, equipment, experience);
      if (plan) {
        onAddPlan(plan);
        setView('list');
      } else {
        setAiError("AI couldn't generate a plan for your request. Try different options.");
      }
    } catch (error) {
      console.error("Caught error in PlanManager:", error);
      let message = "An unknown error occurred while contacting the AI service.";
      if (error instanceof Error) {
        message = error.message;
      }
      setAiError(`Could not generate plan: ${message}. Please check your API key and network connection.`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetCustomPlan = () => {
      setCustomPlan({ name: '', description: '', days: []});
  }

  const handleSaveCustomPlan = () => {
    if (!customPlan.name || customPlan.days.length === 0) {
      alert("Please provide a plan name and at least one day.");
      return;
    }
    const newPlan: TrainingPlan = {
      ...customPlan,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      isAiGenerated: false
    };
    onAddPlan(newPlan);
    resetCustomPlan();
    setView('list');
  };

  const handleCustomPlanChange = (field: 'name' | 'description', value: string) => {
    setCustomPlan(prev => ({ ...prev, [field]: value }));
  };

  const addDayToCustomPlan = () => {
    setCustomPlan(prev => ({
      ...prev,
      days: [...prev.days, { id: crypto.randomUUID(), name: `Day ${prev.days.length + 1}`, exercises: [] }]
    }));
  };

  const removeDayFromCustomPlan = (dayId: string) => {
    setCustomPlan(prev => ({
      ...prev,
      days: prev.days.filter(d => d.id !== dayId)
    }));
  };

  const handleDayNameChange = (dayId: string, name: string) => {
    setCustomPlan(prev => ({
      ...prev,
      days: prev.days.map(d => d.id === dayId ? { ...d, name } : d)
    }));
  };

  const addExerciseToDay = (dayId: string) => {
    setCustomPlan(prev => ({
      ...prev,
      days: prev.days.map(d => {
        if (d.id === dayId) {
          return {
            ...d,
            exercises: [...d.exercises, { id: crypto.randomUUID(), name: '', targetSets: 3, targetReps: '8-12' }]
          };
        }
        return d;
      })
    }));
  };

  const removeExerciseFromDay = (dayId: string, exId: string) => {
    setCustomPlan(prev => ({
      ...prev,
      days: prev.days.map(d => {
        if (d.id === dayId) {
          return { ...d, exercises: d.exercises.filter(ex => ex.id !== exId) };
        }
        return d;
      })
    }));
  };

  const handleExerciseChange = (dayId: string, exId: string, field: keyof Omit<Exercise, 'id'>, value: string | number) => {
    setCustomPlan(prev => ({
      ...prev,
      days: prev.days.map(d => {
        if (d.id === dayId) {
          return {
            ...d,
            exercises: d.exercises.map(ex => {
              if (ex.id === exId) {
                return { ...ex, [field]: value };
              }
              return ex;
            })
          };
        }
        return d;
      })
    }));
  };


  // --- Detail View ---
  if (selectedPlan) {
    return (
      <div className="space-y-6 animate-fade-in pb-24 md:pb-0">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => setSelectedPlan(null)} className="!p-2 rounded-full">
            <ChevronLeft size={20} />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-white">{selectedPlan.name}</h2>
            <p className="text-zinc-400 text-sm">{selectedPlan.description}</p>
          </div>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {selectedPlan.days.map((day, index) => (
            <Card key={day.id} className="flex flex-col h-full border-zinc-800 bg-zinc-900/40">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-zinc-800/50">
                <div>
                  <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Day {index + 1}</span>
                  <h3 className="text-lg font-bold text-white">{day.name}</h3>
                </div>
                <Button 
                  variant="primary" 
                  className="!px-3 !py-1.5 !text-sm !gap-1"
                  onClick={() => onStartWorkout(selectedPlan, day.id)}
                >
                  <Play size={14} className="fill-zinc-950" /> Start
                </Button>
              </div>

              <div className="space-y-3 flex-grow">
                {day.exercises.map((ex, idx) => (
                  <div key={ex.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-zinc-800/50 transition-colors group">
                    <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-500 font-mono shrink-0 group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-colors">
                      {idx + 1}
                    </div>
                    <div className="flex-grow">
                      <div className="font-medium text-zinc-200 text-sm">{ex.name}</div>
                      <div className="flex gap-3 mt-1">
                        <Badge color="blue">{ex.targetSets} Sets</Badge>
                        <Badge color="purple">{ex.targetReps} Reps</Badge>
                        {ex.notes && <span className="text-xs text-zinc-500 italic mt-0.5">{ex.notes}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const renderListView = () => (
    <div className="space-y-6 pb-24 md:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-white">My Plans</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={() => { setView('custom'); resetCustomPlan(); }} variant="secondary" className="!py-2 flex-1 sm:flex-initial">
             New Custom Plan
          </Button>
          <Button onClick={() => setView('ai')} variant="secondary" className="!py-2 flex-1 sm:flex-initial">
            <Sparkles size={16} className="text-emerald-400" /> New AI Plan
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.length === 0 ? (
          <div className="col-span-full text-center py-20 text-zinc-500 border border-dashed border-zinc-800 rounded-2xl">
            <Dumbbell size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">No plans yet</p>
            <p className="text-sm">Create one above to get started!</p>
          </div>
        ) : (
          plans.map(plan => (
            <Card key={plan.id} className="group relative overflow-hidden flex flex-col justify-between h-full hover:border-emerald-500/30 transition-colors cursor-pointer" onClick={() => setSelectedPlan(plan)}>
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-zinc-800 rounded-lg group-hover:bg-emerald-500/10 transition-colors">
                     <Layers size={20} className="text-zinc-400 group-hover:text-emerald-400 transition-colors" />
                  </div>
                  {plan.isAiGenerated && <Badge>AI Plan</Badge>}
                </div>
                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">{plan.name}</h3>
                <p className="text-sm text-zinc-400 line-clamp-2 mb-4 h-10">{plan.description}</p>
                
                <div className="flex items-center gap-4 text-xs text-zinc-500 font-mono bg-zinc-950/50 p-2 rounded-lg border border-zinc-800/50">
                  <span className="flex items-center gap-1.5"><Calendar size={12} /> {plan.days.length} Days</span>
                  <span className="w-px h-3 bg-zinc-700"></span>
                  <span className="flex items-center gap-1.5"><Target size={12} /> {plan.days.reduce((acc, day) => acc + day.exercises.length, 0)} Ex</span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between gap-3 pt-4 border-t border-zinc-800/50">
                <span className="text-sm font-medium text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  View Details <ChevronRight size={16} />
                </span>
                <button 
                  className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  onClick={(e) => { e.stopPropagation(); onDeletePlan(plan.id); }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
  
  const renderAiForm = () => (
     <Card className="animate-fade-in border-emerald-500/30 bg-emerald-900/5 mb-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <Sparkles className="text-emerald-400" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Generate Workout Split</h3>
              <p className="text-sm text-zinc-400">Let AI design your perfect routine.</p>
            </div>
          </div>
          <Button variant="ghost" onClick={() => setView('list')}>Cancel</Button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Goal</label>
            <Select value={goal} onChange={e => setGoal(e.target.value)}>
              <option>Hypertrophy (Muscle Growth)</option>
              <option>Strength (Powerlifting)</option>
              <option>Endurance / Conditioning</option>
              <option>Fat Loss</option>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Experience</label>
            <Select value={experience} onChange={e => setExperience(e.target.value)}>
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Frequency</label>
            <Select value={days} onChange={e => setDays(Number(e.target.value))}>
              <option value={2}>2 Days / Week</option>
              <option value={3}>3 Days / Week</option>
              <option value={4}>4 Days / Week</option>
              <option value={5}>5 Days / Week</option>
              <option value={6}>6 Days / Week</option>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Equipment</label>
            <Select value={equipment} onChange={e => setEquipment(e.target.value)}>
              <option>Full Gym</option>
              <option>Dumbbells Only</option>
              <option>Barbell & Rack</option>
              <option>Bodyweight</option>
              <option>Home Gym (Basic)</option>
            </Select>
          </div>
        </div>
        
        {aiError && (
          <div className="bg-red-900/40 border border-red-500/30 text-red-400 text-sm rounded-xl p-4 my-4">
            <p className="font-bold mb-1">Oops, something went wrong!</p>
            <p className="text-red-400/80">{aiError}</p>
          </div>
        )}

        <Button 
          onClick={handleGenerate} 
          disabled={isLoading} 
          className="w-full"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></span>
              Generating...
            </span>
          ) : 'Create Plan with AI'}
        </Button>
      </div>
    </Card>
  );

  const renderCustomForm = () => (
      <div className="animate-fade-in pb-24 md:pb-0">
          <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Create Custom Plan</h2>
              <Button variant="ghost" onClick={() => setView('list')}>Cancel</Button>
          </div>
          <Card className="!p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input placeholder="Plan Name (e.g., My PPL Split)" value={customPlan.name} onChange={e => handleCustomPlanChange('name', e.target.value)} />
                  <Input placeholder="Description (optional)" value={customPlan.description} onChange={e => handleCustomPlanChange('description', e.target.value)} />
              </div>

              <div className="space-y-4">
                  {customPlan.days.map(day => (
                      <Card key={day.id} className="!p-4 bg-zinc-950/50 border-zinc-800">
                          <div className="flex items-center justify-between mb-4">
                              <Input className="!py-1 !text-lg !font-bold !bg-transparent !border-0 !p-0" value={day.name} onChange={e => handleDayNameChange(day.id, e.target.value)} />
                              <Button variant="danger" className="!p-2" onClick={() => removeDayFromCustomPlan(day.id)}><X size={16} /></Button>
                          </div>
                          
                          <div className="space-y-2">
                              {day.exercises.map(ex => (
                                  <div key={ex.id} className="grid grid-cols-12 gap-2 items-center">
                                      <div className="col-span-6"><Input placeholder="Exercise Name" value={ex.name} onChange={e => handleExerciseChange(day.id, ex.id, 'name', e.target.value)} className="!py-2" /></div>
                                      <div className="col-span-2"><Input type="number" placeholder="Sets" value={ex.targetSets} onChange={e => handleExerciseChange(day.id, ex.id, 'targetSets', Number(e.target.value))} className="!py-2 text-center" /></div>
                                      <div className="col-span-3"><Input placeholder="Reps (e.g., 8-12)" value={ex.targetReps} onChange={e => handleExerciseChange(day.id, ex.id, 'targetReps', e.target.value)} className="!py-2" /></div>
                                      <button onClick={() => removeExerciseFromDay(day.id, ex.id)} className="col-span-1 text-zinc-500 hover:text-red-400"><X size={16} /></button>
                                  </div>
                              ))}
                          </div>
                          <Button variant="secondary" onClick={() => addExerciseToDay(day.id)} className="!py-1.5 !text-xs mt-4 w-full"><Plus size={14}/> Add Exercise</Button>
                      </Card>
                  ))}
              </div>
              
              <Button variant="secondary" onClick={addDayToCustomPlan}><Plus size={16} /> Add Day</Button>
          </Card>
          
          <div className="mt-6">
              <Button onClick={handleSaveCustomPlan} className="w-full">Save Custom Plan</Button>
          </div>
      </div>
  );

  switch (view) {
    case 'ai':
      return renderAiForm();
    case 'custom':
      return renderCustomForm();
    default:
      return renderListView();
  }
};

export default PlanManager;