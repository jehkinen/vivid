'use client'

import {
  DecoratorNode,
  NodeKey,
  LexicalNode,
  SerializedLexicalNode,
  Spread,
} from 'lexical'
import { ReactNode } from 'react'
import { LEXICAL_NODE_TYPE } from '@/shared/constants'

export interface YouTubePayload {
  videoId: string
}

export type SerializedYouTubeNode = Spread<
  { videoId: string },
  SerializedLexicalNode
>

function YouTubePlaceholder({ nodeKey }: { nodeKey: string }) {
  return (
    <figure className="relative my-6 pointer-events-none" data-youtube-placeholder={nodeKey}>
      <div className="relative aspect-video w-full max-w-3xl mx-auto rounded-lg overflow-hidden border border-border bg-muted" />
    </figure>
  )
}

export class YouTubeNode extends DecoratorNode<ReactNode> {
  __videoId: string

  static getType(): string {
    return LEXICAL_NODE_TYPE.YOUTUBE
  }

  static clone(node: YouTubeNode): YouTubeNode {
    return new YouTubeNode({ videoId: node.__videoId }, node.__key)
  }

  constructor(payload: YouTubePayload, key?: NodeKey) {
    super(key)
    this.__videoId = payload.videoId
  }

  createDOM(): HTMLElement {
    const span = document.createElement('span')
    return span
  }

  updateDOM(): false {
    return false
  }

  static importJSON(serializedNode: SerializedYouTubeNode): YouTubeNode {
    return $createYouTubeNode({ videoId: serializedNode.videoId })
  }

  exportJSON(): SerializedYouTubeNode {
    return {
      videoId: this.__videoId,
      type: LEXICAL_NODE_TYPE.YOUTUBE,
      version: 1,
    }
  }

  decorate(): ReactNode {
    return <YouTubePlaceholder nodeKey={this.getKey()} />
  }

  getVideoId(): string {
    return this.__videoId
  }

  setVideoId(videoId: string): void {
    const writable = this.getWritable()
    writable.__videoId = videoId
  }
}

export function $createYouTubeNode(payload: YouTubePayload): YouTubeNode {
  return new YouTubeNode(payload)
}

export function $isYouTubeNode(node: LexicalNode | null | undefined): node is YouTubeNode {
  return node instanceof YouTubeNode
}
