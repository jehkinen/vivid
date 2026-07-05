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
  '#E17055',
  '#00B894',
  '#0984E3',
  '#FD79A8',
  '#A29BFE',
  '#FDCB6E',
  '#55A3E0',
  '#81ECEC',
  '#B2BEC3',
  '#636E72',
] as const

export const SLUG_MAX_LENGTH = 191

export const LIST_VISIBILITY = {
  PUBLIC: 'public',
  PRIVATE: 'private',
} as const

export type ListVisibility = (typeof LIST_VISIBILITY)[keyof typeof LIST_VISIBILITY]

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
] as const

export const ALLOWED_AUDIO_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/webm',
  'audio/aac',
  'audio/flac',
] as const

export const ALLOWED_UPLOAD_MIME_TYPES = [
  ...ALLOWED_IMAGE_MIME_TYPES,
  ...ALLOWED_AUDIO_MIME_TYPES,
] as const

export const MEDIA_COLLECTIONS = {
  DEFAULT: 'default',
  IMAGES: 'images',
  FEATURED: 'featured',
} as const

export type MediaCollection = typeof MEDIA_COLLECTIONS[keyof typeof MEDIA_COLLECTIONS]

export const MEDIA_FILTER_TYPES = {
  ALL: 'all',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  DOCUMENT: 'document',
} as const

export type MediaFilterType = (typeof MEDIA_FILTER_TYPES)[keyof typeof MEDIA_FILTER_TYPES]

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
  AUDIO: 'audio',
  YOUTUBE: 'youtube',
  POST_CARD: 'post-card',
  TEXT: 'text',
  EXTENDED_TEXT: 'extended-text',
  LINEBREAK: 'linebreak',
  PARAGRAPH: 'paragraph',
  HEADING: 'heading',
  EXTENDED_HEADING: 'extended-heading',
  LIST: 'list',
  LISTITEM: 'listitem',
  QUOTE: 'quote',
  CODE: 'code',
  LINK: 'link',
  AUTOLINK: 'autolink',
} as const

export type LexicalNodeType = (typeof LEXICAL_NODE_TYPE)[keyof typeof LEXICAL_NODE_TYPE]

export const POST_LINK_FIELD = 'postId' as const

export const POST_LINK_REL_PREFIX = 'vivid-post:' as const

export const POST_REF_TYPE = {
  INLINE: 'inline',
  CARD: 'card',
} as const

export type PostRefType = (typeof POST_REF_TYPE)[keyof typeof POST_REF_TYPE]

export const MAX_FILE_SIZE = 50 * 1024 * 1024

export const READING_FONTS = [
  { id: 'bitter', label: 'Bitter' },
  { id: 'bookerly', label: 'Bookerly Light' },
  { id: 'source', label: 'Source Serif 4' },
] as const

export type ReadingFontId = (typeof READING_FONTS)[number]['id']

export const CLIPBOARD_MIME = {
  PLAIN: 'text/plain',
  HTML: 'text/html',
  URI_LIST: 'text/uri-list',
  LEXICAL_EDITOR: 'application/x-lexical-editor',
} as const

export const INPUT_INSERT_TYPES = {
  PASTE: 'insertFromPaste',
  PASTE_AS_QUOTATION: 'insertFromPasteAsQuotation',
} as const

export const CACHE_TAGS = {
  PUBLISHED_TAGS: 'published-tags',
} as const

export const CACHE_REVALIDATE_SECONDS = 60

export const SIGNED_URL_EXPIRES_SECONDS = 3600

export const SIGNED_URL_CACHE_BUFFER_SECONDS = 60

export const OPENAI_IMAGE_MODEL = 'gpt-image-1-mini' as const

export const OPENAI_IMAGE_SIZE = '1024x1024' as const

export const OPENAI_IMAGE_QUALITY = 'low' as const

export const OPENAI_IMAGE_OUTPUT_FORMAT = 'jpeg' as const

export const OPENAI_IMAGE_OUTPUT_COMPRESSION = 85 as const

export const OPENAI_IMAGE_MODERATION = 'low' as const

export const OPENAI_CONCEPT_MODEL = 'gpt-4o-mini' as const

export const OPENAI_KEY_MIN_LENGTH = 20

export const OPENAI_KEY_PREFIX = 'sk-' as const

export const COVER_STYLE_PRESETS = [
  {
    id: 'editorial',
    label: 'Editorial',
    promptSuffix: 'Editorial magazine cover style, cinematic lighting, professional photography.',
  },
  {
    id: 'minimal',
    label: 'Minimal',
    promptSuffix: 'Minimalist composition, clean negative space, soft muted palette.',
  },
  {
    id: 'moody',
    label: 'Moody',
    promptSuffix: 'Moody atmospheric scene, dramatic shadows, rich deep tones.',
  },
  {
    id: 'abstract',
    label: 'Abstract',
    promptSuffix: 'Abstract artistic interpretation, bold shapes, expressive texture.',
  },
  {
    id: 'cartoon',
    label: 'Cartoon',
    promptSuffix:
      'Bold cartoon illustration, clean thin linework, soft cel shading, expressive stylized characters, not photorealistic.',
  },
] as const

export type CoverStylePresetId = (typeof COVER_STYLE_PRESETS)[number]['id']

export const COVER_GENERATION_MAX_ATTEMPTS = 5

export const COVER_CONCEPT_INPUT_MAX = 5000

export const COVER_CONCEPT_MAX_TOKENS = 240

export const COVER_LOCAL_CONCEPT_MAX = 280

export const COVER_LEAD_SENTENCES_MAX = 3

export const COVER_MIN_PLAINTEXT_CHARS = 40

export const API_ERROR_CODE = {
  OPENAI_NOT_CONFIGURED: 'OPENAI_NOT_CONFIGURED',
} as const

export type ApiErrorCode = (typeof API_ERROR_CODE)[keyof typeof API_ERROR_CODE]

export const GENERATED_COVER_FILENAME = 'cover-generated.jpg' as const
