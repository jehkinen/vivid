'use client'

import { $getNodeByKey } from 'lexical'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  DecoratorNode,
  NodeKey,
  EditorConfig,
  LexicalNode,
  SerializedLexicalNode,
  Spread,
} from 'lexical'
import { LEXICAL_NODE_TYPE } from '@/shared/constants'
import { ImageBrokenIcon, XIcon, PlusIcon } from '@phosphor-icons/react'
import { ReactNode, useState, useCallback } from 'react'
import { useMediaUrl } from '@/hooks/use-media-url'
import MediaUpload from '@/components/media/MediaUpload'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useMediable } from '../MediableContext'

export interface GalleryImage {
  src: string
  alt?: string
  title?: string
  width?: number
  height?: number
  mediaId?: string
}

export interface GalleryPayload {
  images: GalleryImage[]
}

export type SerializedGalleryNode = Spread<
  {
    images: GalleryImage[]
  },
  SerializedLexicalNode
>

function GalleryImageBlock({
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
  const resolvedUrl = useMediaUrl(image.mediaId)
  const imgSrc = image.mediaId ? (resolvedUrl ?? '') : image.src
  const key = image.mediaId || image.src || `i-${index}`
  const isBroken = brokenKeys.has(key)

  return (
    <div className="group relative aspect-square overflow-hidden rounded-lg bg-muted">
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

function GalleryComponent({
  images,
  nodeKey,
}: GalleryPayload & { nodeKey: string }) {
  const [editor] = useLexicalComposerContext()
  const { mediableType, mediableId } = useMediable()
  const [brokenKeys, setBrokenKeys] = useState<Set<string>>(new Set())
  const [showAddDialog, setShowAddDialog] = useState(false)

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
    (media: any[]) => {
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

  return (
    <>
      <figure className="my-6">
        <div className="kg-gallery-container grid grid-cols-2 md:grid-cols-3 gap-2">
          {images.map((image, index) => (
            <GalleryImageBlock
              key={image.mediaId || image.src || `i-${index}`}
              image={image}
              index={index}
              brokenKeys={brokenKeys}
              onError={handleImageError}
              onRemove={handleRemove}
            />
          ))}
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

export class GalleryNode extends DecoratorNode<ReactNode> {
  __images: GalleryImage[]

  static getType(): string {
    return LEXICAL_NODE_TYPE.GALLERY
  }

  static clone(node: GalleryNode): GalleryNode {
    return new GalleryNode(
      {
        images: node.__images,
      },
      node.__key
    )
  }

  constructor(payload: GalleryPayload, key?: NodeKey) {
    super(key)
    this.__images = payload.images || []
  }

  createDOM(): HTMLElement {
    const span = document.createElement('span')
    return span
  }

  updateDOM(): false {
    return false
  }

  static importJSON(serializedNode: SerializedGalleryNode): GalleryNode {
    const { images } = serializedNode
    return $createGalleryNode({ images })
  }

  exportJSON(): SerializedGalleryNode {
    return {
      images: this.__images,
      type: LEXICAL_NODE_TYPE.GALLERY,
      version: 1,
    }
  }

  decorate(): ReactNode {
    return <GalleryComponent images={this.__images} nodeKey={this.getKey()} />
  }


  setImages(images: GalleryImage[]): void {
    const writable = this.getWritable()
    writable.__images = images
  }

  addImage(image: GalleryImage): void {
    const writable = this.getWritable()
    writable.__images = [...writable.__images, image]
  }

  removeImage(index: number): void {
    const writable = this.getWritable()
    writable.__images = writable.__images.filter((_, i) => i !== index)
  }
}

export function $createGalleryNode(payload: GalleryPayload): GalleryNode {
  return new GalleryNode(payload)
}

export function $isGalleryNode(node: LexicalNode | null | undefined): node is GalleryNode {
  return node instanceof GalleryNode
}