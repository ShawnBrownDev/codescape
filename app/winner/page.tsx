'use client'

import { useSearchParams } from 'next/navigation'
import WinnerScreen from '@/components/simulation/WinnerScreen'

export default function WinnerPage() {
    const searchParams = useSearchParams()
    
    // Get data from URL parameters
    const totalXP = parseInt(searchParams.get('xp') || '0')
    const completedChallenges = JSON.parse(searchParams.get('challenges') || '[]')
    const rankTitle = searchParams.get('rankTitle') || 'Operator'
    const rankColor = searchParams.get('rankColor') || 'text-green-400'

    return (
        <div className="flex min-h-screen items-center justify-center bg-black">
            <WinnerScreen 
                totalXP={totalXP}
                completedChallenges={completedChallenges}
                rank={{
                    title: rankTitle,
                    color: rankColor
                }}
            />
        </div>
    )
} 