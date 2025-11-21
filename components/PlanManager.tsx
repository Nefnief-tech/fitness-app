import React, { useState } from 'react';
import { TrainingPlan } from '../types';
import { generateWorkoutPlan } from '../services/geminiService';
import { Button, Card, Select, Badge } from './ui';
import { Trash2, Sparkles, Dumbbell, Calendar, ChevronRight, ChevronLeft, Play, Target, Layers } from 'lucide-react';

interface PlanManagerProps {
  plans: TrainingPlan[];
  onAddPlan: (plan: TrainingPlan) => void;
  onDeletePlan: (id: string) => void;
  onStartWorkout: (plan: TrainingPlan, dayId: string) => void;
}

const PlanManager: React.FC<PlanManagerProps> = ({ plans, onAddPlan, onDeletePlan, onStartWorkout }) => {
  const [selectedPlan, setSelectedPlan] = useState<TrainingPlan | null>(null);
  const [showAiForm, setShowAiForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form State
  const [goal, setGoal] = useState('Hypertrophy (Muscle Growth)');
  const [days, setDays] = useState(4);
  const [equipment, setEquipment] = useState('Full Gym');
  const [experience, setExperience] = useState('Intermediate');

  const handleGenerate = async () => {
    setIsLoading(true);
    const plan = await generateWorkoutPlan(goal, days, equipment, experience);
    if (plan) {
      onAddPlan(plan);
      setShowAiForm(false);
    }
    setIsLoading(false);
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

  // --- List View ---
  return (
    <div className="space-y-6 pb-24 md:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-white">My Plans</h2>
        <Button onClick={() => setShowAiForm(!showAiForm)} variant="secondary" className="!py-2 w-full sm:w-auto">
          {showAiForm ? 'Cancel' : <><Sparkles size={16} className="text-emerald-400" /> New AI Plan</>}
        </Button>
      </div>

      {showAiForm && (
        <Card className="animate-fade-in border-emerald-500/30 bg-emerald-900/5 mb-8">
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <Sparkles className="text-emerald-400" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Generate Workout Split</h3>
                <p className="text-sm text-zinc-400">Let AI design your perfect routine.</p>
              </div>
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
      )}

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
};

export default PlanManager;