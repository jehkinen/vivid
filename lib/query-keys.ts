export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    me: () => [...queryKeys.auth.all, 'me'] as const,
  },
  posts: {
    all: ['posts'] as const,
    list: (params?: unknown) => [...queryKeys.posts.all, params] as const,
    infinite: (params?: unknown) => [...queryKeys.posts.all, 'infinite', params] as const,
    deleted: () => [...queryKeys.posts.all, 'deleted'] as const,
    detail: (id: string) => ['post', id] as const,
    references: (id: string) => ['post', id, 'references'] as const,
  },
  tags: {
    all: ['tags'] as const,
    detail: (slug: string) => ['tag', slug] as const,
  },
  lists: {
    all: ['lists'] as const,
    list: (visibility?: string) => [...queryKeys.lists.all, visibility] as const,
    detail: (id: string) => ['list', id] as const,
  },
  media: {
    all: ['media'] as const,
    list: (params: { page?: number; perPage?: number; type?: string }) =>
      [...queryKeys.media.all, params] as const,
  },
  search: {
    admin: (query: string) => ['search', query] as const,
    public: (query: string) => ['publicSearch', query] as const,
    publicTags: (query: string) => ['publicTagsSearch', query] as const,
  },
  graph: {
    all: ['graph'] as const,
    view: (postId?: string, depth?: number) =>
      [...queryKeys.graph.all, postId ?? 'all', depth ?? 1] as const,
  },
} as const
