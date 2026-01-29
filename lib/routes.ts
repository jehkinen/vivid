const E = '/vivid/editor/post/'
const PREVIEW = '/preview'

export const routes = {
  LOGIN: { path: '/login', name: 'login' as const, match: (p: string) => p === '/login' },
  HOME: { path: '/', name: 'home' as const, match: (p: string) => p === '/' },
  POST_SLUG: {
    path: (slug: string) => `/${slug}`,
    name: 'post' as const,
    match: (p: string) => {
      if (p === '/' || p.startsWith('/tag/') || p.startsWith('/vivid/') || p.startsWith('/login')) return false
      const segments = p.split('/').filter(Boolean)
      return segments.length === 1
    },
  },
  TAG: { path: (slug: string) => `/tag/${slug}`, name: 'tag' as const, match: (p: string) => p.startsWith('/tag/') },
  VIVID_POSTS: { path: '/vivid/posts', name: 'vivid.posts' as const, match: (p: string) => p === '/vivid/posts' },
  VIVID_POSTS_DELETED: { path: '/vivid/posts/deleted', name: 'vivid.posts.deleted' as const, match: (p: string) => p === '/vivid/posts/deleted' },
  VIVID_EDITOR_POST_NEW: { path: '/vivid/editor/post/new', name: 'vivid.editor.post.new' as const, match: (p: string) => p === '/vivid/editor/post/new' },
  VIVID_EDITOR_POST_PREVIEW: {
    path: (id: string) => `/vivid/editor/post/${id}/preview`,
    name: 'vivid.editor.post.preview' as const,
    match: (p: string) => {
      if (!p.startsWith(E) || !p.endsWith(PREVIEW)) return false
      const mid = p.slice(E.length, -PREVIEW.length)
      return mid.length > 0 && !mid.includes('/')
    },
  },
  VIVID_EDITOR_POST: {
    path: (id: string) => `/vivid/editor/post/${id}`,
    name: 'vivid.editor.post' as const,
    match: (p: string) => {
      if (!p.startsWith(E) || p === '/vivid/editor/post/new' || p.includes(PREVIEW)) return false
      const rest = p.slice(E.length)
      return rest.length > 0 && !rest.includes('/')
    },
  },
  VIVID_TAGS: { path: '/vivid/tags', name: 'vivid.tags' as const, match: (p: string) => p === '/vivid/tags' },
  VIVID_TAG_NEW: { path: '/vivid/tags/new', name: 'vivid.tags.new' as const, match: (p: string) => p === '/vivid/tags/new' },
  VIVID_TAG: {
    path: (slug: string) => `/vivid/tags/${slug}`,
    name: 'vivid.tags.tag' as const,
    match: (p: string) => p.startsWith('/vivid/tags/') && p !== '/vivid/tags/new',
  },
  VIVID_PROFILE: { path: '/vivid/profile', name: 'vivid.profile' as const, match: (p: string) => p === '/vivid/profile' },
  VIVID_LOADER: { path: '/vivid/loader', name: 'vivid.loader' as const, match: (p: string) => p === '/vivid/loader' },
  ADMIN: { path: '/vivid', name: 'admin' as const, match: (p: string) => p.startsWith('/vivid') },
} as const

const ROUTE_MATCH_ORDER: (keyof typeof routes)[] = [
  'LOGIN',
  'HOME',
  'POST_SLUG',
  'TAG',
  'VIVID_POSTS',
  'VIVID_POSTS_DELETED',
  'VIVID_EDITOR_POST_NEW',
  'VIVID_EDITOR_POST_PREVIEW',
  'VIVID_EDITOR_POST',
  'VIVID_TAGS',
  'VIVID_TAG_NEW',
  'VIVID_TAG',
  'VIVID_PROFILE',
  'VIVID_LOADER',
  'ADMIN',
]

export type RouteName = (typeof routes)[keyof typeof routes]['name']

export type LayoutKey = 'bare' | 'postEditor' | 'sidebar'

export const routeLayouts: { names: readonly RouteName[]; layout: LayoutKey }[] = [
  { names: [routes.LOGIN.name, routes.HOME.name, routes.POST_SLUG.name, routes.TAG.name, routes.VIVID_EDITOR_POST_PREVIEW.name, routes.VIVID_LOADER.name], layout: 'bare' },
  { names: [routes.VIVID_EDITOR_POST_NEW.name, routes.VIVID_EDITOR_POST.name], layout: 'postEditor' },
]

export function getLayoutForRoute(name: RouteName): LayoutKey {
  for (const group of routeLayouts) {
    if (group.names.includes(name)) return group.layout
  }
  return 'sidebar'
}

export function getRouteName(path: string): RouteName {
  for (const key of ROUTE_MATCH_ORDER) {
    if (routes[key].match(path)) return routes[key].name
  }
  return routes.ADMIN.name
}
