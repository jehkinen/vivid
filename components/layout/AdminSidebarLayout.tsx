'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarProvider,
  SidebarInset,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import {
  PencilLineIcon,
  TagIcon,
  ListChecksIcon,
  MagnifyingGlassIcon,
  BookOpenIcon,
  CaretDownIcon,
  PlusIcon,
} from '@phosphor-icons/react'
import { useSearchParams } from 'next/navigation'
import { GlobalSearch } from '@/components/search/GlobalSearch'
import { PublicLogo } from '@/components/public/PublicLogo'
import { PostSettingsProvider, usePostSettings } from '@/components/providers/PostSettingsProvider'
import { routes } from '@/lib/routes'
import { useRoute } from '@/components/providers/RouteProvider'
import { ImageIcon as MediaIcon } from '@phosphor-icons/react'
const AdminSidebarProfile = dynamic(() => import('./AdminSidebarProfile').then(m => ({ default: m.AdminSidebarProfile })), { ssr: false })

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
  { title: 'Lists', url: routes.VIVID_LISTS.path, icon: ListChecksIcon },
  { title: 'Media', url: routes.VIVID_MEDIA.path, icon: MediaIcon },
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

export function AdminSidebarLayout({ children }: { children: React.ReactNode }) {
  const route = useRoute()
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
          <AdminSidebarProfile />
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
