'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import UserProfile from '@/components/UserProfile'
import { useMissions } from '@/hooks/use-missions'
import { SimulationSection } from '@/components/simulation/SimulationSection'
import { InstructionList } from '@/components/simulation/InstructionList'
import { QuickTip } from '@/components/simulation/QuickTip'
import { DailyMissions } from '@/components/simulation/DailyMissions'
import { TRAINING_INSTRUCTIONS } from '@/data/Constants'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { missions, getMissionProgress, updateMissionProgress } = useMissions()

  // Redirect to landing if not logged in
  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [user, router, authLoading])

  const handleStartSimulation = (simulationId: string) => {
    router.push('/rooms')
  }

  // Show loading skeleton while auth is being determined
  if (authLoading) {
    return (
      <div className="container mx-auto p-4 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Profile section loading skeleton */}
          <div className="flex flex-col items-center space-y-4 p-4 bg-black/20 rounded-lg backdrop-blur-sm border border-green-500/20">
            <div className="flex items-center space-x-4">
              <div className="h-20 w-20 rounded-full bg-green-500/10 animate-pulse" />
              <div className="space-y-2">
                <div className="h-6 w-32 bg-green-500/10 rounded animate-pulse" />
                <div className="h-4 w-24 bg-green-500/10 rounded animate-pulse" />
              </div>
            </div>
            <div className="w-full h-4 bg-green-500/10 rounded animate-pulse" />
            <div className="w-full h-10 bg-green-500/10 rounded animate-pulse" />
          </div>

          {/* Main content loading skeleton */}
          <div className="md:col-span-2 space-y-6">
            <div className="h-32 bg-black/20 rounded-lg backdrop-blur-sm border border-green-500/20 animate-pulse" />
            <div className="h-64 bg-black/20 rounded-lg backdrop-blur-sm border border-green-500/20 animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  // Don't render anything if user is not authenticated
  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <UserProfile />
        <div className="md:col-span-2 space-y-6">
          <SimulationSection onStartSimulation={handleStartSimulation} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <InstructionList title="Training Protocol" instructions={TRAINING_INSTRUCTIONS} />
              <QuickTip 
                title="Agent's Note"
                content="Remember: The Matrix is everywhere. It is all around us. Even now, in this very room. You can see it when you look out your window or when you turn on your television. You can feel it when you go to work... when you go to church... when you pay your taxes."
              />
            </div>
            <DailyMissions 
              missions={missions}
              getMissionProgress={getMissionProgress}
              updateMissionProgress={updateMissionProgress}
            />
          </div>
        </div>
      </div>
    </div>
  )
} 