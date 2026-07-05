'use client'

import { useState } from 'react'
import { ImageIcon, SparkleIcon, XIcon } from '@phosphor-icons/react'
import { MediaUpload } from '@/components/media/MediaUpload'
import { GenerateCoverSheet } from '@/components/editor/post-editor/GenerateCoverSheet'
import { MEDIA_COLLECTIONS, MEDIABLE_TYPES } from '@/shared/constants'
import type { PostEditorFeaturedMedia } from '@/types/post-editor'
import type { GenerateCoverMedia } from '@/types/ai'

interface FeaturedImagePickerProps {
  postId: string
  featuredMedia: PostEditorFeaturedMedia
  title: string
  plaintext: string
  tagNames: string[]
  openAiConfigured: boolean
  onRemove: (postId: string) => void
  onUploaded: (postId: string, media: { id: string }[]) => void
}

export function FeaturedImagePicker({
  postId,
  featuredMedia,
  title,
  plaintext,
  tagNames,
  openAiConfigured,
  onRemove,
  onUploaded,
}: FeaturedImagePickerProps) {
  const [sheetOpen, setSheetOpen] = useState(false)

  const handleAccepted = (media: GenerateCoverMedia) => {
    onUploaded(postId, [media])
  }

  if (featuredMedia?.url) {
    return (
      <>
        <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-border/70 bg-muted/25 py-1 pl-1 pr-2">
          <img
            src={featuredMedia.url}
            alt={featuredMedia.filename ?? ''}
            className="h-9 w-9 rounded object-cover"
          />
          <span className="text-sm text-muted-foreground">Cover</span>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Regenerate
          </button>
          <button
            type="button"
            onClick={() => onRemove(postId)}
            className="ml-1 flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            aria-label="Remove cover image"
          >
            <XIcon size={14} />
          </button>
        </div>
        <GenerateCoverSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          postId={postId}
          title={title}
          plaintext={plaintext}
          tagNames={tagNames}
          openAiConfigured={openAiConfigured}
          replaceMediaId={featuredMedia.id}
          onAccepted={handleAccepted}
        />
      </>
    )
  }

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <MediaUpload
          mediableType={MEDIABLE_TYPES.POST}
          mediableId={postId}
          collection={MEDIA_COLLECTIONS.FEATURED}
          variant="featured"
          buttonLabel="Cover image"
          buttonIcon={<ImageIcon size={16} />}
          onUploaded={(m) => onUploaded(postId, m)}
        />
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border/70 bg-muted/25 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-border hover:bg-muted/45 hover:text-foreground active:scale-[0.98]"
        >
          <SparkleIcon className="h-4 w-4" />
          Generate
        </button>
      </div>
      <GenerateCoverSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        postId={postId}
        title={title}
        plaintext={plaintext}
        tagNames={tagNames}
        openAiConfigured={openAiConfigured}
        onAccepted={handleAccepted}
      />
    </>
  )
}
