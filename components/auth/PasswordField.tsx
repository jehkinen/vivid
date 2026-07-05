'use client'

import { useState } from 'react'
import { EyeIcon, EyeSlashIcon } from '@phosphor-icons/react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type PasswordFieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete?: string
  hint?: string
  hintDestructive?: boolean
  minLength?: number
  ariaInvalid?: boolean
  placeholder?: string
}

export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  hint,
  hintDestructive,
  minLength,
  ariaInvalid,
  placeholder,
}: PasswordFieldProps) {
  const [show, setShow] = useState(false)

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium leading-none text-foreground">
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required={false}
          minLength={minLength}
          aria-invalid={ariaInvalid || undefined}
          placeholder={placeholder}
          className={cn(
            'h-11 pr-11 bg-background shadow-sm',
            'border-border/80 hover:border-border',
            'dark:bg-background/60'
          )}
        />
        <button
          type="button"
          onClick={() => setShow((current) => !current)}
          className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={show ? 'Hide value' : 'Show value'}
        >
          {show ? <EyeSlashIcon size={18} weight="regular" /> : <EyeIcon size={18} weight="regular" />}
        </button>
      </div>
      {hint ? (
        <p
          className={cn(
            'text-xs leading-relaxed',
            hintDestructive ? 'text-destructive' : 'text-muted-foreground'
          )}
        >
          {hint}
        </p>
      ) : null}
    </div>
  )
}
