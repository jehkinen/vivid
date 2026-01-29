'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { UserIcon, CaretDownIcon } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { routes } from '@/lib/routes'

export default function PublicHeaderProfile() {
  const router = useRouter()
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then(setUser)
      .catch(() => {})
  }, [])

  const handleSignOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  if (!user) return null

  return (
    <Popover open={profileOpen} onOpenChange={setProfileOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-md p-1.5 outline-none transition-colors hover:bg-muted hover:text-foreground text-muted-foreground"
          aria-expanded={profileOpen}
          aria-label={profileOpen ? 'Закрыть меню профиля' : 'Открыть меню профиля'}
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
            <UserIcon size={16} className="text-muted-foreground" />
          </div>
          <CaretDownIcon size={16} className={cn('shrink-0 transition-transform duration-200', profileOpen && 'rotate-180')} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        sideOffset={8}
        className="w-[290px] max-w-[calc(100vw-30px)] p-0 rounded-lg duration-200 ease-out"
      >
        {user && (
          <div className="flex items-center gap-3 p-3 border-b border-border">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
              <UserIcon size={20} className="text-muted-foreground" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-sm font-medium">{user.name ?? '–'}</span>
              <span className="truncate text-xs text-muted-foreground">{user.email ?? '–'}</span>
            </div>
          </div>
        )}
        <div className="p-1">
          <Link
            href={routes.VIVID_POSTS.path}
            onClick={() => setProfileOpen(false)}
            className="block w-full rounded-md px-2 py-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            Управление
          </Link>
          {user && (
            <>
              <Link
                href={routes.VIVID_PROFILE.path}
                onClick={() => setProfileOpen(false)}
                className="block w-full rounded-md px-2 py-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                Профиль
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="block w-full rounded-md px-2 py-2 text-sm text-left outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                Выйти
              </button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
