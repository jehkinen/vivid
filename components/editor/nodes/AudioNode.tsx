'use client'

import { $getNodeByKey } from 'lexical'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  DecoratorNode,
  NodeKey,
  LexicalNode,
  SerializedLexicalNode,
  Spread,
} from 'lexical'
import { ReactNode, useCallback } from 'react'
import { XIcon, MusicNotesIcon } from '@phosphor-icons/react'
import { LEXICAL_NODE_TYPE } from '@/shared/constants'
import { useMediaUrl } from '@/hooks/use-media-url'

export interface AudioPayload {
  src: string
  title?: string
  mediaId?: string
}

export type SerializedAudioNode = Spread<
  {
    src: string
    title?: string
    mediaId?: string
  },
  SerializedLexicalNode
>

function AudioComponent({
  src,
  title,
  mediaId,
  nodeKey,
}: AudioPayload & { nodeKey: string }) {
  const [editor] = useLexicalComposerContext()
  const resolvedUrl = useMediaUrl(mediaId)
  const audioSrc = mediaId ? (resolvedUrl ?? '') : src

  const handleRemove = useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey)
      if (node && $isAudioNode(node)) node.remove()
    })
  }, [editor, nodeKey])

  return (
    <figure className="group relative my-6">
      {audioSrc ? (
        <div className="rounded-lg border border-border bg-muted p-4">
          <audio controls className="w-full max-w-full" preload="metadata">
            <source src={audioSrc} />
          </audio>
        </div>
      ) : (
        <div className="flex min-h-[80px] flex-col items-center justify-center gap-2 rounded-lg border border-border bg-muted py-6 text-muted-foreground">
          <MusicNotesIcon size={32} className="shrink-0" />
          <span>Audio unavailable</span>
        </div>
      )}
      <button
        type="button"
        onClick={handleRemove}
        className="absolute right-2 top-2 z-10 rounded p-1.5 bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/70"
        aria-label="Remove audio"
      >
        <XIcon size={16} />
      </button>
      {title && (
        <figcaption className="text-sm text-muted-foreground mt-2 text-center">
          {title}
        </figcaption>
      )}
    </figure>
  )
}

export class AudioNode extends DecoratorNode<ReactNode> {
  __src: string
  __title?: string
  __mediaId?: string

  static getType(): string {
    return LEXICAL_NODE_TYPE.AUDIO
  }

  static clone(node: AudioNode): AudioNode {
    return new AudioNode(
      {
        src: node.__src,
        title: node.__title,
        mediaId: node.__mediaId,
      },
      node.__key
    )
  }

  constructor(payload: AudioPayload, key?: NodeKey) {
    super(key)
    this.__src = payload.src
    this.__title = payload.title
    this.__mediaId = payload.mediaId
  }

  createDOM(): HTMLElement {
    const span = document.createElement('span')
    return span
  }

  updateDOM(): false {
    return false
  }

  static importJSON(serializedNode: SerializedAudioNode): AudioNode {
    const { src, title, mediaId } = serializedNode
    return $createAudioNode({ src, title, mediaId })
  }

  exportJSON(): SerializedAudioNode {
    return {
      src: this.__src,
      title: this.__title,
      mediaId: this.__mediaId,
      type: LEXICAL_NODE_TYPE.AUDIO,
      version: 1,
    }
  }

  decorate(): ReactNode {
    return (
      <AudioComponent
        src={this.__src}
        title={this.__title}
        mediaId={this.__mediaId}
        nodeKey={this.getKey()}
      />
    )
  }

  setSrc(src: string): void {
    const writable = this.getWritable()
    writable.__src = src
  }

  setTitle(title: string): void {
    const writable = this.getWritable()
    writable.__title = title
  }

  setMediaId(mediaId: string): void {
    const writable = this.getWritable()
    writable.__mediaId = mediaId
  }
}

export function $createAudioNode(payload: AudioPayload): AudioNode {
  return new AudioNode(payload)
}

export function $isAudioNode(node: LexicalNode | null | undefined): node is AudioNode {
  return node instanceof AudioNode
}
