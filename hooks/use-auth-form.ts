import { useState } from 'react'
import { auth } from '@/lib/auth'
import { useRouter } from 'next/navigation'

interface AuthFormData {
  email: string
  password: string
  firstName: string
  lastName: string
}

interface AuthFormState {
  isLoading: boolean
  error: string | null
  success: string | null
}

export function useAuthForm() {
  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  })

  const [formState, setFormState] = useState<AuthFormState>({
    isLoading: false,
    error: null,
    success: null
  })

  const router = useRouter()

  const updateFormData = (field: keyof AuthFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const resetFormState = () => {
    setFormState({
      isLoading: false,
      error: null,
      success: null
    })
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormState({
      isLoading: true,
      error: null,
      success: null
    })

    try {
      console.log('Starting sign in process...');
      const { data, error } = await auth.signIn(formData.email, formData.password)
      
      if (error) {
        console.error('Sign in error:', error);
        let errorMessage = error.message;
        
        // Handle specific error cases
        if (error.message?.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please try again.';
        } else if (error.message?.includes('Email not confirmed')) {
          errorMessage = 'Please verify your email address before signing in.';
        }
        
        setFormState({
          isLoading: false,
          error: errorMessage,
          success: null
        })
      } else if (data?.user) {
        console.log('Sign in successful');
        setFormState({
          isLoading: false,
          error: null,
          success: 'Welcome back, escape artist!'
        })
        router.push('/dashboard')
      } else {
        console.error('No user data returned');
        setFormState({
          isLoading: false,
          error: 'Unable to sign in. Please try again.',
          success: null
        })
      }
    } catch (err) {
      console.error('Unexpected error during sign in:', err);
      setFormState({
        isLoading: false,
        error: err instanceof Error ? err.message : 'An unexpected error occurred',
        success: null
      })
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormState({
      isLoading: true,
      error: null,
      success: null
    })

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setFormState({
        isLoading: false,
        error: 'Please enter your first and last name',
        success: null
      })
      return
    }

    try {
      const { data, error } = await auth.signUp(
        formData.email, 
        formData.password,
        {
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim()
        }
      )
      if (error) {
        setFormState({
          isLoading: false,
          error: error.message,
          success: null
        })
      } else {
        setFormState({
          isLoading: false,
          error: null,
          success: 'Welcome to the escape room! You can now start playing.'
        })
      }
    } catch (err) {
      setFormState({
        isLoading: false,
        error: 'An unexpected error occurred',
        success: null
      })
    }
  }

  const handleGitHubSignIn = async () => {
    setFormState({
      isLoading: true,
      error: null,
      success: null
    })

    try {
      const { error } = await auth.signInWithGitHub()
      if (error) {
        setFormState({
          isLoading: false,
          error: error.message,
          success: null
        })
      }
    } catch (err) {
      setFormState({
        isLoading: false,
        error: 'An unexpected error occurred',
        success: null
      })
    }
  }

  return {
    formData,
    formState,
    updateFormData,
    resetFormState,
    handleSignIn,
    handleSignUp,
    handleGitHubSignIn
  }
} 