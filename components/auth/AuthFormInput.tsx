import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface AuthFormInputProps {
  id: string
  label: string
  type: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  placeholder?: string
  autoComplete?: string
}

export function AuthFormInput({
  id,
  label,
  type,
  value,
  onChange,
  required = true,
  placeholder,
  autoComplete
}: AuthFormInputProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="bg-black/50 border-green-500/50 text-green-500"
      />
    </div>
  )
} 