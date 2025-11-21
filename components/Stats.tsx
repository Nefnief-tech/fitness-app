import React, { useState, useMemo } from 'react';
import { WorkoutHistory } from '../types';
import { Card, Select, Button } from './ui';
import { TrendingUp, Calendar, BarChart3, Search, ChevronLeft, Clock, Dumbbell, Layers, ArrowRight } from 'lucide-react';

interface StatsProps {
  history: WorkoutHistory[];
}

const Stats: React.FC<StatsProps> = ({ history }) => {
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutHistory | null>(null);

  // --- Derived Data ---

  const uniqueExercises = useMemo(() => {
    const exercises = new Set<string>();
    history.forEach(h => {
      if (h.exercises) {
        h.exercises.forEach(e => exercises.add(e.name));
      }
    });
    return Array.from(exercises).sort();
  }, [history]);

  // Set default selected exercise if available and none selected
  if (!selectedExercise && uniqueExercises.length > 0) {
    setSelectedExercise(uniqueExercises[0]);
  }

  const exerciseStats = useMemo(() => {
    if (!selectedExercise) return [];
    
    const stats: { date: number; maxWeight: number; volume: number; estOneRepMax: number }[] = [];
    
    history.forEach(h => {
      if (!h.exercises) return;
      const exData = h.exercises.find(e => e.name === selectedExercise);
      if (exData) {
        let maxWeight = 0;
        let volume = 0;
        let max1RM = 0;

        exData.sets.forEach(s => {
          if (s.completed) {
            volume += s.weight * s.reps;
            if (s.weight > maxWeight) maxWeight = s.weight;
            
            // Epley Formula for 1RM
            const oneRepMax = s.weight * (1 + s.reps / 30);
            if (oneRepMax > max1RM) max1RM = oneRepMax;
          }
        });

        if (volume > 0) {
          stats.push({
            date: h.date,
            maxWeight,
            volume,
            estOneRepMax: max1RM
          });
        }
      }
    });

    return stats.sort((a, b) => a.date - b.date);
  }, [history, selectedExercise]);

  // Weekly Activity (Last 4 Weeks)
  const weeklyActivity = useMemo(() => {
    const weeks = 4;
    const now = new Date();
    const data = new Array(weeks).fill(0).map((_, i) => ({
      label: i === 0 ? 'This Week' : `${i}w ago`,
      workouts: 0,
      volume: 0
    }));

    history.forEach(h => {
      const daysAgo = Math.floor((now.getTime() - h.date) / (1000 * 60 * 60 * 24));
      const weekIndex = Math.floor(daysAgo / 7);
      if (weekIndex < weeks) {
        data[weekIndex].workouts += 1;
        data[weekIndex].volume += h.totalVolume;
      }
    });

    return data.reverse(); // Oldest to newest
  }, [history]);

  // --- Render Charts ---

  const renderLineChart = () => {
    if (exerciseStats.length < 2) return <div className="h-32 flex items-center justify-center text-zinc-600 text-sm italic">Not enough data to chart</div>;

    const points = exerciseStats;
    const minVal = Math.min(...points.map(p => p.maxWeight)) * 0.9;
    const maxVal = Math.max(...points.map(p => p.maxWeight)) * 1.1;
    const range = maxVal - minVal || 10; // Prevent divide by zero

    const width = 100;
    const height = 50;
    
    const polylinePoints = points.map((p, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - ((p.maxWeight - minVal) / range) * height;
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="relative h-32 w-full mt-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
           {/* Gradient Def */}
           <defs>
            <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Fill */}
          <polygon points={`0,${height} ${polylinePoints} ${width},${height}`} fill="url(#gradient)" />
          
          {/* Line */}
          <polyline 
            points={polylinePoints} 
            fill="none" 
            stroke="#10b981" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />

          {/* Data Points */}
          {points.map((p, i) => {
             const x = (i / (points.length - 1)) * width;
             const y = height - ((p.maxWeight - minVal) / range) * height;
             return (
               <circle key={i} cx={x} cy={y} r="1.5" className="fill-zinc-950 stroke-emerald-400 stroke-[0.5px]" />
             );
          })}
        </svg>
        <div className="absolute top-0 left-0 text-[10px] text-zinc-500">{Math.round(maxVal)}kg</div>
        <div className="absolute bottom-0 left-0 text-[10px] text-zinc-500">{Math.round(minVal)}kg</div>
      </div>
    );
  };

  const renderBarChart = () => {
    const maxVol = Math.max(...weeklyActivity.map(w => w.volume)) || 1;
    
    return (
      <div className="flex items-end justify-between h-32 gap-2 mt-4">
        {weeklyActivity.map((week, i) => (
          <div key={i} className="flex flex-col items-center gap-2 flex-1">
            <div className="w-full bg-zinc-800/50 rounded-t-sm relative group hover:bg-zinc-800 transition-colors flex items-end" style={{ height: '100%' }}>
              <div 
                className="w-full bg-emerald-500/20 border-t border-x border-emerald-500/30 rounded-t-sm transition-all duration-500 relative"
                style={{ height: `${(week.volume / maxVol) * 100}%` }}
              >
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10 border border-zinc-700">
                  {(week.volume / 1000).toFixed(1)}k Vol
                </div>
              </div>
            </div>
            <div className="text-[10px] text-zinc-500 font-medium text-center leading-tight">{week.label}</div>
          </div>
        ))}
      </div>
    );
  };

  // --- Detail View (If workout selected) ---
  if (selectedWorkout) {
      return (
          <div className="animate-fade-in pb-24 md:pb-0 space-y-6">
             {/* Header with Back Button */}
             <div className="flex items-center gap-4">
                 <Button variant="secondary" onClick={() => setSelectedWorkout(null)} className="!p-2 rounded-full w-10 h-10 flex items-center justify-center shrink-0">
                    <ChevronLeft size={20} />
                 </Button>
                 <div className="flex-grow">
                     <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-1">{selectedWorkout.planName}</div>
                     <h2 className="text-2xl font-bold text-white leading-none">{selectedWorkout.dayName}</h2>
                 </div>
                 <div className="text-right text-zinc-500 text-xs font-mono">
                     {new Date(selectedWorkout.date).toLocaleDateString()}
                 </div>
             </div>

             {/* Summary Cards */}
             <div className="grid grid-cols-3 gap-3">
                 <Card className="!p-3 flex flex-col items-center justify-center bg-zinc-900/40 border-zinc-800">
                    <Clock size={16} className="text-zinc-500 mb-1" />
                    <span className="text-lg font-bold text-white font-mono">{Math.floor(selectedWorkout.durationSeconds / 60)}<span className="text-xs text-zinc-500 font-sans font-normal ml-0.5">m</span></span>
                 </Card>
                 <Card className="!p-3 flex flex-col items-center justify-center bg-zinc-900/40 border-zinc-800">
                    <Dumbbell size={16} className="text-zinc-500 mb-1" />
                    <span className="text-lg font-bold text-emerald-400 font-mono">{(selectedWorkout.totalVolume / 1000).toFixed(1)}<span className="text-xs text-zinc-500 font-sans font-normal ml-0.5">k</span></span>
                 </Card>
                 <Card className="!p-3 flex flex-col items-center justify-center bg-zinc-900/40 border-zinc-800">
                    <Layers size={16} className="text-zinc-500 mb-1" />
                    <span className="text-lg font-bold text-blue-400 font-mono">{selectedWorkout.exercisesCompleted}</span>
                 </Card>
             </div>

             {/* Exercise List */}
             <div className="space-y-4">
                 <h3 className="text-lg font-bold text-white border-b border-zinc-800 pb-2">Workout Log</h3>
                 {selectedWorkout.exercises && selectedWorkout.exercises.length > 0 ? (
                    selectedWorkout.exercises.map((ex, idx) => (
                     <Card key={idx} className="bg-zinc-900/20 border-zinc-800/60 overflow-hidden !p-0">
                         <div className="bg-zinc-900/60 px-4 py-3 border-b border-zinc-800/60 flex justify-between items-center">
                            <h3 className="font-bold text-zinc-200 text-sm">{ex.name}</h3>
                            <span className="text-xs text-zinc-500 font-mono">{ex.sets.length} sets</span>
                         </div>
                         
                         <div className="p-2">
                             <div className="grid grid-cols-4 gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-wider px-2 mb-1.5">
                                 <div className="col-span-1">Set</div>
                                 <div className="col-span-1 text-center">kg</div>
                                 <div className="col-span-1 text-center">Reps</div>
                                 <div className="col-span-1 text-right">1RM (Est)</div>
                             </div>
                             <div className="space-y-1">
                                 {ex.sets.map((set, sIdx) => (
                                     <div key={sIdx} className="grid grid-cols-4 gap-2 py-1.5 px-2 rounded hover:bg-zinc-800/30 items-center text-xs">
                                         <div className="col-span-1 flex items-center gap-2">
                                             <span className="w-4 h-4 rounded bg-zinc-800 text-zinc-500 flex items-center justify-center text-[9px] font-mono">{sIdx + 1}</span>
                                         </div>
                                         <div className="col-span-1 text-center font-mono text-white">{set.weight}</div>
                                         <div className="col-span-1 text-center font-mono text-zinc-300">{set.reps}</div>
                                         <div className="col-span-1 text-right font-mono text-zinc-600">
                                            {Math.round(set.weight * (1 + set.reps / 30))}
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         </div>
                     </Card>
                 ))
                 ) : (
                     <div className="text-zinc-500 italic text-center py-4">No detailed logs available for this session.</div>
                 )}
             </div>
          </div>
      );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-24 md:pb-0">
      <h2 className="text-2xl font-bold text-white">Stats & Development</h2>

      {/* Top Level Stats */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <Card className="!p-4 flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-900 border-zinc-800/60">
          <div className="text-zinc-500 text-[10px] md:text-xs uppercase tracking-wider font-bold mb-1">Workouts</div>
          <div className="text-xl md:text-3xl font-bold text-white">{history.length}</div>
        </Card>
        <Card className="!p-4 flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-900 border-zinc-800/60">
          <div className="text-zinc-500 text-[10px] md:text-xs uppercase tracking-wider font-bold mb-1">Volume</div>
          <div className="text-xl md:text-3xl font-bold text-emerald-400">
            {Math.round(history.reduce((acc, h) => acc + h.totalVolume, 0) / 1000)}k
          </div>
        </Card>
        <Card className="!p-4 flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-900 border-zinc-800/60">
          <div className="text-zinc-500 text-[10px] md:text-xs uppercase tracking-wider font-bold mb-1">Active Days</div>
          <div className="text-xl md:text-3xl font-bold text-blue-400">{new Set(history.map(h => new Date(h.date).toDateString())).size}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Volume Chart */}
        <Card className="border-zinc-800 bg-zinc-900/40">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={18} className="text-emerald-500" />
            <h3 className="font-bold text-zinc-200">Weekly Volume</h3>
          </div>
          {renderBarChart()}
        </Card>

        {/* Exercise Progress */}
        <Card className="border-zinc-800 bg-zinc-900/40">
           <div className="flex items-center justify-between mb-4 gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-500" />
              <h3 className="font-bold text-zinc-200 hidden sm:block">Progress</h3>
            </div>
            <div className="flex-grow max-w-[200px]">
               <Select 
                  value={selectedExercise} 
                  onChange={(e) => setSelectedExercise(e.target.value)}
                  className="!py-1.5 !text-xs !bg-zinc-950"
                  disabled={uniqueExercises.length === 0}
                >
                  {uniqueExercises.length === 0 && <option>No Data</option>}
                  {uniqueExercises.map(ex => <option key={ex} value={ex}>{ex}</option>)}
               </Select>
            </div>
           </div>

           {selectedExercise ? (
             <>
               <div className="flex justify-between items-end px-1">
                  <div>
                    <div className="text-xs text-zinc-500">Best Lift</div>
                    <div className="text-2xl font-bold text-white">
                      {Math.max(...exerciseStats.map(s => s.maxWeight))} <span className="text-sm text-zinc-500 font-normal">kg</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-zinc-500">Recent Est. 1RM</div>
                    <div className="text-xl font-bold text-blue-400">
                      {Math.round(exerciseStats[exerciseStats.length - 1]?.estOneRepMax || 0)} <span className="text-sm text-blue-500/60 font-normal">kg</span>
                    </div>
                  </div>
               </div>
               {renderLineChart()}
             </>
           ) : (
             <div className="h-40 flex flex-col items-center justify-center text-zinc-600 text-center px-6">
               <Search size={24} className="mb-2 opacity-50" />
               <p className="text-sm">Complete workouts to unlock exercise statistics.</p>
             </div>
           )}
        </Card>
      </div>

      {/* Recent Workouts List */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Calendar size={18} className="text-zinc-400" /> Recent Activity
        </h3>
        <div className="space-y-3">
          {history.slice(0, 10).map(h => (
             <div 
                key={h.id} 
                onClick={() => setSelectedWorkout(h)}
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex justify-between items-center hover:border-emerald-500/30 hover:bg-zinc-900 hover:shadow-lg hover:shadow-emerald-900/10 transition-all cursor-pointer group"
             >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-zinc-800/50 flex items-center justify-center group-hover:bg-emerald-500/10 group-hover:text-emerald-400 transition-colors">
                    <Layers size={20} className="text-zinc-500 group-hover:text-emerald-400" />
                  </div>
                  <div>
                    <div className="font-bold text-zinc-200 text-sm group-hover:text-white transition-colors">{h.dayName}</div>
                    <div className="text-xs text-zinc-500 flex items-center gap-2">
                        <span>{new Date(h.date).toLocaleDateString()}</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                        <span>{h.planName}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 md:gap-6 text-right">
                   <div className="hidden md:block">
                     <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Duration</div>
                     <div className="text-xs font-mono text-zinc-300">{Math.floor(h.durationSeconds / 60)}m</div>
                   </div>
                   <div className="hidden md:block">
                     <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Volume</div>
                     <div className="text-xs font-mono text-emerald-400">{(h.totalVolume / 1000).toFixed(1)}k</div>
                   </div>
                   <div className="text-zinc-600 group-hover:text-emerald-400 transition-colors group-hover:translate-x-1 transform duration-300">
                       <ArrowRight size={18} />
                   </div>
                </div>
             </div>
          ))}
          {history.length === 0 && (
            <div className="text-center py-8 text-zinc-500 text-sm bg-zinc-900/20 rounded-xl border border-dashed border-zinc-800">
              No workouts recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Stats;