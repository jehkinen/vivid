'use client'

import type { LexicalEditor } from 'lexical'
import { $insertNodes, $getSelection, $getRoot, $setSelection, $isRangeSelection } from 'lexical'
import { $createImageNode } from './nodes/ImageNode'
import { $createGalleryNode } from './nodes/GalleryNode'
import { $createAudioNode } from './nodes/AudioNode'
import { useState } from 'react'
import { PlusIcon, ImageIcon, SquaresFourIcon, MusicNotesIcon } from '@phosphor-icons/react'
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
import MediaUpload from '@/components/media/MediaUpload'
import { LEXICAL_NODE_TYPE } from '@/shared/constants'

type InsertBlockType = typeof LEXICAL_NODE_TYPE.IMAGE | typeof LEXICAL_NODE_TYPE.GALLERY | typeof LEXICAL_NODE_TYPE.AUDIO

function getInsertDialogTitle(type: InsertBlockType): string {
  const titles: Record<InsertBlockType, string> = {
    [LEXICAL_NODE_TYPE.IMAGE]: 'Insert Image',
    [LEXICAL_NODE_TYPE.GALLERY]: 'Insert Gallery',
    [LEXICAL_NODE_TYPE.AUDIO]: 'Insert Audio',
  }
  return titles[type]
}

interface InsertBlockPlusProps {
  editor: LexicalEditor | null
  mediableType?: string
  mediableId?: string
}

export default function InsertBlockPlus({ editor, mediableType, mediableId }: InsertBlockPlusProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [blockType, setBlockType] = useState<InsertBlockType | null>(null)
  const [popoverOpen, setPopoverOpen] = useState(false)

  const openDialog = (type: InsertBlockType) => {
    setBlockType(type)
    setPopoverOpen(false)
    setShowDialog(true)
  }

  const handleMediaUploaded = (media: any[]) => {
    if (!editor || media.length === 0) {
      setShowDialog(false)
      setBlockType(null)
      return
    }
    editor.update(() => {
      let selection = $getSelection()
      if (!$isRangeSelection(selection)) {
        $setSelection($getRoot().selectEnd())
      }
      if (blockType === LEXICAL_NODE_TYPE.IMAGE) {
        const image = media[0]
        const imageNode = $createImageNode({
          src: '',
          alt: image.filename,
          mediaId: image.id,
        })
        $insertNodes([imageNode])
      } else if (blockType === LEXICAL_NODE_TYPE.GALLERY) {
        const galleryImages = media.map((m) => ({
          src: '',
          alt: m.filename,
          mediaId: m.id,
        }))
        const galleryNode = $createGalleryNode({ images: galleryImages })
        $insertNodes([galleryNode])
      } else if (blockType === LEXICAL_NODE_TYPE.AUDIO) {
        const audio = media[0]
        const audioNode = $createAudioNode({
          src: '',
          title: audio.filename,
          mediaId: audio.id,
        })
        $insertNodes([audioNode])
      }
    })
    setShowDialog(false)
    setBlockType(null)
  }

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Add block"
            disabled={!editor}
          >
            <PlusIcon size={16} />
          </Button>
        </PopoverTrigger>
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
        </PopoverContent>
      </Popover>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>
              {blockType ? getInsertDialogTitle(blockType) : ''}
            </DialogTitle>
          </DialogHeader>
          <MediaUpload
            mediableType={mediableType || 'Post'}
            mediableId={mediableId}
            onUploaded={handleMediaUploaded}
            multiple={blockType === LEXICAL_NODE_TYPE.GALLERY}
            accept={blockType === LEXICAL_NODE_TYPE.AUDIO ? 'audio/*' : undefined}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
