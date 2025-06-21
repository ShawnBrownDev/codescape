'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, Loader2, Eye, EyeOff, Lock, User } from 'lucide-react'
import { auth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { useAuthForm } from "@/hooks/use-auth-form"
import { AuthFormInput } from "./auth/AuthFormInput"
import { AuthFormStatus } from "./auth/AuthFormStatus"
import { AuthFormActions } from "./auth/AuthFormActions"

export function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false)
  const {
    formData,
    formState,
    updateFormData,
    resetFormState,
    handleSignIn,
    handleSignUp,
  } = useAuthForm()

  const toggleMode = () => {
    setIsSignUp(!isSignUp)
    resetFormState()
  }

  return (
    <Card className="w-[350px] bg-black/80 border-green-500/30">
      <CardHeader>
        <CardTitle className="text-green-500">
          {isSignUp ? "Create Access Code" : "Enter Access Code"}
          </CardTitle>
        <CardDescription className="text-green-500/70">
          {isSignUp
            ? "Join the resistance against the machines"
            : "Return to the digital battlefield"}
          </CardDescription>
        </CardHeader>
      <CardContent>
        <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="grid gap-4">
          {isSignUp && (
            <>
              <AuthFormInput
                id="firstName"
                label="First Name"
                type="text"
                value={formData.firstName}
                onChange={(value) => updateFormData("firstName", value)}
                placeholder="Neo"
                autoComplete="given-name"
              />
              <AuthFormInput
                id="lastName"
                label="Last Name"
                type="text"
                value={formData.lastName}
                onChange={(value) => updateFormData("lastName", value)}
                placeholder="Anderson"
                autoComplete="family-name"
              />
            </>
          )}

          <AuthFormInput
            id="email"
            label="Email"
            type="email"
            value={formData.email}
            onChange={(value) => updateFormData("email", value)}
            placeholder="neo@matrix.com"
            autoComplete="email"
          />

          <AuthFormInput
            id="password"
            label="Password"
            type="password"
            value={formData.password}
            onChange={(value) => updateFormData("password", value)}
            placeholder="••••••••"
            autoComplete={isSignUp ? "new-password" : "current-password"}
          />

          <AuthFormStatus
            error={formState.error}
            success={formState.success}
          />

          <AuthFormActions
            isLoading={formState.isLoading}
            isSignUp={isSignUp}
            onSubmit={isSignUp ? handleSignUp : handleSignIn}
            onToggleMode={toggleMode}
          />
        </form>
      </CardContent>
    </Card>
  )
}