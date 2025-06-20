'use client'

import RoomHandler from '@/rooms/RoomHandler'

export default function RoomsPage() {
  return (
    <main className="min-h-screen bg-black/95 py-8">
      <div className="container mx-auto px-4">
        <div className="bg-black/80 border border-green-500/30 rounded-lg p-6 backdrop-blur-md shadow-[0_0_15px_rgba(0,255,0,0.1)]">
          <RoomHandler />
        </div>
      </div>
    </main>
  )
} 