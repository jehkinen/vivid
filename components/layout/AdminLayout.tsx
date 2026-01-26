'use client'

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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const route = useRoute()
  const Layout = LAYOUTS[getLayoutForRoute(route.name)]
  return <Layout>{children}</Layout>
}
