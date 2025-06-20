'use client'

import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MatrixBackground } from '@/components/MatrixBackground'

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')

  return (
    <div className="min-h-screen bg-black relative overflow-hidden font-mono">
      <div className="opacity-40">
        <MatrixBackground />
      </div>
      <div className="relative z-10 container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <Card className="w-[400px] bg-black/80 border-red-500/30">
          <CardHeader>
            <CardTitle className="text-red-500">Authentication Error</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-red-400/80">
                <p className="mb-2">Error: {error}</p>
                <p className="text-sm">{error_description}</p>
              </div>
              <div className="pt-4">
                <Button 
                  onClick={() => router.push('/')}
                  className="w-full bg-red-900/20 hover:bg-red-900/40 text-red-400 border-red-500/30"
                >
                  Return to Login
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 