import { Shield } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import type { RankInfo } from '@/lib/utils'

function formatXP(xp: number): string {
  return xp.toLocaleString()
}

interface XPDisplayProps {
  xp: number
  currentRank: RankInfo
  nextRank: RankInfo | null
  progress: number
}

export function XPDisplay({ xp, currentRank, nextRank, progress }: XPDisplayProps) {
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Shield className={`h-4 w-4 ${currentRank?.color || 'text-green-400'}`} />
          <span className={`text-sm font-mono ${currentRank?.color || 'text-green-400'}`}>
            {currentRank?.title || 'Loading...'}
          </span>
        </div>
        <span className={`text-sm font-mono ${currentRank?.color || 'text-green-400'}`}>
          {formatXP(xp)} XP
        </span>
      </div>
      <Progress value={progress} className={`h-2 ${currentRank?.color || 'text-green-400'}`} />
      {nextRank && (
        <div className="flex justify-between mt-1">
          <span className={`text-xs font-mono ${currentRank?.color || 'text-green-500/70'}`}>
            Current: {formatXP(currentRank?.min_xp || 0)} XP
          </span>
          <span className={`text-xs font-mono ${nextRank?.color || 'text-green-500/70'}`}>
            Next: {formatXP(nextRank.min_xp)} XP
          </span>
        </div>
      )}
    </div>
  )
} 