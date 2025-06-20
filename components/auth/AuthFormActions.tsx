import { Button } from "@/components/ui/button"
import { Github } from "lucide-react"

interface AuthFormActionsProps {
  isLoading: boolean
  isSignUp: boolean
  onSubmit: (e: React.FormEvent) => Promise<void>
  onGitHubSignIn: () => Promise<void>
  onToggleMode: () => void
}

export function AuthFormActions({
  isLoading,
  isSignUp,
  onSubmit,
  onGitHubSignIn,
  onToggleMode
}: AuthFormActionsProps) {
  return (
    <div className="grid gap-4">
      <Button 
        type="submit"
        onClick={onSubmit}
        disabled={isLoading}
        className="bg-green-600 hover:bg-green-700"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Processing...
          </div>
        ) : (
          isSignUp ? "Join the Resistance" : "Enter the Matrix"
        )}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-green-500/30" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-black px-2 text-green-500">or</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={onGitHubSignIn}
        disabled={isLoading}
        className="border-green-500/30 hover:bg-green-900/20"
      >
        <Github className="mr-2 h-4 w-4" />
        GitHub
      </Button>

      <Button
        type="button"
        variant="link"
        onClick={onToggleMode}
        disabled={isLoading}
        className="text-green-500 hover:text-green-400"
      >
        {isSignUp ? "Already have an access code?" : "Need an access code?"}
      </Button>
    </div>
  )
} 