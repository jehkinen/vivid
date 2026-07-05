export interface TagDto {
  id: string
  name: string
  slug: string
  color: string | null
  description: string | null
  postCount?: number
}

export interface MergeTagsResult {
  mergedPostCount: number
  targetTagSlug: string
}
