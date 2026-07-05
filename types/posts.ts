import type { PostEditorFeaturedMedia } from './post-editor'

export type { PostEditorFeaturedMedia } from './post-editor'

export interface PostSummary {
  id: string
  title: string
  slug: string
  status: string
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

export type PostWithListRelations = PostSummary & {
  publishedAt?: string | null
  plaintext?: string | null
  visibility?: string | null
  authors?: Array<{ author: { name?: string | null } }>
  tags?: Array<{ tag: { id: string; slug: string; name: string; color?: string | null } }>
  featuredMedia?: { url?: string } | null
}

export interface PostListResponse {
  posts: PostWithListRelations[]
  hasMore: boolean
}

export interface PostDetail {
  id: string
  title?: string | null
  slug?: string
  lexical?: string | null
  plaintext?: string | null
  status?: string | null
  visibility?: string | null
  publishedAt?: string | null
  tags?: Array<{ tag: { id: string } }>
  featuredMedia?: PostEditorFeaturedMedia | null
}
