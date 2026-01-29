'use client'

import { Suspense } from 'react'
import { useRoute } from '@/lib/route-context'
import { getLayoutForRoute, type LayoutKey } from '@/lib/routes'
import BareLayout from './BareLayout'
import PostEditorLayout from './PostEditorLayout'
import AdminSidebarLayout from './AdminSidebarLayout'

const LAYOUTS: Record<LayoutKey, React.ComponentType<{ children: React.ReactNode }>> = {
  bare: BareLayout,
  postEditor: PostEditorLayout,
  sidebar: AdminSidebarLayout,
}

function SidebarLayoutFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center text-muted-foreground">
      Loading...
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const route = useRoute()
  const layoutKey = getLayoutForRoute(route.name)
  const Layout = LAYOUTS[layoutKey]
  const content = <Layout>{children}</Layout>
  if (layoutKey === 'sidebar') {
    return <Suspense fallback={<SidebarLayoutFallback />}>{content}</Suspense>
  }
  return content
}
