'use client'

import { useState, useEffect, useId } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { UserIcon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { PasswordField } from '@/components/auth/PasswordField'
import { authClient, type MeResponse } from '@/lib/api/authClient'
import { queryKeys } from '@/lib/query-keys'
import { cn } from '@/lib/utils'

export default function ProfilePage() {
  const queryClient = useQueryClient()
  const formTitleId = useId()
  const openAiTitleId = useId()
  const [user, setUser] = useState<MeResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [openAiKey, setOpenAiKey] = useState('')
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState(false)
  const [openAiError, setOpenAiError] = useState('')
  const [openAiSuccessPulse, setOpenAiSuccessPulse] = useState(false)
  const [pending, setPending] = useState(false)
  const [openAiPending, setOpenAiPending] = useState(false)

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
      setFormSuccess(true)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setPending(false)
    }
  }

  const handleSaveOpenAiKey = async (e: React.FormEvent) => {
    e.preventDefault()
    setOpenAiError('')
    setOpenAiPending(true)
    try {
      const result = await authClient.saveOpenAiKey(openAiKey)
      setUser((current) => (current ? { ...current, openAi: result.openAi } : current))
      setOpenAiKey('')
      setOpenAiSuccessPulse(true)
      window.setTimeout(() => setOpenAiSuccessPulse(false), 1200)
      toast.success('OpenAI linked')
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() })
    } catch (err: unknown) {
      setOpenAiError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setOpenAiPending(false)
    }
  }

  const handleRemoveOpenAiKey = async () => {
    setOpenAiError('')
    setOpenAiPending(true)
    try {
      const result = await authClient.deleteOpenAiKey()
      setUser((current) => (current ? { ...current, openAi: result.openAi } : current))
      setOpenAiKey('')
      toast.success('OpenAI key removed')
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() })
    } catch (err: unknown) {
      setOpenAiError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setOpenAiPending(false)
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
          aria-labelledby={openAiTitleId}
          className="rounded-xl border border-border bg-card p-6 shadow-sm"
        >
          <header className="mb-6 space-y-1.5">
            <h2 id={openAiTitleId} className="text-lg font-semibold tracking-tight text-foreground">
              Integrations
            </h2>
            <p className="text-sm text-muted-foreground">Connect OpenAI to generate cover images from your posts.</p>
          </header>

          <div className="mb-5 flex items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium',
                user.openAi?.configured
                  ? 'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400'
                  : 'border-border/70 bg-muted/25 text-muted-foreground',
                openAiSuccessPulse && 'animate-pulse'
              )}
            >
              {user.openAi?.configured
                ? `Connected${user.openAi.hint ? ` · ${user.openAi.hint}` : ''}`
                : 'Not connected'}
            </span>
          </div>

          <form onSubmit={handleSaveOpenAiKey} className="space-y-5">
            <PasswordField
              id="openai-api-key"
              label="OpenAI API key"
              value={openAiKey}
              onChange={setOpenAiKey}
              autoComplete="off"
              placeholder={user.openAi?.configured ? 'Enter a new key to replace' : 'sk-…'}
              hint="Encrypted on the server. It will not be shown again after saving."
            />

            {openAiError ? (
              <p className="text-sm text-destructive" role="alert">
                {openAiError}
              </p>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button type="submit" disabled={openAiPending || !openAiKey.trim()} className="h-11 px-8 sm:w-auto">
                {openAiPending ? 'Saving…' : 'Save key'}
              </Button>
              {user.openAi?.configured ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={openAiPending}
                  onClick={handleRemoveOpenAiKey}
                  className="h-11 px-8 sm:w-auto"
                >
                  Remove key
                </Button>
              ) : null}
            </div>
          </form>
        </section>

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
            <PasswordField
              id="current-password"
              label="Current password"
              value={currentPassword}
              onChange={setCurrentPassword}
              autoComplete="current-password"
            />
            <PasswordField
              id="new-password"
              label="New password"
              value={newPassword}
              onChange={setNewPassword}
              autoComplete="new-password"
              minLength={8}
              hint="At least 8 characters."
            />
            <PasswordField
              id="confirm-password"
              label="Confirm new password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
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
