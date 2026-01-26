'use client'

import { createContext, useContext, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { getRouteName, routes, type RouteName } from '@/lib/routes'

export type { RouteName }

type RouteState = {
  pathname: string
  name: RouteName
}

const RouteContext = createContext<RouteState | null>(null)

export function RouteProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ''
  const value = useMemo(() => ({
    pathname,
    name: getRouteName(pathname),
  }), [pathname])
  return (
    <RouteContext.Provider value={value}>
      {children}
    </RouteContext.Provider>
  )
}

export function useRoute(): RouteState {
  const ctx = useContext(RouteContext)
  return ctx ?? { pathname: '', name: routes.ADMIN.name }
}
