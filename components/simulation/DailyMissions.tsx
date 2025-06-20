import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, Check, Play, Lock, Trophy } from 'lucide-react';
import { Mission } from '@/hooks/use-missions';
import { Badge } from '@/components/ui/badge';

interface DailyMissionsProps {
  missions: Mission[];
  getMissionProgress: (missionId: string) => { progress: number; completed: boolean } | undefined;
  updateMissionProgress: (missionId: string) => Promise<any>;
}

export function DailyMissions({ missions, getMissionProgress, updateMissionProgress }: DailyMissionsProps) {
  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Target className="h-4 w-4 text-green-400" />
          <h2 className="text-lg font-mono text-green-400">Daily Mission Objectives</h2>
        </div>
        <Badge variant="outline" className="font-mono text-xs border-green-500/30 text-green-400">
          {missions.filter(m => getMissionProgress(m.id)?.completed).length} / {missions.length}
        </Badge>
      </div>

      {/* Missions List */}
      <div className="grid gap-3">
        {missions.map((mission, index) => {
          const progress = getMissionProgress(mission.id);
          const isCompleted = progress?.completed || false;
          const isLocked = index > 0 && !getMissionProgress(missions[index - 1]?.id)?.completed;
          
          return (
            <Card 
              key={mission.id}
              className={`
                bg-black/40 border-green-500/20 hover:bg-black/50 transition-all duration-300
                ${isLocked ? 'opacity-50' : ''}
              `}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className={`
                      w-2 h-2 rounded-full
                      ${isCompleted 
                        ? 'bg-green-500 shadow-[0_0_10px_rgba(0,255,0,0.5)]' 
                        : isLocked
                          ? 'bg-gray-600'
                          : 'bg-green-900 border border-green-500'
                      }
                    `} />
                    <h3 className="text-base font-mono text-green-400">{mission.title}</h3>
                    {isCompleted && (
                      <Badge className="bg-green-500/10 text-green-400 border-0 text-xs">
                        COMPLETED
                      </Badge>
                    )}
                    {isLocked && (
                      <Badge className="bg-gray-500/10 text-gray-400 border-0 text-xs">
                        <Lock className="h-3 w-3 mr-1" />
                        LOCKED
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 text-xs font-mono text-green-500/70">
                    <Trophy className="h-3 w-3" />
                    <span>{mission.xp_reward} XP</span>
                  </div>
                </div>

                <p className="text-xs font-mono text-green-500/70 mb-3">
                  {mission.description}
                </p>

                {!isLocked && (
                  <div className="space-y-2">
                    {/* Progress Bar */}
                    <div className="relative h-1 bg-green-900/30 rounded-full overflow-hidden">
                      <div 
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500/50 to-green-400 transition-all duration-500"
                        style={{ 
                          width: `${isCompleted ? 100 : (progress?.progress || 0)}%`,
                          boxShadow: isCompleted ? '0 0 10px rgba(0,255,0,0.5)' : 'none'
                        }}
                      />
                    </div>

                    {/* Action Button */}
                    <Button
                      onClick={() => updateMissionProgress(mission.id)}
                      disabled={isCompleted || isLocked}
                      size="sm"
                      className={`
                        w-full font-mono
                        ${isCompleted 
                          ? 'bg-green-500/20 text-green-400 cursor-not-allowed hover:bg-green-500/20'
                          : 'bg-green-900/20 hover:bg-green-900/40 text-green-400 hover:shadow-[0_0_10px_rgba(0,255,0,0.2)]'
                        }
                      `}
                    >
                      {isCompleted ? (
                        <span className="flex items-center text-xs">
                          <Check className="h-3 w-3 mr-1" />
                          Mission Complete
                        </span>
                      ) : (
                        <span className="flex items-center text-xs">
                          <Play className="h-3 w-3 mr-1" />
                          Initialize Mission
                        </span>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
} 