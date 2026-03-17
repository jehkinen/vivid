'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { UserIcon, CaretDownIcon } from '@phosphor-icons/react'
import { routes } from '@/lib/routes'
import { useRoute } from '@/lib/route-context'
import { cn } from '@/lib/utils'
import { authClient } from '@/lib/api/authClient'

export default function AdminSidebarProfile() {
  const router = useRouter()
  const route = useRoute()
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)

  useEffect(() => {
    authClient
      .me()
      .then((data) => setUser(data))
      .catch(() => {})
  }, [])

  const handleSignOut = async () => {
    await authClient.logout()
    router.push('/login')
    router.refresh()
  }

  return (
    <Popover open={profileOpen} onOpenChange={setProfileOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex w-fit self-start items-center gap-2 rounded-md p-1.5 outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          aria-expanded={profileOpen}
          aria-label={profileOpen ? 'Close profile menu' : 'Open profile menu'}
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
            <UserIcon size={16} className="text-muted-foreground" />
          </div>
          <CaretDownIcon size={16} className={cn('shrink-0 transition-transform', profileOpen && 'rotate-180')} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        alignOffset={-13}
        sideOffset={8}
        className="w-[290px] max-w-[calc(100vw-30px)] p-0 rounded-lg duration-300 ease-out"
      >
        <div className="flex items-center gap-3 p-3 border-b border-border">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
            <UserIcon size={20} className="text-muted-foreground" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-sm font-medium">{user?.name ?? '–'}</span>
            <span className="truncate text-xs text-muted-foreground">{user?.email ?? '–'}</span>
          </div>
        </div>
        <div className="p-1">
          <Link
            href={routes.VIVID_PROFILE.path}
            onClick={() => setProfileOpen(false)}
            className={cn(
              'block w-full rounded-md px-2 py-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring',
              route.pathname === routes.VIVID_PROFILE.path && 'bg-accent text-accent-foreground'
            )}
          >
            Your profile
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="block w-full rounded-md px-2 py-2 text-sm text-left outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            Sign out
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

