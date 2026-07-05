'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  DecoratorNode,
  NodeKey,
  LexicalNode,
  SerializedLexicalNode,
  Spread,
} from 'lexical'
import { ImageBrokenIcon } from '@phosphor-icons/react'
import { ReactNode, useState, useCallback } from 'react'
import { IMAGE_CARD_WIDTH, LEXICAL_NODE_TYPE, type ImageCardWidth } from '@/shared/constants'
import { useMediaUrl } from '@/hooks/use-media-url'
import { getImageCardWidthClass } from '@/lib/editor/lexical/image-layout'
import { resolveMediaSrc } from '@/lib/editor/lexical/resolve-media-src'
import { removeDecoratorNode } from '@/lib/editor/insert-block'
import { DecoratorRemoveButton } from './shared/DecoratorRemoveButton'

export interface ImagePayload {
  src: string
  alt?: string
  title?: string
  width?: number
  height?: number
  cardWidth?: ImageCardWidth
  mediaId?: string
}

export type SerializedImageNode = Spread<
  {
    src: string
    alt?: string
    title?: string
    width?: number
    height?: number
    cardWidth?: ImageCardWidth
    mediaId?: string
  },
  SerializedLexicalNode
>

function ImageComponent({
  src,
  alt,
  title,
  width,
  height,
  cardWidth = IMAGE_CARD_WIDTH.NORMAL,
  mediaId,
  nodeKey,
}: ImagePayload & { nodeKey: string }) {
  const [editor] = useLexicalComposerContext()
  const [hasError, setHasError] = useState(false)
  const resolvedUrl = useMediaUrl(mediaId)
  const urlMap = mediaId && resolvedUrl ? { [mediaId]: resolvedUrl } : {}
  const imgSrc = resolveMediaSrc(mediaId, src, urlMap)

  const handleRemove = useCallback(() => {
    editor.update(() => {
      removeDecoratorNode(nodeKey, $isImageNode)
    })
  }, [editor, nodeKey])

  const cardWidthClass = getImageCardWidthClass(cardWidth)

  return (
    <figure className={`group relative my-6 ${cardWidthClass}`}>
      {hasError ? (
        <div className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-lg bg-muted py-8 text-muted-foreground">
          <ImageBrokenIcon size={40} className="shrink-0" />
          <span>Image unavailable</span>
        </div>
      ) : imgSrc ? (
        <img
          src={imgSrc}
          alt={alt || ''}
          title={title}
          width={width}
          height={height}
          className="rounded-lg"
          style={{ maxWidth: '100%', height: 'auto' }}
          onError={() => setHasError(true)}
        />
      ) : null}
      <DecoratorRemoveButton onClick={handleRemove} ariaLabel="Remove image" />
      {title && (
        <figcaption className="text-sm text-muted-foreground mt-2 text-center">
          {title}
        </figcaption>
      )}
    </figure>
  )
}

export class ImageNode extends DecoratorNode<ReactNode> {
  __src: string
  __alt?: string
  __title?: string
  __width?: number
  __height?: number
  __cardWidth?: ImageCardWidth
  __mediaId?: string

  static getType(): string {
    return LEXICAL_NODE_TYPE.IMAGE
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      {
        src: node.__src,
        alt: node.__alt,
        title: node.__title,
        width: node.__width,
        height: node.__height,
        cardWidth: node.__cardWidth,
        mediaId: node.__mediaId,
      },
      node.__key
    )
  }

  constructor(payload: ImagePayload, key?: NodeKey) {
    super(key)
    this.__src = payload.src
    this.__alt = payload.alt
    this.__title = payload.title
    this.__width = payload.width
    this.__height = payload.height
    this.__cardWidth = payload.cardWidth || IMAGE_CARD_WIDTH.NORMAL
    this.__mediaId = payload.mediaId
  }

  createDOM(): HTMLElement {
    const span = document.createElement('span')
    return span
  }

  updateDOM(): false {
    return false
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { src, alt, title, width, height, cardWidth, mediaId } = serializedNode
    return $createImageNode({
      src,
      alt,
      title,
      width,
      height,
      cardWidth,
      mediaId,
    })
  }

  exportJSON(): SerializedImageNode {
    return {
      src: this.__src,
      alt: this.__alt,
      title: this.__title,
      width: this.__width,
      height: this.__height,
      cardWidth: this.__cardWidth,
      mediaId: this.__mediaId,
      type: LEXICAL_NODE_TYPE.IMAGE,
      version: 1,
    }
  }

  decorate(): ReactNode {
    return (
      <ImageComponent
        src={this.__src}
        alt={this.__alt}
        title={this.__title}
        width={this.__width}
        height={this.__height}
        cardWidth={this.__cardWidth}
        mediaId={this.__mediaId}
        nodeKey={this.getKey()}
      />
    )
  }

  setSrc(src: string): void {
    const writable = this.getWritable()
    writable.__src = src
  }

  setAlt(alt: string): void {
    const writable = this.getWritable()
    writable.__alt = alt
  }

  setTitle(title: string): void {
    const writable = this.getWritable()
    writable.__title = title
  }

  setWidth(width: number): void {
    const writable = this.getWritable()
    writable.__width = width
  }

  setHeight(height: number): void {
    const writable = this.getWritable()
    writable.__height = height
  }

  setCardWidth(cardWidth: ImageCardWidth): void {
    const writable = this.getWritable()
    writable.__cardWidth = cardWidth
  }

  setMediaId(mediaId: string): void {
    const writable = this.getWritable()
    writable.__mediaId = mediaId
  }
}

export function $createImageNode(payload: ImagePayload): ImageNode {
  return new ImageNode(payload)
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode
}