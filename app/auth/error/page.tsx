import { Suspense } from 'react'
import { AuthErrorContent } from '@/app/auth/error/AuthErrorContent'

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthErrorContent />
    </Suspense>
  )
} 