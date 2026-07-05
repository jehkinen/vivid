import { z } from 'zod'
import {
  LIST_VISIBILITY,
  MEDIA_FILTER_TYPES,
  POST_SORT_OPTIONS,
  POST_VISIBILITY,
} from '@/shared/constants'
import { idParamSchema, slugParamSchema } from '@/lib/validators/schemas'

const optionalCommaSeparatedCuids = z.preprocess(
  (val) => {
    if (val === undefined || val === '') return undefined
    if (typeof val === 'string') return val.split(',').filter(Boolean)
    return val
  },
  z.array(idParamSchema).optional()
)

const optionalBooleanQuery = z
  .enum(['true', 'false'])
  .optional()
  .transform((value) => value === 'true')

const paginationLimit = (defaultValue: number, max: number) =>
  z.coerce.number().int().min(1).max(max).catch(defaultValue)

const paginationOffset = z.coerce.number().int().min(0).catch(0)

export const postsListQuerySchema = z.object({
  id: idParamSchema.optional(),
  slug: slugParamSchema.optional(),
  search: z.string().optional(),
  tagIds: optionalCommaSeparatedCuids,
  authorIds: optionalCommaSeparatedCuids,
  sort: z
    .enum([
      POST_SORT_OPTIONS.NEWEST,
      POST_SORT_OPTIONS.OLDEST,
      POST_SORT_OPTIONS.RECENTLY_UPDATED,
    ])
    .catch(POST_SORT_OPTIONS.NEWEST),
  includeDeleted: optionalBooleanQuery,
  status: z.string().optional(),
  visibility: z.enum([POST_VISIBILITY.PUBLIC, POST_VISIBILITY.PRIVATE]).optional(),
  limit: paginationLimit(20, 100),
  offset: paginationOffset,
})

export const publicPostsQuerySchema = z.object({
  limit: paginationLimit(10, 50),
  offset: paginationOffset,
  tagSlug: slugParamSchema.optional(),
  search: z.string().trim().optional(),
})

export const mediaLibraryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  perPage: z.coerce.number().int().min(1).max(200).catch(40),
  type: z
    .enum([
      MEDIA_FILTER_TYPES.ALL,
      MEDIA_FILTER_TYPES.IMAGE,
      MEDIA_FILTER_TYPES.VIDEO,
      MEDIA_FILTER_TYPES.AUDIO,
      MEDIA_FILTER_TYPES.DOCUMENT,
      MEDIA_FILTER_TYPES.UNUSED,
    ])
    .catch(MEDIA_FILTER_TYPES.ALL),
})

export const listsQuerySchema = z.object({
  visibility: z.enum([LIST_VISIBILITY.PUBLIC, LIST_VISIBILITY.PRIVATE]).optional(),
})

export const mediaDeleteQuerySchema = z.object({
  id: idParamSchema,
})

export const searchQueryParamsSchema = z
  .object({
    q: z.string().min(1),
  })
  .transform(({ q }) => ({ query: q }))

export const graphQuerySchema = z.object({
  postId: idParamSchema.optional(),
  depth: z.coerce
    .number()
    .int()
    .min(1)
    .max(2)
    .transform((v) => v as 1 | 2)
    .catch(1),
})

export const idRouteParamsSchema = z.object({ id: idParamSchema })
export const slugRouteParamsSchema = z.object({ slug: slugParamSchema })
export const listItemRouteParamsSchema = z.object({
  id: idParamSchema,
  itemId: idParamSchema,
})
