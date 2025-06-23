'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import RoomHandler from '@/rooms/RoomHandler'

export default function RoomsPage() {
    const router = useRouter()
    const { user, loading } = useAuth()

    useEffect(() => {
        if (!loading && !user) {
            router.replace('/auth/error?error=auth_required')
        }
    }, [user, loading, router])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="text-green-500 text-xl">Loading...</div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    return <RoomHandler />
} 