export interface PostReferenceItem {
  id: string
  title: string | null
  slug: string
  publishedAt: Date | string | null
  deletedAt: Date | string | null
  status: string
}

export interface PostReferencesBundle {
  incoming: PostReferenceItem[]
  outgoing: PostReferenceItem[]
}

export interface PostGraphNode {
  id: string
  title: string | null
  slug: string
  publishedAt: Date | string | null
}

export interface PostGraphEdge {
  source: string
  target: string
}

export interface PostGraphDto {
  nodes: PostGraphNode[]
  edges: PostGraphEdge[]
}

export interface PostPreviewMeta {
  id: string
  title: string | null
  slug: string
  plaintext: string | null
  publishedAt: Date | string | null
  wordCount: number | null
}
