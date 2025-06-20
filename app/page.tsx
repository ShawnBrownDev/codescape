'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, Sparkles, Clock, Users, Trophy, Loader2, Lock, Zap, Target } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { AuthForm } from '@/components/AuthForm'
import { UserProfile } from '@/components/UserProfile'
import { useMissions } from '@/hooks/use-missions'

export default function HomePage() {
  const { user, loading: authLoading, error: authError } = useAuth()
  const { 
    missions, 
    userXP, 
    loading: missionsLoading, 
    error: missionsError,
    getMissionProgress, 
    updateMissionProgress 
  } = useMissions()

  const loading = authLoading || missionsLoading

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-green-500" />
          <p className="text-green-500 font-mono">Initializing system...</p>
          <p className="text-green-500/50 text-sm font-mono">
            {authLoading ? 'Authenticating...' : 'Loading mission data...'}
          </p>
        </div>
      </div>
    )
  }

  if (authError || missionsError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md px-4">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-red-500 font-mono">System Error Detected</h2>
          <p className="text-red-400/70 font-mono">
            {authError || missionsError}
          </p>
          <Button 
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white font-mono mt-4"
          >
            Reinitialize System
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden font-mono">
      {/* Matrix Rain Effect */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="matrix-rain">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="matrix-column"
              style={{
                left: `${i * 2}%`,
                animationDelay: `${Math.random() * 2}s`,
                fontSize: `${Math.random() * 10 + 10}px`
              }}
            >
              {[...Array(30)].map((_, j) => (
                <span
                  key={j}
                  className="text-green-500"
                  style={{
                    animationDelay: `${Math.random() * 5}s`,
                    opacity: Math.random()
                  }}
                >
                  {String.fromCharCode(0x30A0 + Math.random() * 96)}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {!user ? (
          // Unauthenticated View - Matrix Landing
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
                <Card className="backdrop-blur-lg bg-black/50 border-green-500/20 shadow-2xl hover:shadow-green-500/20 transition-all duration-500 transform hover:-translate-y-2">
                  <CardHeader className="pb-4">
                    <div className="w-16 h-16 bg-green-500/20 border border-green-500/50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Target className="h-8 w-8 text-green-400" />
                    </div>
                    <CardTitle className="text-xl font-bold text-green-400">System Breaches</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-green-400/70 leading-relaxed">
                      Navigate through encrypted firewalls, exploit system vulnerabilities, 
                      and hack your way through advanced security protocols.
                    </p>
                  </CardContent>
                </Card>

                <Card className="backdrop-blur-lg bg-black/50 border-green-500/20 shadow-2xl hover:shadow-green-500/20 transition-all duration-500 transform hover:-translate-y-2">
                  <CardHeader className="pb-4">
                    <div className="w-16 h-16 bg-green-500/20 border border-green-500/50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="h-8 w-8 text-green-400" />
                    </div>
                    <CardTitle className="text-xl font-bold text-green-400">Time Manipulation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-green-400/70 leading-relaxed">
                      Bend the rules of time itself. Every millisecond counts in your 
                      mission to break free from the system&apos;s control.
                    </p>
                  </CardContent>
                </Card>

                <Card className="backdrop-blur-lg bg-black/50 border-green-500/20 shadow-2xl hover:shadow-green-500/20 transition-all duration-500 transform hover:-translate-y-2">
                  <CardHeader className="pb-4">
                    <div className="w-16 h-16 bg-green-500/20 border border-green-500/50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Trophy className="h-8 w-8 text-green-400" />
                    </div>
                    <CardTitle className="text-xl font-bold text-green-400">Reality Mastery</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-green-400/70 leading-relaxed">
                      Achieve enlightenment, unlock hidden abilities, and rise through 
                      the ranks to become a true master of the Matrix.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Stats Section */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16 max-w-4xl mx-auto">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-400 mb-2 glitch-text">5</div>
                  <div className="text-green-500/70 text-sm uppercase tracking-wide">Simulations</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-400 mb-2 glitch-text">50+</div>
                  <div className="text-green-500/70 text-sm uppercase tracking-wide">System Exploits</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-400 mb-2 glitch-text">1-5</div>
                  <div className="text-green-500/70 text-sm uppercase tracking-wide">Security Levels</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-400 mb-2 glitch-text">∞</div>
                  <div className="text-green-500/70 text-sm uppercase tracking-wide">Possibilities</div>
                </div>
              </div>

              {/* Authentication Form */}
              <div className="flex justify-center mb-16">
                <AuthForm />
              </div>

              {/* How to Play */}
              <div className="max-w-4xl mx-auto">
                <Card className="backdrop-blur-lg bg-black/50 border-green-500/20 shadow-2xl">
                  <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-bold text-green-400 mb-4 glitch-text">
                      System Access Protocol
                    </CardTitle>
                    <p className="text-green-400/70 text-lg">
                      Your journey to breaking free from the Matrix begins here
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div className="grid md:grid-cols-3 gap-8">
                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-green-500/20 border border-green-500/50 rounded-full flex items-center justify-center mx-auto">
                          <span className="text-2xl font-bold text-green-400">1</span>
                        </div>
                        <h3 className="text-xl font-semibold text-green-400">Choose Simulation</h3>
                        <p className="text-green-400/70">
                          Select your entry point into the Matrix, each with unique security systems and protocols.
                        </p>
                      </div>
                      
                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-green-500/20 border border-green-500/50 rounded-full flex items-center justify-center mx-auto">
                          <span className="text-2xl font-bold text-green-400">2</span>
                        </div>
                        <h3 className="text-xl font-semibold text-green-400">Hack the System</h3>
                        <p className="text-green-400/70">
                          Deploy exploits, decrypt encrypted messages, and manipulate the fabric of reality.
                        </p>
                      </div>
                      
                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-green-500/20 border border-green-500/50 rounded-full flex items-center justify-center mx-auto">
                          <span className="text-2xl font-bold text-green-400">3</span>
                        </div>
                        <h3 className="text-xl font-semibold text-green-400">Break Free</h3>
                        <p className="text-green-400/70">
                          Achieve enlightenment, master the system, and free your mind from digital constraints.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        ) : (
          // Authenticated View - Matrix Dashboard
          <div className="max-w-6xl mx-auto">
            {/* Welcome Header */}
            <div className="text-center mb-12 pt-16">
              <h1 className="text-6xl font-bold text-green-500 mb-6 glitch-text">
                Welcome Back, Operator
              </h1>
              <p className="text-xl text-green-400/70 mb-8">
                The system awaits. Choose your simulation and begin the infiltration.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 items-start">
              {/* User Profile */}
              <div className="lg:col-span-1">
                <UserProfile />
              </div>

              {/* Game Actions */}
              <div className="lg:col-span-2 space-y-6">
                {/* Daily Mission Objectives Card */}
                <Card className="backdrop-blur-lg bg-black/50 border-green-500/20 shadow-2xl">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-green-400 flex items-center">
                      <Target className="h-6 w-6 mr-3 text-green-400" />
                      Daily Mission Objectives
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <p className="text-green-400/70 leading-relaxed">
                      Agent, your daily objectives have been uploaded. Complete these missions to strengthen your abilities within the Matrix.
                    </p>
                    
                    <div className="space-y-4">
                      {missions.map(mission => {
                        const { progress, completed } = getMissionProgress(mission.id)
                        const progressPercentage = Math.min((progress / mission.required_count) * 100, 100)
                        
                        return (
                          <div key={mission.id} className="p-4 rounded-lg bg-black border-2 border-green-500/50 hover:border-green-400/70 transition-all duration-300">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-green-400 text-lg flex items-center">
                                {mission.title === 'Daily Training Protocol' && <Clock className="h-5 w-5 mr-2" />}
                                {mission.title === 'System Mastery' && <Zap className="h-5 w-5 mr-2" />}
                                {mission.title === 'Elite Operator Status' && <Trophy className="h-5 w-5 mr-2" />}
                                {mission.title}
                              </h4>
                              <div className="text-green-400 text-sm bg-green-500/10 px-3 py-1 rounded-full border border-green-500/30">
                                {mission.xp_reward} XP
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div className="flex items-center">
                                <div className="h-2 flex-1 bg-green-900 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-green-500 rounded-full transition-all duration-500"
                                    style={{ width: `${progressPercentage}%` }}
                                  />
                                </div>
                                <span className="ml-3 text-green-400 text-sm">
                                  {progress}/{mission.required_count}
                                </span>
                              </div>
                              <p className="text-green-500/70 text-sm">{mission.description}</p>
                              {completed && (
                                <div className="flex items-center text-green-400 text-sm mt-2">
                                  <span className="flex items-center">
                                    <Trophy className="h-4 w-4 mr-1" />
                                    Mission Completed
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-green-500/20">
                      <div className="flex items-center">
                        <div className="text-xl font-bold text-green-400">{userXP.total_xp}</div>
                        <div className="text-green-500/70 text-sm ml-2">Total XP</div>
                        <div className="text-green-400 text-sm ml-4 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/30">
                          Level {userXP.current_level}
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700 text-black font-bold border-2 border-green-400"
                      >
                        View All Missions
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Available Simulations */}
                <Card className="backdrop-blur-lg bg-black/50 border-green-500/20 shadow-2xl">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-green-400 flex items-center">
                      <Lock className="h-5 w-5 mr-3 text-green-400" />
                      Active Simulations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 rounded-lg bg-black border-2 border-green-500/50 hover:border-green-400/70 transition-all duration-300">
                        <div>
                          <h4 className="font-semibold text-green-400 text-lg">Training Program: Basic</h4>
                          <p className="text-green-500/70 mt-1">Security Level: <span className="text-green-400">⚡</span> Low • 30 min</p>
                        </div>
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700 text-black font-bold border-2 border-green-400"
                        >
                          Initialize
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 rounded-lg bg-black border-2 border-green-500/50 hover:border-green-400/70 transition-all duration-300">
                        <div>
                          <h4 className="font-semibold text-green-400 text-lg">The Architect&apos;s Maze</h4>
                          <p className="text-green-500/70 mt-1">Security Level: <span className="text-green-400">⚡⚡</span> Medium • 45 min</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-2 border-green-500 text-green-400 hover:bg-green-500/20"
                        >
                          Analyze
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .matrix-rain {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
        }

        .matrix-column {
          position: absolute;
          top: -20px;
          width: 1px;
          height: 100%;
          animation: matrix-rain 20s linear infinite;
        }

        .matrix-column span {
          display: block;
          width: 1px;
          height: 1.5em;
          animation: matrix-glow 2s linear infinite;
          animation-fill-mode: both;
        }

        @keyframes matrix-rain {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100vh);
          }
        }

        @keyframes matrix-glow {
          0%, 100% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
        }

        .glitch-text {
          text-shadow: 
            0.05em 0 0 rgba(255, 0, 0, .75),
            -0.025em -0.05em 0 rgba(0, 255, 0, .75),
            0.025em 0.05em 0 rgba(0, 0, 255, .75);
          animation: glitch 500ms infinite;
        }

        @keyframes glitch {
          0% {
            text-shadow: 
              0.05em 0 0 rgba(255, 0, 0, .75),
              -0.05em -0.025em 0 rgba(0, 255, 0, .75),
              -0.025em 0.05em 0 rgba(0, 0, 255, .75);
          }
          14% {
            text-shadow: 
              0.05em 0 0 rgba(255, 0, 0, .75),
              -0.05em -0.025em 0 rgba(0, 255, 0, .75),
              -0.025em 0.05em 0 rgba(0, 0, 255, .75);
          }
          15% {
            text-shadow: 
              -0.05em -0.025em 0 rgba(255, 0, 0, .75),
              0.025em 0.025em 0 rgba(0, 255, 0, .75),
              -0.05em -0.05em 0 rgba(0, 0, 255, .75);
          }
          49% {
            text-shadow: 
              -0.05em -0.025em 0 rgba(255, 0, 0, .75),
              0.025em 0.025em 0 rgba(0, 255, 0, .75),
              -0.05em -0.05em 0 rgba(0, 0, 255, .75);
          }
          50% {
            text-shadow: 
              0.025em 0.05em 0 rgba(255, 0, 0, .75),
              0.05em 0 0 rgba(0, 255, 0, .75),
              0 -0.05em 0 rgba(0, 0, 255, .75);
          }
          99% {
            text-shadow: 
              0.025em 0.05em 0 rgba(255, 0, 0, .75),
              0.05em 0 0 rgba(0, 255, 0, .75),
              0 -0.05em 0 rgba(0, 0, 255, .75);
          }
          100% {
            text-shadow: 
              -0.025em 0 0 rgba(255, 0, 0, .75),
              -0.025em -0.025em 0 rgba(0, 255, 0, .75),
              -0.025em -0.05em 0 rgba(0, 0, 255, .75);
          }
        }
      `}</style>
    </div>
  )
}