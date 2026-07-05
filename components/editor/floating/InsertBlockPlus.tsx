'use client'

import * as React from 'react'
import type { LexicalEditor } from 'lexical'
import { insertDecoratorWithTrailingParagraph } from '@/lib/editor/insert-block'
import { $insertPostLink } from '@/lib/editor/post-link'
import { $createGalleryNode } from '../nodes/GalleryNode'
import { $createImageNode } from '../nodes/ImageNode'
import { $createAudioNode } from '../nodes/AudioNode'
import { $createYouTubeNode } from '../nodes/YouTubeNode'
import { $createPostCardNode } from '../nodes/PostCardNode'
import { extractYouTubeVideoId } from '@/lib/editor/lexical/youtube-utils'
import { useState } from 'react'
import { PlusIcon, ImageIcon, SquaresFourIcon, MusicNotesIcon, YoutubeLogo, LinkIcon, ArticleIcon } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { MediaUpload } from '@/components/media/MediaUpload'
import { PostPickerDialog } from '../PostPickerDialog'
import type { PostSearchItem } from '@/components/search/PostSearchList'
import { LEXICAL_NODE_TYPE } from '@/shared/constants'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

type InsertBlockType = typeof LEXICAL_NODE_TYPE.IMAGE | typeof LEXICAL_NODE_TYPE.GALLERY | typeof LEXICAL_NODE_TYPE.AUDIO | typeof LEXICAL_NODE_TYPE.YOUTUBE

type PostPickerMode = 'link' | 'card'

function getInsertDialogTitle(type: InsertBlockType): string {
  const titles: Record<InsertBlockType, string> = {
    [LEXICAL_NODE_TYPE.IMAGE]: 'Insert Image',
    [LEXICAL_NODE_TYPE.GALLERY]: 'Insert Gallery',
    [LEXICAL_NODE_TYPE.AUDIO]: 'Insert Audio',
    [LEXICAL_NODE_TYPE.YOUTUBE]: 'Insert YouTube video',
  }
  return titles[type]
}

interface InsertBlockPlusProps {
  editor: LexicalEditor | null
  mediableType?: string
  mediableId?: string
  triggerClassName?: string
  trigger?: React.ReactElement<{ suppressHydrationWarning?: boolean }>
  tooltipSide?: 'top' | 'right' | 'bottom' | 'left'
}

export function InsertBlockPlus({
  editor,
  mediableType,
  mediableId,
  triggerClassName,
  trigger,
  tooltipSide = 'left',
}: InsertBlockPlusProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [blockType, setBlockType] = useState<InsertBlockType | null>(null)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [postPickerOpen, setPostPickerOpen] = useState(false)
  const [postPickerMode, setPostPickerMode] = useState<PostPickerMode>('link')

  const openPostPicker = (mode: PostPickerMode) => {
    setPostPickerMode(mode)
    setPopoverOpen(false)
    setPostPickerOpen(true)
  }

  const handlePostSelect = (post: PostSearchItem) => {
    if (!editor) return
    editor.update(() => {
      if (postPickerMode === 'link') {
        $insertPostLink({
          postId: post.id,
          slug: post.slug,
          title: post.title,
        })
      } else {
        insertDecoratorWithTrailingParagraph(() =>
          $createPostCardNode({
            postId: post.id,
            slug: post.slug,
            title: post.title,
          })
        )
      }
    })
    toast.success(`Linked to "${post.title || 'Untitled'}"`)
  }

  const openDialog = (type: InsertBlockType) => {
    setBlockType(type)
    setYoutubeUrl('')
    setPopoverOpen(false)
    setShowDialog(true)
  }

  const handleYouTubeInsert = () => {
    const videoId = extractYouTubeVideoId(youtubeUrl)
    if (!editor || !videoId) return
    editor.update(() => {
      insertDecoratorWithTrailingParagraph(() => $createYouTubeNode({ videoId }))
    })
    setShowDialog(false)
    setBlockType(null)
    setYoutubeUrl('')
  }

  const handleMediaUploaded = (media: { id: string; filename: string }[]) => {
    if (!editor || media.length === 0) {
      setShowDialog(false)
      setBlockType(null)
      return
    }
    editor.update(() => {
      if (blockType === LEXICAL_NODE_TYPE.IMAGE) {
        const image = media[0]
        insertDecoratorWithTrailingParagraph(() =>
          $createImageNode({
            src: '',
            alt: image.filename,
            mediaId: image.id,
          })
        )
      } else if (blockType === LEXICAL_NODE_TYPE.GALLERY) {
        const galleryImages = media.map((m) => ({
          src: '',
          alt: m.filename,
          mediaId: m.id,
        }))
        insertDecoratorWithTrailingParagraph(() => $createGalleryNode({ images: galleryImages }))
      } else if (blockType === LEXICAL_NODE_TYPE.AUDIO) {
        const audio = media[0]
        insertDecoratorWithTrailingParagraph(() =>
          $createAudioNode({
            src: '',
            title: audio.filename,
            mediaId: audio.id,
          })
        )
      }
    })
    setShowDialog(false)
    setBlockType(null)
  }

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              {trigger
                ? React.cloneElement(trigger, { suppressHydrationWarning: true })
                : (
                  <Button
                    variant="outline"
                    size="icon"
                    className={['h-9 w-9 rounded-full transition-opacity', triggerClassName ?? 'opacity-70 hover:opacity-100'].filter(Boolean).join(' ')}
                    aria-label="Add block"
                    disabled={!editor}
                    suppressHydrationWarning
                  >
                    <PlusIcon size={16} />
                  </Button>
                )}
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side={tooltipSide} sideOffset={8}>
            Add block
          </TooltipContent>
        </Tooltip>
        <PopoverContent className="w-56 p-1" align="start">
          <div className="text-xs font-medium text-muted-foreground px-2 py-1.5">PRIMARY</div>
          <button
            type="button"
            onClick={() => openDialog(LEXICAL_NODE_TYPE.IMAGE)}
            className="w-full flex items-center gap-2 px-2 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground text-left"
          >
            <ImageIcon size={16} />
            Image
          </button>
          <button
            type="button"
            onClick={() => openDialog(LEXICAL_NODE_TYPE.GALLERY)}
            className="w-full flex items-center gap-2 px-2 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground text-left"
          >
            <SquaresFourIcon size={16} />
            Gallery
          </button>
          <button
            type="button"
            onClick={() => openDialog(LEXICAL_NODE_TYPE.AUDIO)}
            className="w-full flex items-center gap-2 px-2 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground text-left"
          >
            <MusicNotesIcon size={16} />
            Audio
          </button>
          <button
            type="button"
            onClick={() => openDialog(LEXICAL_NODE_TYPE.YOUTUBE)}
            className="w-full flex items-center gap-2 px-2 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground text-left"
          >
            <YoutubeLogo size={16} />
            YouTube
          </button>
          <div className="text-xs font-medium text-muted-foreground px-2 py-1.5 mt-1 border-t border-border">CONNECT</div>
          <button
            type="button"
            onClick={() => openPostPicker('link')}
            className="w-full flex items-center gap-2 px-2 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground text-left"
          >
            <LinkIcon size={16} />
            Link to post
          </button>
          <button
            type="button"
            onClick={() => openPostPicker('card')}
            className="w-full flex items-center gap-2 px-2 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground text-left"
          >
            <ArticleIcon size={16} />
            Post preview
          </button>
        </PopoverContent>
      </Popover>
      <PostPickerDialog
        open={postPickerOpen}
        onOpenChange={setPostPickerOpen}
        excludePostId={mediableId}
        onSelect={handlePostSelect}
      />
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>
              {blockType ? getInsertDialogTitle(blockType) : ''}
            </DialogTitle>
          </DialogHeader>
          {blockType === LEXICAL_NODE_TYPE.YOUTUBE ? (
            <div className="space-y-4 py-2">
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... or youtu.be/..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleYouTubeInsert()}
              />
              <Button
                onClick={handleYouTubeInsert}
                disabled={!extractYouTubeVideoId(youtubeUrl)}
              >
                Insert
              </Button>
            </div>
          ) : (
            <MediaUpload
              mediableType={mediableType || 'Post'}
              mediableId={mediableId}
              onUploaded={handleMediaUploaded}
              multiple={blockType === LEXICAL_NODE_TYPE.GALLERY}
              accept={blockType === LEXICAL_NODE_TYPE.AUDIO ? 'audio/*' : undefined}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
