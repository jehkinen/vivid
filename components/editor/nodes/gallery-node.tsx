import {
  DecoratorNode,
  NodeKey,
  LexicalNode,
  SerializedLexicalNode,
  Spread,
} from 'lexical'
import type { ReactNode } from 'react'
import { arrayMove } from '@dnd-kit/sortable'
import { LEXICAL_NODE_TYPE } from '@/shared/constants'
import GalleryComponent from './GalleryComponent'

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

  reorderImages(fromIndex: number, toIndex: number): void {
    const writable = this.getWritable()
    writable.__images = arrayMove(writable.__images, fromIndex, toIndex)
  }
}

export function $createGalleryNode(payload: GalleryPayload): GalleryNode {
  return new GalleryNode(payload)
}

export function $isGalleryNode(node: LexicalNode | null | undefined): node is GalleryNode {
  return node instanceof GalleryNode
}
