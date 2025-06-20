'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { UserProfile } from '@/components/UserProfile'
import { useMissions } from '@/hooks/use-missions'
import { SimulationSection } from '@/components/simulation/SimulationSection'
import { InstructionList } from '@/components/simulation/InstructionList'
import { QuickTip } from '@/components/simulation/QuickTip'
import { DailyMissions } from '@/components/simulation/DailyMissions'
import { TRAINING_INSTRUCTIONS } from '@/data/Constants'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { missions, getMissionProgress, updateMissionProgress } = useMissions()

  // Redirect to landing if not logged in
  React.useEffect(() => {
    if (!user) {
      router.push('/')
    }
  }, [user, router])

  const handleStartSimulation = (simulationId: string) => {
    router.push('/rooms')
  }

  if (!user) {
    return null // Prevent flash of content during redirect
  }

  return (
    <main className="min-h-screen bg-black/95 py-8">
      <div className="container mx-auto px-4">
        {/* Welcome Section */}
        <div className="mb-8 bg-black/80 border border-green-500/30 rounded-lg p-6 backdrop-blur-md shadow-[0_0_15px_rgba(0,255,0,0.1)]">
          <h1 className="text-3xl font-bold text-green-400 mb-3">
            Welcome to The Matrix Training Program
          </h1>
          <p className="text-green-400/90 text-lg">
            Choose your simulation carefully. Each one presents unique challenges and opportunities for growth.
          </p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* User Profile Column */}
          <div className="col-span-12 lg:col-span-3">
            <div className="sticky top-8 space-y-6">
              <div className="bg-black/80 border border-green-500/30 rounded-lg backdrop-blur-md shadow-[0_0_15px_rgba(0,255,0,0.1)]">
                <UserProfile />
              </div>
              <div className="bg-black/80 border border-green-500/30 rounded-lg backdrop-blur-md shadow-[0_0_15px_rgba(0,255,0,0.1)]">
                <InstructionList 
                  title="Training Protocol"
                  instructions={TRAINING_INSTRUCTIONS}
                />
              </div>
              <div className="bg-black/80 border border-green-500/30 rounded-lg backdrop-blur-md shadow-[0_0_15px_rgba(0,255,0,0.1)]">
                <QuickTip 
                  title="Agent's Note"
                  content="Remember: The Matrix is everywhere. It is all around us. Even now, in this very room. You can see it when you look out your window or when you turn on your television. You can feel it when you go to work... when you go to church... when you pay your taxes."
                />
              </div>
            </div>
          </div>

          {/* Main Content Column */}
          <div className="col-span-12 lg:col-span-9">
            <div className="space-y-6">
              <div className="bg-black/80 border border-green-500/30 rounded-lg backdrop-blur-md shadow-[0_0_15px_rgba(0,255,0,0.1)]">
                <SimulationSection onStartSimulation={handleStartSimulation} />
              </div>
              <div className="bg-black/80 border border-green-500/30 rounded-lg backdrop-blur-md shadow-[0_0_15px_rgba(0,255,0,0.1)]">
                <DailyMissions 
                  missions={missions} 
                  getMissionProgress={getMissionProgress}
                  updateMissionProgress={updateMissionProgress}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
} 