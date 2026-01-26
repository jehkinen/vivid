export const POST_SORT_OPTIONS = {
  NEWEST: 'newest',
  OLDEST: 'oldest',
  RECENTLY_UPDATED: 'recently-updated',
} as const

export type PostSortOption = typeof POST_SORT_OPTIONS[keyof typeof POST_SORT_OPTIONS]

export const POST_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
} as const

export type PostStatus = typeof POST_STATUS[keyof typeof POST_STATUS]

export const TAG_VISIBILITY = {
  PUBLIC: 'public',
  INTERNAL: 'internal',
} as const

export type TagVisibility = typeof TAG_VISIBILITY[keyof typeof TAG_VISIBILITY]

export const POST_TYPE = {
  POST: 'post',
} as const

export type PostType = typeof POST_TYPE[keyof typeof POST_TYPE]

export const POST_VISIBILITY = {
  PUBLIC: 'public',
  PRIVATE: 'private',
} as const

export type PostVisibility = typeof POST_VISIBILITY[keyof typeof POST_VISIBILITY]

export const MEDIABLE_TYPES = {
  POST: 'Post',
  TAG: 'Tag',
} as const

export type MediableType = typeof MEDIABLE_TYPES[keyof typeof MEDIABLE_TYPES]

export const UPLOAD_ITEM_STATUS = {
  PENDING: 'pending',
  UPLOADING: 'uploading',
  DONE: 'done',
  ERROR: 'error',
} as const

export type UploadItemStatus = typeof UPLOAD_ITEM_STATUS[keyof typeof UPLOAD_ITEM_STATUS]

export const TAG_DEFAULT_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#FFA07A',
  '#98D8C8',
  '#F7DC6F',
  '#BB8FCE',
  '#85C1E2',
  '#F8B739',
  '#6C5CE7',
] as const

export const SLUG_MAX_LENGTH = 191

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
] as const

export const MEDIA_COLLECTIONS = {
  DEFAULT: 'default',
  IMAGES: 'images',
  FEATURED: 'featured',
} as const

export type MediaCollection = typeof MEDIA_COLLECTIONS[keyof typeof MEDIA_COLLECTIONS]

export const IMAGE_CONVERSIONS = {
  THUMB: 'thumb',
  MEDIUM: 'medium',
  LARGE: 'large',
} as const

export type ImageConversion = typeof IMAGE_CONVERSIONS[keyof typeof IMAGE_CONVERSIONS]

export const IMAGE_CARD_WIDTH = {
  FULL: 'full',
  WIDE: 'wide',
  NORMAL: 'normal',
} as const

export type ImageCardWidth = (typeof IMAGE_CARD_WIDTH)[keyof typeof IMAGE_CARD_WIDTH]

export const LEXICAL_NODE_TYPE = {
  IMAGE: 'image',
  GALLERY: 'gallery',
  TEXT: 'text',
  EXTENDED_TEXT: 'extended-text',
  LINEBREAK: 'linebreak',
  PARAGRAPH: 'paragraph',
  HEADING: 'heading',
  LIST: 'list',
  LISTITEM: 'listitem',
  QUOTE: 'quote',
  CODE: 'code',
  LINK: 'link',
} as const

export type LexicalNodeType = (typeof LEXICAL_NODE_TYPE)[keyof typeof LEXICAL_NODE_TYPE]

export const MAX_FILE_SIZE = 50 * 1024 * 1024
