export const routes = {
  LOGIN: { path: '/login', name: 'login' as const },
  TAG: { path: (slug: string) => `/tag/${slug}`, name: 'tag' as const },
  VIVID_POSTS: { path: '/vivid/posts', name: 'vivid.posts' as const },
  VIVID_POSTS_DELETED: { path: '/vivid/posts/deleted', name: 'vivid.posts.deleted' as const },
  VIVID_EDITOR_POST_NEW: { path: '/vivid/editor/post/new', name: 'vivid.editor.post.new' as const },
  VIVID_EDITOR_POST_PREVIEW: { path: (id: string) => `/vivid/editor/post/${id}/preview`, name: 'vivid.editor.post.preview' as const },
  VIVID_EDITOR_POST: { path: (id: string) => `/vivid/editor/post/${id}`, name: 'vivid.editor.post' as const },
  VIVID_TAGS: { path: '/vivid/tags', name: 'vivid.tags' as const },
  VIVID_TAG_NEW: { path: '/vivid/tags/new', name: 'vivid.tags.new' as const },
  VIVID_TAG: { path: (slug: string) => `/vivid/tags/${slug}`, name: 'vivid.tags.tag' as const },
  VIVID_PROFILE: { path: '/vivid/profile', name: 'vivid.profile' as const },
  VIVID_LOADER: { path: '/vivid/loader', name: 'vivid.loader' as const },
  ADMIN: { path: '/', name: 'admin' as const },
} as const

export type RouteName = (typeof routes)[keyof typeof routes]['name']

export type LayoutKey = 'bare' | 'postEditor' | 'sidebar'

export const routeLayouts: { names: readonly RouteName[]; layout: LayoutKey }[] = [
  { names: [routes.LOGIN.name, routes.TAG.name, routes.VIVID_EDITOR_POST_PREVIEW.name, routes.VIVID_LOADER.name], layout: 'bare' },
  { names: [routes.VIVID_EDITOR_POST_NEW.name, routes.VIVID_EDITOR_POST.name], layout: 'postEditor' },
]

export function getLayoutForRoute(name: RouteName): LayoutKey {
  for (const group of routeLayouts) {
    if (group.names.includes(name)) return group.layout
  }
  return 'sidebar'
}

function matches(key: keyof typeof routes, p: string): boolean {
  switch (routes[key].name) {
    case routes.LOGIN.name:
      return p === '/login'
    case routes.TAG.name:
      return p.startsWith('/tag/')
    case routes.VIVID_POSTS.name:
      return p === '/vivid/posts'
    case routes.VIVID_POSTS_DELETED.name:
      return p === '/vivid/posts/deleted'
    case routes.VIVID_EDITOR_POST_NEW.name:
      return p === '/vivid/editor/post/new'
    case routes.VIVID_EDITOR_POST_PREVIEW.name: {
      if (!p.startsWith('/vivid/editor/post/') || !p.endsWith('/preview')) return false
      const mid = p.slice('/vivid/editor/post/'.length, -'/preview'.length)
      return mid.length > 0 && !mid.includes('/')
    }
    case routes.VIVID_EDITOR_POST.name: {
      if (!p.startsWith('/vivid/editor/post/') || p === '/vivid/editor/post/new' || p.includes('/preview')) return false
      const rest = p.slice('/vivid/editor/post/'.length)
      return rest.length > 0 && !rest.includes('/')
    }
    case routes.VIVID_TAGS.name:
      return p === '/vivid/tags'
    case routes.VIVID_TAG_NEW.name:
      return p === '/vivid/tags/new'
    case routes.VIVID_TAG.name:
      return p.startsWith('/vivid/tags/') && p !== '/vivid/tags/new'
    case routes.VIVID_PROFILE.name:
      return p === '/vivid/profile'
    case routes.VIVID_LOADER.name:
      return p === '/vivid/loader'
    case routes.ADMIN.name:
      return true
    default:
      return false
  }
}

export function getRouteName(path: string): RouteName {
  for (const key of Object.keys(routes) as (keyof typeof routes)[]) {
    if (matches(key, path)) return routes[key].name
  }
  return routes.ADMIN.name
}
