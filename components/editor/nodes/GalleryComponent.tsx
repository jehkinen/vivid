'use client'

import { $getNodeByKey } from 'lexical'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ImageBrokenIcon, XIcon, PlusIcon, DotsSixVertical } from '@phosphor-icons/react'
import { useState, useCallback, useMemo, type ReactNode } from 'react'
import { useMediaUrl } from '@/hooks/use-media-url'
import MediaUpload from '@/components/media/MediaUpload'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useMediable } from '../MediableContext'
import type { GalleryImage, GalleryPayload } from './gallery-node'
import { $isGalleryNode, type GalleryNode } from './gallery-node'

function getSortableId(image: GalleryImage, index: number): string {
  return image.mediaId ?? image.src ?? `idx-${index}`
}

function GalleryImageBlock({
  image,
  index,
  brokenKeys,
  onError,
  onRemove,
  dragHandle,
}: {
  image: GalleryImage
  index: number
  brokenKeys: Set<string>
  onError: (key: string) => void
  onRemove: (index: number) => void
  dragHandle?: ReactNode
}) {
  const resolvedUrl = useMediaUrl(image.mediaId)
  const imgSrc = image.mediaId ? (resolvedUrl ?? '') : image.src
  const key = image.mediaId || image.src || `i-${index}`
  const isBroken = brokenKeys.has(key)

  return (
    <div className="group relative aspect-square overflow-hidden rounded-lg bg-muted">
      {dragHandle}
      {isBroken ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-2 text-muted-foreground">
          <ImageBrokenIcon size={32} className="shrink-0" />
          <span className="text-xs text-center">Image unavailable</span>
        </div>
      ) : imgSrc ? (
        <img
          src={imgSrc}
          alt={image.alt || ''}
          title={image.title}
          width={image.width}
          height={image.height}
          className="w-full h-full object-cover"
          onError={() => onError(key)}
        />
      ) : null}
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="absolute right-1 top-1 z-10 rounded p-1.5 bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/70"
        aria-label="Remove image"
      >
        <XIcon size={16} />
      </button>
    </div>
  )
}

function SortableGalleryImage({
  image,
  index,
  brokenKeys,
  onError,
  onRemove,
}: {
  image: GalleryImage
  index: number
  brokenKeys: Set<string>
  onError: (key: string) => void
  onRemove: (index: number) => void
}) {
  const id = getSortableId(image, index)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const dragHandle = (
    <button
      type="button"
      className="absolute left-1 top-1 z-10 rounded p-1 bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/70 cursor-grab active:cursor-grabbing touch-none"
      {...attributes}
      {...listeners}
      aria-label="Drag to reorder"
    >
      <DotsSixVertical size={16} />
    </button>
  )

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'opacity-50 z-10 relative' : 'relative'}
    >
      <GalleryImageBlock
        image={image}
        index={index}
        brokenKeys={brokenKeys}
        onError={onError}
        onRemove={onRemove}
        dragHandle={dragHandle}
      />
    </div>
  )
}

export default function GalleryComponent({
  images,
  nodeKey,
}: GalleryPayload & { nodeKey: string }) {
  const [editor] = useLexicalComposerContext()
  const { mediableType, mediableId } = useMediable()
  const [brokenKeys, setBrokenKeys] = useState<Set<string>>(new Set())
  const [showAddDialog, setShowAddDialog] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const sortableIds = useMemo(
    () => images.map((image, index) => getSortableId(image, index)),
    [images]
  )

  const handleImageError = useCallback((key: string) => {
    setBrokenKeys((prev) => new Set(prev).add(key))
  }, [])

  const handleRemove = useCallback(
    (index: number) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey)
        if (node && $isGalleryNode(node)) {
          const gallery = node as GalleryNode
          gallery.removeImage(index)
          if (gallery.__images.length === 0) node.remove()
        }
      })
    },
    [editor, nodeKey]
  )

  const handleAddImages = useCallback(
    (media: { id: string; filename: string }[]) => {
      if (media.length === 0) {
        setShowAddDialog(false)
        return
      }
      editor.update(() => {
        const node = $getNodeByKey(nodeKey)
        if (node && $isGalleryNode(node)) {
          const gallery = node as GalleryNode
          media.forEach((m) => {
            gallery.addImage({
              src: '',
              alt: m.filename,
              mediaId: m.id,
            })
          })
        }
      })
      setShowAddDialog(false)
    },
    [editor, nodeKey]
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = sortableIds.indexOf(active.id as string)
      const newIndex = sortableIds.indexOf(over.id as string)
      if (oldIndex === -1 || newIndex === -1) return

      editor.update(() => {
        const node = $getNodeByKey(nodeKey)
        if (node && $isGalleryNode(node)) {
          const gallery = node as GalleryNode
          gallery.reorderImages(oldIndex, newIndex)
        }
      })
    },
    [editor, nodeKey, sortableIds]
  )

  return (
    <>
      <figure className="my-6">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="kg-gallery-container grid grid-cols-2 md:grid-cols-3 gap-2">
            <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
              {images.map((image, index) => (
                <SortableGalleryImage
                  key={getSortableId(image, index)}
                  image={image}
                  index={index}
                  brokenKeys={brokenKeys}
                  onError={handleImageError}
                  onRemove={handleRemove}
                />
              ))}
            </SortableContext>
            <button
              type="button"
              onClick={() => {
                if (!mediableId) {
                  console.warn('Cannot add images: mediableId is not available')
                  return
                }
                setShowAddDialog(true)
              }}
              className="aspect-square rounded-lg border-2 border-dashed border-border bg-muted/50 hover:bg-muted hover:border-foreground/20 transition-colors flex items-center justify-center group"
              aria-label="Add images to gallery"
              disabled={!mediableId}
            >
              <PlusIcon size={24} className="text-muted-foreground group-hover:text-foreground" />
            </button>
          </div>
        </DndContext>
      </figure>
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Add Images to Gallery</DialogTitle>
          </DialogHeader>
          <MediaUpload
            mediableType={mediableType || 'Post'}
            mediableId={mediableId}
            onUploaded={handleAddImages}
            multiple={true}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
