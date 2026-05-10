'use client'

import { useState, useEffect, useId } from 'react'
import { UserIcon, EyeIcon, EyeSlashIcon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authClient, type MeResponse } from '@/lib/api/authClient'
import { cn } from '@/lib/utils'

function PasswordRow({
  id,
  label,
  value,
  onChange,
  autoComplete,
  show,
  onToggleShow,
  hint,
  hintDestructive,
  minLength,
  ariaInvalid,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  autoComplete: string
  show: boolean
  onToggleShow: () => void
  hint?: string
  hintDestructive?: boolean
  minLength?: number
  ariaInvalid?: boolean
}) {
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
          required
          minLength={minLength}
          aria-invalid={ariaInvalid || undefined}
          className={cn(
            'h-11 pr-11 bg-background shadow-sm',
            'border-border/80 hover:border-border',
            'dark:bg-background/60'
          )}
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={show ? 'Hide password' : 'Show password'}
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

export default function ProfilePage() {
  const formTitleId = useId()
  const [user, setUser] = useState<MeResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState(false)
  const [pending, setPending] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    authClient
      .me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const confirmMismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setFormSuccess(false)
    if (newPassword !== confirmPassword) {
      setFormError('New passwords do not match')
      return
    }
    setPending(true)
    try {
      await authClient.changePassword({ currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setShowCurrent(false)
      setShowNew(false)
      setShowConfirm(false)
      setFormSuccess(true)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setPending(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-8">
        <div className="text-muted-foreground">Could not load profile.</div>
      </div>
    )
  }

  return (
    <div className="p-8 pb-16">
      <div className="max-w-xl space-y-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Your profile</h1>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-muted ring-1 ring-border">
              <UserIcon size={32} className="text-muted-foreground" />
            </div>
            <div className="min-w-0 flex flex-col gap-0.5">
              <span className="truncate text-base font-semibold text-foreground">{user.name}</span>
              <span className="truncate text-sm text-muted-foreground">{user.email}</span>
            </div>
          </div>
        </div>

        <section
          aria-labelledby={formTitleId}
          className="rounded-xl border border-border bg-card p-6 shadow-sm"
        >
          <header className="mb-6 space-y-1.5">
            <h2 id={formTitleId} className="text-lg font-semibold tracking-tight text-foreground">
              Change password
            </h2>
            <p className="text-sm text-muted-foreground">
              Use a strong password you do not reuse elsewhere.
            </p>
          </header>

          <form onSubmit={handleChangePassword} className="space-y-5">
            <PasswordRow
              id="current-password"
              label="Current password"
              value={currentPassword}
              onChange={setCurrentPassword}
              autoComplete="current-password"
              show={showCurrent}
              onToggleShow={() => setShowCurrent((s) => !s)}
            />
            <PasswordRow
              id="new-password"
              label="New password"
              value={newPassword}
              onChange={setNewPassword}
              autoComplete="new-password"
              show={showNew}
              onToggleShow={() => setShowNew((s) => !s)}
              minLength={8}
              hint="At least 8 characters."
            />
            <PasswordRow
              id="confirm-password"
              label="Confirm new password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
              show={showConfirm}
              onToggleShow={() => setShowConfirm((s) => !s)}
              ariaInvalid={confirmMismatch}
              hint={confirmMismatch ? 'Passwords must match.' : 'Re-enter your new password.'}
              hintDestructive={confirmMismatch}
            />

            {formError ? (
              <p className="text-sm text-destructive" role="alert">
                {formError}
              </p>
            ) : null}
            {formSuccess ? (
              <p className="text-sm font-medium text-green-600 dark:text-green-400" role="status">
                Password updated successfully.
              </p>
            ) : null}

            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
              <Button type="submit" disabled={pending || confirmMismatch} className="h-11 px-8 sm:w-auto">
                {pending ? 'Saving…' : 'Update password'}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
