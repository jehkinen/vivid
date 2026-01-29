'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarProvider,
  SidebarInset,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import {
  PencilLineIcon,
  TagIcon,
  MagnifyingGlassIcon,
  BookOpenIcon,
  UserIcon,
  CaretDownIcon,
  PlusIcon,
} from '@phosphor-icons/react'
import { useRouter, useSearchParams } from 'next/navigation'
import GlobalSearch from '@/components/search/GlobalSearch'
import PublicLogo from '@/components/public/PublicLogo'
import { PostSettingsProvider, usePostSettings } from '@/lib/post-settings-context'
import { routes } from '@/lib/routes'
import { useRoute } from '@/lib/route-context'

const menuItems = [
  {
    title: 'Posts',
    url: routes.VIVID_POSTS.path,
    icon: PencilLineIcon,
    subItems: [
      { title: 'Draft', url: `${routes.VIVID_POSTS.path}?status=draft` },
      { title: 'Published', url: `${routes.VIVID_POSTS.path}?status=published` },
      { title: 'Deleted', url: `${routes.VIVID_POSTS.path}?status=deleted` },
    ],
  },
  { title: 'Tags', url: routes.VIVID_TAGS.path, icon: TagIcon },
]

function AdminHeaderRight() {
  const { open, setOpen } = usePostSettings()
  return (
    <button
      onClick={() => setOpen(!open)}
      className={`flex items-center justify-center w-9 h-9 rounded-md border transition-colors ${
        open ? 'bg-accent text-accent-foreground border-border' : 'text-muted-foreground hover:text-foreground border-border'
      }`}
      aria-label={open ? 'Close post settings' : 'Open post settings'}
    >
      <BookOpenIcon size={16} />
    </button>
  )
}

function AdminInsetContent({ children }: { children: React.ReactNode }) {
  const { isPostEditor } = usePostSettings()
  return (
    <div className="flex flex-col h-screen">
      {isPostEditor && (
        <header className="h-16 flex items-center justify-between px-6 border-b shrink-0">
          <div className="flex-1" />
          <AdminHeaderRight />
        </header>
      )}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}

function SidebarProfile() {
  const router = useRouter()
  const route = useRoute()
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

export default function AdminSidebarLayout({ children }: { children: React.ReactNode }) {
  const route = useRoute()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchOpen, setSearchOpen] = useState(false)
  const [postsExpanded, setPostsExpanded] = useState(true)
  const [isHoveringPostsIcon, setIsHoveringPostsIcon] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
      if (e.key === 'Escape') {
        setSearchOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent>
          <SidebarGroup className="pt-12">
            <SidebarGroupLabel className="px-2 pt-0 pb-6 mb-4">
              <div className="flex w-full items-center justify-between gap-2">
                <PublicLogo />
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search (⌘K)"
                  className="flex shrink-0 cursor-pointer items-center gap-1 rounded-md px-1.5 py-1.5 text-sidebar-foreground/80 outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <MagnifyingGlassIcon size={18} />
                  <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-sidebar-border bg-sidebar-accent px-1 font-mono text-[10px] font-medium opacity-80">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                </button>
              </div>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => {
                  const Icon = item.icon
                  const isActive = route.pathname === item.url || route.pathname.startsWith(item.url + '/')
                  const hasSubItems = 'subItems' in item && item.subItems
                  const isPosts = item.url === routes.VIVID_POSTS.path
                  const showChevron = isPosts && isHoveringPostsIcon
                  
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild={false}
                        isActive={isActive}
                        className={isPosts ? "!pr-3" : ""}
                      >
                        {isPosts ? (
                          <div className="flex items-center justify-between w-full gap-2">
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              {showChevron ? (
                                <div
                                  role="button"
                                  tabIndex={0}
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setPostsExpanded(!postsExpanded)
                                  }}
                                  onMouseEnter={() => setIsHoveringPostsIcon(true)}
                                  onMouseLeave={() => setIsHoveringPostsIcon(false)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      setPostsExpanded(!postsExpanded)
                                    }
                                  }}
                                  className="flex items-center justify-center shrink-0 w-4 h-4 outline-none cursor-pointer"
                                >
                                  <CaretDownIcon 
                                    size={16} 
                                    className={cn('transition-transform', postsExpanded && 'rotate-180')}
                                  />
                                </div>
                              ) : (
                                <div
                                  onMouseEnter={() => setIsHoveringPostsIcon(true)}
                                  onMouseLeave={() => setIsHoveringPostsIcon(false)}
                                  className="shrink-0"
                                >
                                  <Icon size={16} />
                                </div>
                              )}
                              <Link 
                                href={item.url}
                                onClick={(e) => {
                                  e.stopPropagation()
                                }}
                                className="flex-1 min-w-0 flex items-center h-full"
                              >
                                <span>{item.title}</span>
                              </Link>
                            </div>
                            <Link
                              href={routes.VIVID_EDITOR_POST_NEW.path}
                              onClick={(e) => {
                                e.stopPropagation()
                              }}
                              className="flex items-center justify-center shrink-0 w-7 h-7 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors z-10 relative"
                            >
                              <PlusIcon size={20} />
                            </Link>
                          </div>
                        ) : (
                          <Link href={item.url} className="flex items-center gap-2.5 w-full">
                            <Icon size={16} />
                            <span>{item.title}</span>
                          </Link>
                        )}
                      </SidebarMenuButton>
                      {hasSubItems && postsExpanded && (
                        <SidebarMenuSub>
                          {item.subItems.map((subItem) => {
                            const statusParam = subItem.url.split('status=')[1]
                            const subIsActive = route.pathname === item.url && searchParams.get('status') === statusParam
                            return (
                              <SidebarMenuSubItem key={subItem.url}>
                                <SidebarMenuSubButton asChild isActive={subIsActive}>
                                  <Link href={subItem.url}>
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            )
                          })}
                        </SidebarMenuSub>
                      )}
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarSeparator />
        <SidebarFooter>
          <SidebarProfile />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <PostSettingsProvider>
          <AdminInsetContent>{children}</AdminInsetContent>
        </PostSettingsProvider>
      </SidebarInset>
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </SidebarProvider>
  )
}
