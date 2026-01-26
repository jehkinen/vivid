import { z } from 'zod'
import {
  POST_STATUS,
  POST_TYPE,
  POST_VISIBILITY,
  MEDIABLE_TYPES,
  SLUG_MAX_LENGTH,
  ALLOWED_IMAGE_MIME_TYPES,
} from '@/shared/constants'

const cuidSchema = z.string().length(24).regex(/^[a-z0-9]+$/)

const slugSchema = z
  .string()
  .min(1)
  .max(SLUG_MAX_LENGTH)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be URL-safe (lowercase letters, numbers, and hyphens)')

const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color (#RRGGBB)')

const jsonStringSchema = z.string().refine(
  (val) => {
    try {
      JSON.parse(val)
      return true
    } catch {
      return false
    }
  },
  { message: 'Must be valid JSON' }
)

export const postCreateSchema = z.object({
  title: z.string().max(2000).optional(),
  slug: slugSchema,
  lexical: z.union([jsonStringSchema, z.null()]).optional(),
  plaintext: z.string().optional(),
  status: z.enum([POST_STATUS.DRAFT, POST_STATUS.PUBLISHED]),
  visibility: z.enum([POST_VISIBILITY.PUBLIC, POST_VISIBILITY.PRIVATE]).optional(),
  publishedAt: z.string().optional().nullable(),
  tagIds: z.array(cuidSchema).optional(),
})

export const postUpdateSchema = z.object({
  title: z.string().max(2000).optional(),
  slug: slugSchema.optional(),
  lexical: z.union([jsonStringSchema, z.null()]).optional(),
  plaintext: z.string().optional(),
  status: z.enum([POST_STATUS.DRAFT, POST_STATUS.PUBLISHED]).optional(),
  visibility: z.enum([POST_VISIBILITY.PUBLIC, POST_VISIBILITY.PRIVATE]).optional(),
  publishedAt: z.string().optional().nullable(),
  featuredMediaId: z.union([cuidSchema, z.null()]).optional(),
  tagIds: z.array(cuidSchema).optional(),
})

export const tagCreateSchema = z.object({
  name: z.string().min(1).max(255),
  color: hexColorSchema,
  slug: slugSchema,
})

export const tagUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  color: hexColorSchema.optional(),
  slug: slugSchema.optional(),
})

export const searchQuerySchema = z.object({
  query: z.string().min(1),
})

export const mediaUploadSchema = z.object({
  mediableType: z.enum([MEDIABLE_TYPES.POST, MEDIABLE_TYPES.TAG]),
  mediableId: cuidSchema,
  collection: z.string().optional(),
  replaceMediaId: cuidSchema.optional(),
})

export const mediaGetSchema = z.object({
  mediableType: z.enum([MEDIABLE_TYPES.POST, MEDIABLE_TYPES.TAG]),
  mediableId: cuidSchema,
  collection: z.string().optional(),
  conversion: z.string().optional(),
})

export const idParamSchema = cuidSchema

export const mediaUrlsSchema = z.object({ ids: z.array(idParamSchema).max(100) })

export const slugParamSchema = slugSchema

export function validateRequest<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: { field: string; message: string }[] } {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  const errors = result.error.issues.map((err) => ({
    field: err.path.join('.') || 'root',
    message: err.message,
  }))

  return { success: false, errors }
}