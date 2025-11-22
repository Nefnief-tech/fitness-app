import React from 'react';
import { Button, Card } from './ui';
import { Activity, Sparkles, TrendingUp, CheckSquare } from 'lucide-react';

// FIX: Replaced inline prop type with a dedicated interface for better type safety and readability.
interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}

const FeatureCard = ({ icon: Icon, title, children }: FeatureCardProps) => (
  <Card className="text-center p-8 border-zinc-800 bg-zinc-900/50 hover:border-emerald-500/20 hover:-translate-y-2 transition-all duration-300">
    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-2xl mx-auto flex items-center justify-center mb-6 border border-zinc-800">
      <Icon className="text-emerald-400" size={32} />
    </div>
    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
    <p className="text-zinc-400 text-sm leading-relaxed">{children}</p>
  </Card>
);

const LandingPage = () => {
  const handleLaunchApp = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30">
      {/* Background Gradient */}
      <div className="absolute inset-0 z-0 opacity-40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.2),rgba(255,255,255,0))]"></div>
      </div>
      
      <div className="relative z-10 animate-fade-in">
        {/* Header */}
        <header className="py-6 px-4 md:px-8">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Activity className="text-zinc-950" size={24} strokeWidth={3} />
              </div>
              <span className="font-bold text-2xl tracking-tight text-white">IronPulse</span>
            </div>
            <Button onClick={handleLaunchApp} variant="secondary">
              Launch App
            </Button>
          </div>
        </header>

        {/* Hero Section */}
        <main className="py-20 md:py-32 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400 mb-6">
              Forge Your Strength, Intelligently.
            </h1>
            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10">
              Stop guessing, start progressing. IronPulse is a sleek, AI-powered workout tracker that crafts personalized plans and visualizes your gains.
            </p>
            <Button onClick={handleLaunchApp} variant="primary" className="!px-8 !py-4 !text-lg shadow-2xl shadow-emerald-900">
              Get Started for Free
            </Button>
          </div>
        </main>

        {/* Features Section */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white">The Future of Fitness Tracking</h2>
              <p className="text-zinc-500 mt-2">All the tools you need to succeed, none of the clutter.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard icon={Sparkles} title="AI Plan Generation">
                Describe your goals and let our AI create a tailored, effective workout split just for you.
              </FeatureCard>
              <FeatureCard icon={CheckSquare} title="Intuitive Logging">
                Our clean interface and smart steppers make tracking sets, reps, and weight effortless during your workout.
              </FeatureCard>
              <FeatureCard icon={TrendingUp} title="Visualize Your Progress">
                Watch your strength grow with beautiful, insightful charts that track your volume, PRs, and consistency.
              </FeatureCard>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 border-t border-zinc-800/50 mt-20">
          <div className="max-w-7xl mx-auto text-center text-zinc-500 text-sm">
            <p>&copy; {new Date().getFullYear()} IronPulse AI. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;