'use client'

import { LexicalEditor } from '@/components/editor/LexicalEditor'
import { FeaturedImagePicker } from '@/components/editor/post-editor/FeaturedImagePicker'
import type { LexicalEditor as LexicalEditorInstance } from 'lexical'
import { MEDIABLE_TYPES } from '@/shared/constants'
import type { PostEditorFeaturedMedia } from '@/types/post-editor'

type PostEditorBodyProps = {
  postId: string
  resolvedId: string | null
  title: string
  lexical: string | null
  plaintext: string
  tagNames: string[]
  openAiConfigured: boolean
  featuredMedia: PostEditorFeaturedMedia
  onTitleChange: (v: string) => void
  onEditorChange: (a: unknown, b: string, lexicalState: string) => void
  onEditorMount: (e: LexicalEditorInstance | null) => void
  onToolbarOpenChange: (open: boolean) => void
  onEditorLoaded: () => void
  onRemoveFeatured: (postId: string) => void
  onFeaturedUploaded: (postId: string, media: { id: string }[]) => void
}

export function PostEditorBody({
  postId,
  resolvedId,
  title,
  lexical,
  plaintext,
  tagNames,
  openAiConfigured,
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
            <FeaturedImagePicker
              postId={resolvedId}
              featuredMedia={featuredMedia}
              title={title}
              plaintext={plaintext}
              tagNames={tagNames}
              openAiConfigured={openAiConfigured}
              onRemove={onRemoveFeatured}
              onUploaded={onFeaturedUploaded}
            />
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
