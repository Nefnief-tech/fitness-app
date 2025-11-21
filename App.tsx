import React, { useState, useEffect } from 'react';
import { TrainingPlan, AppView, WorkoutHistory, ActiveSession, WorkoutLogDetail } from './types';
import PlanManager from './components/PlanManager';
import ActiveWorkout from './components/ActiveWorkout';
import Stats from './components/Stats';
import { Card } from './components/ui';
import { LayoutDashboard, Dumbbell, BarChart2, Play, Trophy, Activity, User } from 'lucide-react';

// Default Presets
const DEFAULT_PLANS: TrainingPlan[] = [
  {
    id: 'preset-ppl',
    name: 'Push Pull Legs',
    description: 'Classic 3-day split focusing on movement patterns.',
    createdAt: Date.now(),
    days: [
      {
        id: 'ppl-push',
        name: 'Push (Chest/Shoulders/Triceps)',
        exercises: [
          { id: 'ex-1', name: 'Bench Press', targetSets: 3, targetReps: '8-10' },
          { id: 'ex-2', name: 'Overhead Press', targetSets: 3, targetReps: '8-12' },
          { id: 'ex-3', name: 'Incline Dumbbell Press', targetSets: 3, targetReps: '10-12' },
          { id: 'ex-4', name: 'Lateral Raises', targetSets: 4, targetReps: '12-15' },
          { id: 'ex-5', name: 'Tricep Pushdowns', targetSets: 3, targetReps: '12-15' }
        ]
      },
      {
        id: 'ppl-pull',
        name: 'Pull (Back/Biceps)',
        exercises: [
          { id: 'ex-6', name: 'Deadlift', targetSets: 3, targetReps: '5' },
          { id: 'ex-7', name: 'Pull Ups', targetSets: 3, targetReps: 'AMRAP' },
          { id: 'ex-8', name: 'Barbell Rows', targetSets: 3, targetReps: '8-10' },
          { id: 'ex-9', name: 'Face Pulls', targetSets: 4, targetReps: '15-20' },
          { id: 'ex-10', name: 'Bicep Curls', targetSets: 4, targetReps: '10-12' }
        ]
      },
      {
        id: 'ppl-legs',
        name: 'Legs',
        exercises: [
          { id: 'ex-11', name: 'Squat', targetSets: 3, targetReps: '5-8' },
          { id: 'ex-12', name: 'Romanian Deadlift', targetSets: 3, targetReps: '8-10' },
          { id: 'ex-13', name: 'Leg Press', targetSets: 3, targetReps: '10-12' },
          { id: 'ex-14', name: 'Leg Extensions', targetSets: 3, targetReps: '12-15' },
          { id: 'ex-15', name: 'Calf Raises', targetSets: 4, targetReps: '15-20' }
        ]
      }
    ]
  }
];

const App = () => {
  // --- State ---
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [history, setHistory] = useState<WorkoutHistory[]>([]);
  
  // Active Workout State
  const [activePlan, setActivePlan] = useState<TrainingPlan | null>(null);
  const [activeDayId, setActiveDayId] = useState<string | null>(null);

  // --- Effects ---
  
  // Load Data
  useEffect(() => {
    const storedPlans = localStorage.getItem('ironpulse_plans');
    const storedHistory = localStorage.getItem('ironpulse_history');
    
    if (storedPlans) {
      setPlans(JSON.parse(storedPlans));
    } else {
      setPlans(DEFAULT_PLANS);
      localStorage.setItem('ironpulse_plans', JSON.stringify(DEFAULT_PLANS));
    }

    if (storedHistory) {
      setHistory(JSON.parse(storedHistory));
    }
  }, []);

  // Save Plans
  useEffect(() => {
    if (plans.length > 0) {
      localStorage.setItem('ironpulse_plans', JSON.stringify(plans));
    }
  }, [plans]);

  // Save History
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('ironpulse_history', JSON.stringify(history));
    }
  }, [history]);


  // --- Handlers ---

  const handleStartWorkout = (plan: TrainingPlan, dayId: string) => {
    setActivePlan(plan);
    setActiveDayId(dayId);
    setView(AppView.ACTIVE_WORKOUT);
  };

  const handleFinishWorkout = (session: ActiveSession) => {
    if (!activePlan || !activeDayId) return;

    const day = activePlan.days.find(d => d.id === activeDayId);
    if (!day) return;

    // Calculate stats and prepare detailed log
    let volume = 0;
    let exercisesDone = 0;
    const detailedExercises: WorkoutLogDetail[] = [];

    Object.entries(session.exercises).forEach(([exId, sets]) => {
      const exerciseDef = day.exercises.find(e => e.id === exId);
      const exerciseName = exerciseDef ? exerciseDef.name : "Unknown Exercise";
      
      const completedSets = sets.filter(s => s.completed);
      
      if (completedSets.length > 0) {
        exercisesDone++;
        completedSets.forEach(s => {
          volume += s.weight * s.reps;
        });

        detailedExercises.push({
          name: exerciseName,
          sets: completedSets.map(s => ({
            weight: s.weight,
            reps: s.reps,
            completed: s.completed
          }))
        });
      }
    });

    const record: WorkoutHistory = {
      id: crypto.randomUUID(),
      date: Date.now(),
      planName: activePlan.name,
      dayName: day.name,
      durationSeconds: Math.floor((Date.now() - session.startTime) / 1000),
      totalVolume: volume,
      exercisesCompleted: exercisesDone,
      exercises: detailedExercises
    };

    setHistory(prev => [record, ...prev]);
    setActivePlan(null);
    setActiveDayId(null);
    setView(AppView.STATS);
  };

  const handleCancelWorkout = () => {
    if (window.confirm("Are you sure? Progress will be lost.")) {
      setActivePlan(null);
      setActiveDayId(null);
      setView(AppView.DASHBOARD);
    }
  };

  const deletePlan = (id: string) => {
    if (window.confirm("Delete this plan?")) {
      setPlans(prev => prev.filter(p => p.id !== id));
    }
  };

  // --- Renderers ---

  const renderDashboard = () => (
    <div className="space-y-8 animate-fade-in pb-24 md:pb-0">
      <header>
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
          IronPulse <span className="text-emerald-500">AI</span>
        </h1>
        <p className="text-zinc-400 mt-2">Welcome back. Ready to crush it?</p>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-zinc-900 to-zinc-900 border-emerald-500/20 relative overflow-hidden group cursor-pointer" onClick={() => setView(AppView.STATS)}>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Trophy size={64} />
          </div>
          <div className="text-zinc-400 text-sm font-medium mb-2 flex items-center gap-2">
            <div className="p-1 bg-emerald-500/10 rounded"><Trophy size={14} className="text-emerald-500"/></div>
            Total Workouts
          </div>
          <div className="text-4xl font-bold text-white">{history.length}</div>
        </Card>
        
        <Card className="bg-gradient-to-br from-zinc-900 to-zinc-900 border-blue-500/20 relative overflow-hidden group cursor-pointer" onClick={() => setView(AppView.STATS)}>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity size={64} />
          </div>
          <div className="text-zinc-400 text-sm font-medium mb-2 flex items-center gap-2">
            <div className="p-1 bg-blue-500/10 rounded"><Activity size={14} className="text-blue-500"/></div>
            This Week
          </div>
          <div className="text-4xl font-bold text-white">
            {history.filter(h => Date.now() - h.date < 7 * 24 * 60 * 60 * 1000).length}
          </div>
        </Card>
      </div>

      {/* Quick Start */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Play size={20} className="text-emerald-400 fill-emerald-400" /> Quick Start
        </h2>
        {plans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
             {plans[0].days.map(day => (
               <button 
                key={day.id}
                onClick={() => handleStartWorkout(plans[0], day.id)}
                className="text-left bg-zinc-900 hover:bg-zinc-800 hover:border-emerald-500/50 border border-zinc-800 p-5 rounded-xl transition-all group flex items-center justify-between shadow-lg hover:shadow-emerald-900/20"
               >
                 <div>
                   <div className="font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors mb-1">{day.name}</div>
                   <div className="text-xs text-zinc-500">{plans[0].name} • {day.exercises.length} Exercises</div>
                 </div>
                 <div className="w-10 h-10 rounded-full bg-zinc-800 group-hover:bg-emerald-500 text-zinc-400 group-hover:text-zinc-950 flex items-center justify-center transition-all">
                   <Play size={16} className="ml-0.5 fill-current" />
                 </div>
               </button>
             ))}
          </div>
        ) : (
          <div className="p-8 border border-dashed border-zinc-800 rounded-2xl text-center text-zinc-500 bg-zinc-900/30">
            <Dumbbell className="mx-auto mb-2 opacity-50" />
            No plans found. Create one in the Plans tab.
          </div>
        )}
      </div>
    </div>
  );

  const NavItem = ({ viewName, icon: Icon, label }: { viewName: AppView, icon: any, label: string }) => (
    <button 
      onClick={() => setView(viewName)}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full
        ${view === viewName 
          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_-5px_rgba(16,185,129,0.2)]' 
          : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
        }`}
    >
      <Icon size={20} strokeWidth={view === viewName ? 2.5 : 2} />
      <span className="font-medium">{label}</span>
    </button>
  );

  // --- Main Layout ---

  // Active Workout takes over full screen
  if (view === AppView.ACTIVE_WORKOUT && activePlan && activeDayId) {
    const activeDay = activePlan.days.find(d => d.id === activeDayId);
    if (activeDay) {
      return <ActiveWorkout plan={activePlan} day={activeDay} onFinish={handleFinishWorkout} onCancel={handleCancelWorkout} />;
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30 flex">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 fixed left-0 top-0 bottom-0 border-r border-zinc-800 bg-zinc-950 p-6 z-50">
        <div className="flex items-center gap-2 mb-10 px-2">
           <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
             <Activity className="text-zinc-950" size={20} strokeWidth={3} />
           </div>
           <span className="font-bold text-xl tracking-tight">IronPulse</span>
        </div>
        
        <nav className="space-y-2 flex-1">
          <NavItem viewName={AppView.DASHBOARD} icon={LayoutDashboard} label="Dashboard" />
          <NavItem viewName={AppView.PLANS} icon={Dumbbell} label="Plans" />
          <NavItem viewName={AppView.STATS} icon={BarChart2} label="Stats" />
        </nav>

        <div className="mt-auto pt-6 border-t border-zinc-800">
            <div className="flex items-center gap-3 px-4 py-2">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                    <User size={14} className="text-zinc-400"/>
                </div>
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-zinc-300">User</span>
                    <span className="text-[10px] text-zinc-500">Free Plan</span>
                </div>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 min-h-screen bg-zinc-950 relative">
        <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-12">
          {view === AppView.DASHBOARD && renderDashboard()}
          {view === AppView.PLANS && (
            <PlanManager 
              plans={plans} 
              onAddPlan={(p) => setPlans([p, ...plans])} 
              onDeletePlan={deletePlan}
              onStartWorkout={handleStartWorkout}
            />
          )}
          {view === AppView.STATS && <Stats history={history} />}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800 pb-safe pt-2 px-6 pb-4 z-50">
        <div className="flex justify-around items-center">
          <button 
            onClick={() => setView(AppView.DASHBOARD)}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${view === AppView.DASHBOARD ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <LayoutDashboard size={24} strokeWidth={view === AppView.DASHBOARD ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Home</span>
          </button>
          
          <button 
            onClick={() => setView(AppView.PLANS)}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${view === AppView.PLANS ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <Dumbbell size={24} strokeWidth={view === AppView.PLANS ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Plans</span>
          </button>

          <button 
            onClick={() => setView(AppView.STATS)}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${view === AppView.STATS ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <BarChart2 size={24} strokeWidth={view === AppView.STATS ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Stats</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;