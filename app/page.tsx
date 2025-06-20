'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { AuthForm } from '@/components/AuthForm'
import { useRouter } from 'next/navigation'
import { GAME_FEATURES, GAME_STATS } from '@/data/Constants'
import { MatrixBackground } from '@/components/MatrixBackground'

export default function LandingPage() {
  const { user } = useAuth()
  const router = useRouter()

  // Redirect to dashboard if already logged in
  React.useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  return (
    <div className="min-h-screen bg-black relative overflow-hidden font-mono">
      <MatrixBackground />
      <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-16 pt-16">
            <div className="inline-flex items-center bg-green-900/20 backdrop-blur-sm rounded-full px-6 py-3 mb-8 border border-green-500/30">
              <Lock className="h-5 w-5 text-green-400 mr-3" />
              <span className="text-sm font-medium text-green-400">
                System Access Required
                </span>
              </div>
              
            <h1 className="text-7xl font-bold text-green-500 mb-8 leading-tight glitch-text">
              Enter The Matrix
              </h1>
              
            <p className="text-xl text-green-400/80 mb-12 max-w-3xl mx-auto leading-relaxed font-mono">
              The Matrix has you. Follow the white rabbit. Challenge your reality with our immersive 
              escape simulations. Hack the system, decrypt the codes, free your mind.
              </p>

              {/* Game Features */}
              <div className="grid md:grid-cols-3 gap-8 mb-16 max-w-5xl mx-auto">
              {GAME_FEATURES.map((feature, index) => (
                <Card 
                  key={index}
                  className="backdrop-blur-lg bg-black/50 border-green-500/20 shadow-2xl hover:shadow-green-500/20 transition-all duration-500 transform hover:-translate-y-2"
                >
                  <CardHeader className="pb-4">
                    <div className="w-16 h-16 bg-green-500/20 border border-green-500/50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <feature.icon className="h-8 w-8 text-green-400" />
                    </div>
                    <CardTitle className="text-xl font-bold text-green-400">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-green-400/70 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
              </div>

              {/* Stats Section */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16 max-w-4xl mx-auto">
              {GAME_STATS.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl font-bold text-green-400 mb-2 glitch-text">
                    {stat.value}
                </div>
                  <div className="text-green-500/70 text-sm uppercase tracking-wide">
                    {stat.label}
                </div>
                </div>
              ))}
            </div>

            {/* Authentication Form */}
            <div className="flex justify-center mb-16">
              <AuthForm />
              </div>
            </div>
          </div>
      </div>
    </div>
  )
}