import { Button } from "@/components/ui/button"

interface AuthFormActionsProps {
  isLoading: boolean
  isSignUp: boolean
  onSubmit: (e: React.FormEvent) => Promise<void>
  onToggleMode: () => void
}

export function AuthFormActions({
  isLoading,
  isSignUp,
  onSubmit,
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