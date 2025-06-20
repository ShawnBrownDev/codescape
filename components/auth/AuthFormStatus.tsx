import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"

interface AuthFormStatusProps {
  error: string | null
  success: string | null
}

export function AuthFormStatus({ error, success }: AuthFormStatusProps) {
  if (!error && !success) return null

  return (
    <Alert variant={error ? "destructive" : "default"} className={error ? "border-red-500/50 bg-red-900/10" : "border-green-500/50 bg-green-900/10"}>
      {error ? (
        <AlertCircle className="h-4 w-4" />
      ) : (
        <CheckCircle2 className="h-4 w-4" />
      )}
      <AlertDescription>
        {error || success}
      </AlertDescription>
    </Alert>
  )
} 