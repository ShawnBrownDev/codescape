import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SimulationSectionProps {
  onStartSimulation?: (id: string) => void;
}

export function SimulationSection({ onStartSimulation }: SimulationSectionProps) {
  const router = useRouter();

  const handleStartSimulation = (id: string) => {
    if (onStartSimulation) {
      onStartSimulation(id);
    }
    router.push('/rooms');
  };

  return (
    <div className="space-y-3">
      {/* Welcome Message */}
      <div className="bg-black/40 border border-green-500/20 rounded-lg p-4 mb-4">
        <h2 className="text-xl font-mono text-green-400 mb-2">
          Welcome to The Matrix Training Program
        </h2>
        <p className="text-sm font-mono text-green-500/70">
          Choose your simulation carefully. Each one presents unique challenges and opportunities for growth.
        </p>
      </div>

      {/* Active Simulation Section */}
      <div className="bg-black/40 border border-green-500/20 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 text-green-400" />
            <h3 className="text-lg font-mono text-green-400">Active Simulation</h3>
          </div>
          <Badge variant="outline" className="font-mono text-xs border-green-500/30 text-green-400">
            Level 1
          </Badge>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-mono text-green-400">Training Program: Basic</h4>
              <p className="text-xs font-mono text-green-500/70 mt-1">
                Begin your journey with fundamental training modules designed to prepare you for the challenges ahead.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs font-mono text-green-500/70">
              <span>XP Reward: 50</span>
              <span className="mx-2">•</span>
              <span>Duration: 10 min</span>
            </div>
            <Button 
              onClick={() => handleStartSimulation('basic')}
              size="sm"
              className="bg-green-900/20 hover:bg-green-900/40 text-green-400 border-green-500/30"
            >
              <Play className="h-4 w-4 mr-1" />
              Start Simulation
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="relative h-1 bg-green-900/30 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500/50 to-green-400 transition-all duration-500"
              style={{ width: '0%' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 