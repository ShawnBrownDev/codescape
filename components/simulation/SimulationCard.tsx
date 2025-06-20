import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Lock, Play, Shield, Trophy } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SimulationCardProps {
  title: string;
  description: string;
  level: number;
  duration: string;
  xpReward: number;
  isLocked?: boolean;
  onStart?: () => void;
}

export function SimulationCard({
  title,
  description,
  level,
  duration,
  xpReward,
  isLocked = false,
  onStart
}: SimulationCardProps) {
  const router = useRouter();
  const baseClasses = "p-6 rounded-lg transition-all duration-300";
  const activeClasses = "bg-green-900/10 border border-green-500/20 hover:bg-green-900/20 hover-glow";
  const lockedClasses = "bg-gray-900/10 border border-gray-500/20 opacity-50";

  const handleStart = () => {
    if (onStart) {
      onStart();
    }
    router.push('/rooms');
  };

  return (
    <div className={`${baseClasses} ${isLocked ? lockedClasses : activeClasses}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className={`font-mono text-xl mb-2 ${isLocked ? 'text-gray-400' : 'text-green-400'}`}>
            {title}
          </h3>
          <p className={`font-mono text-sm mb-4 ${isLocked ? 'text-gray-500' : 'text-green-500/70'}`}>
            {description}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge 
            variant="outline" 
            className={`
              font-mono
              ${isLocked 
                ? 'bg-gray-900/30 border-gray-500/30 text-gray-400' 
                : 'bg-green-900/30 border-green-500/30 text-green-400'
              }
            `}
          >
            <Shield className="h-3 w-3 mr-1" />
            Level {level}
          </Badge>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm font-mono">
          <div className={`flex items-center ${isLocked ? 'text-gray-500' : 'text-green-500/70'}`}>
            <Clock className="h-4 w-4 mr-1" />
            {duration}
          </div>
          <div className={`flex items-center ${isLocked ? 'text-gray-500' : 'text-green-500/70'}`}>
            <Trophy className="h-4 w-4 mr-1" />
            {xpReward} XP
          </div>
        </div>
        <Button
          variant="outline"
          size="lg"
          className={`
            font-mono
            ${isLocked 
              ? 'text-gray-400 border-gray-500/50' 
              : 'text-green-400 border-green-500/50 hover:bg-green-900/40 hover:border-green-400 hover:text-green-300'
            }
          `}
          onClick={handleStart}
          disabled={isLocked}
        >
          {isLocked ? (
            <>
              <Lock className="h-4 w-4 mr-2" />
              Locked
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Start Simulation
            </>
          )}
        </Button>
      </div>
    </div>
  );
} 