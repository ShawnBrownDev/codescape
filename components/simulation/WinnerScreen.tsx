'use client'

import { useEffect, useState } from 'react'
import { Trophy, Star, ArrowRight, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { MatrixBackground } from '@/components/MatrixBackground'

interface WinnerScreenProps {
  totalXP: number
  completedChallenges: number[]
  rank: {
    title: string
    color: string
  }
  onContinueTraining?: () => void
}

export default function WinnerScreen({ totalXP, completedChallenges, rank, onContinueTraining }: WinnerScreenProps) {
  const router = useRouter()
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    // Animate content in after a short delay
    const timer = setTimeout(() => setShowContent(true), 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <MatrixBackground />
      
      <div className={`relative max-w-2xl w-full mx-4 bg-black/80 border border-green-500/30 rounded-lg p-8 backdrop-blur-sm shadow-[0_0_15px_rgba(0,255,0,0.1)] transform transition-all duration-1000 ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <Trophy className="w-20 h-20 text-yellow-400" />
          </div>
          
          <h1 className="text-4xl font-bold text-green-400">
            Congratulations!
          </h1>
          
          <p className="text-xl text-green-400/80">
            You have successfully escaped the Matrix simulation!
          </p>

          <div className="flex items-center justify-center gap-4 py-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400">
                {totalXP}
              </div>
              <div className="text-sm text-green-400/60">
                Total XP
              </div>
            </div>

            <div className="h-12 w-px bg-green-500/20" />

            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400">
                {completedChallenges.length}
              </div>
              <div className="text-sm text-green-400/60">
                Challenges Completed
              </div>
            </div>

            <div className="h-12 w-px bg-green-500/20" />

            <div className="text-center">
              <div className={`text-xl font-bold ${rank.color}`}>
                {rank.title}
              </div>
              <div className="text-sm text-green-400/60">
                Current Rank
              </div>
            </div>
          </div>

          <div className="pt-6 flex justify-center gap-4">
            <Button
              onClick={() => router.push('/dashboard')}
              className="bg-green-900/20 hover:bg-green-900/40 text-green-400 border-green-500/30"
            >
              <Star className="w-4 h-4 mr-2" />
              Return to Dashboard
            </Button>
            
            <Button
              onClick={onContinueTraining}
              className="bg-green-900/20 hover:bg-green-900/40 text-green-400 border-green-500/30"
            >
              <Play className="w-4 h-4 mr-2" />
              Continue Training
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 