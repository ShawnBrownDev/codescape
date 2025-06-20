import { MatrixBackground } from '@/components/MatrixBackground'

export default function RoomsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen">
      <div className="opacity-40">
        <MatrixBackground />
      </div>
      {children}
    </div>
  )
} 