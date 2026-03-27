'use client'

import { Button } from '@/components/ui/button'
import LexicalEditor from '@/components/editor/LexicalEditor'
import MediaUpload from '@/components/media/MediaUpload'
import { XIcon, Image as ImageIcon } from '@phosphor-icons/react'
import type { LexicalEditor as LexicalEditorInstance } from 'lexical'
import { MEDIA_COLLECTIONS, MEDIABLE_TYPES } from '@/shared/constants'
import type { PostEditorFeaturedMedia } from '@/types/post-editor'

type PostEditorBodyProps = {
  postId: string
  resolvedId: string | null
  title: string
  lexical: string | null
  featuredMedia: PostEditorFeaturedMedia
  onTitleChange: (v: string) => void
  onEditorChange: (a: unknown, b: string, lexicalState: string) => void
  onEditorMount: (e: LexicalEditorInstance | null) => void
  onToolbarOpenChange: (open: boolean) => void
  onEditorLoaded: () => void
  onRemoveFeatured: (postId: string) => void
  onFeaturedUploaded: (postId: string, media: { id: string }[]) => void
}

export default function PostEditorBody({
  postId,
  resolvedId,
  title,
  lexical,
  featuredMedia,
  onTitleChange,
  onEditorChange,
  onEditorMount,
  onToolbarOpenChange,
  onEditorLoaded,
  onRemoveFeatured,
  onFeaturedUploaded,
}: PostEditorBodyProps) {
  return (
    <div className="flex-1 min-w-0 w-full max-w-3xl py-8 pb-20 font-reading md:pb-8">
      <div className="flex">
        <div className="relative flex min-w-0 flex-1 flex-col">
          {resolvedId && (
            <div className="mb-4">
              {featuredMedia?.url ? (
                <div className="relative mb-4 inline-block">
                  <img
                    src={featuredMedia.url}
                    alt={featuredMedia.filename ?? ''}
                    className="max-h-64 max-w-full rounded-lg object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => onRemoveFeatured(resolvedId)}
                  >
                    <XIcon size={16} />
                  </Button>
                </div>
              ) : (
                <MediaUpload
                  mediableType={MEDIABLE_TYPES.POST}
                  mediableId={resolvedId}
                  collection={MEDIA_COLLECTIONS.FEATURED}
                  buttonLabel="Featured Image"
                  buttonIcon={<ImageIcon size={20} />}
                  buttonClassName="min-h-[72px] py-4"
                  onUploaded={(m) => onFeaturedUploaded(resolvedId, m)}
                />
              )}
            </div>
          )}
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Post title"
            className="mb-2 w-full border-0 bg-transparent py-2 text-4xl font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground"
          />
          <LexicalEditor
            key={postId}
            initialEditorState={lexical}
            onChange={onEditorChange}
            placeholder="Begin writing your vivid story..."
            mediableType={MEDIABLE_TYPES.POST}
            mediableId={resolvedId || undefined}
            onEditorMount={onEditorMount}
            onToolbarOpenChange={onToolbarOpenChange}
            onEditorLoaded={onEditorLoaded}
            renderFloatingPanel={() => null}
          />
        </div>
      </div>
    </div>
  )
}
