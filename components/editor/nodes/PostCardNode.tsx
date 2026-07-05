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

export interface PostCardPayload {
  postId: string
  slug: string
  title: string | null
}

export type SerializedPostCardNode = Spread<
  PostCardPayload,
  SerializedLexicalNode
>

function PostCardPlaceholder({ title, slug }: { title: string | null; slug: string }) {
  return (
    <figure className="my-6 rounded-lg border border-border bg-card p-4 max-w-xl">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
        Post preview
      </p>
      <p className="font-semibold text-foreground">{title || 'Untitled'}</p>
      <p className="text-xs text-muted-foreground mt-1">/{slug}</p>
    </figure>
  )
}

export class PostCardNode extends DecoratorNode<ReactNode> {
  __postId: string
  __slug: string
  __title: string | null

  static getType(): string {
    return LEXICAL_NODE_TYPE.POST_CARD
  }

  static clone(node: PostCardNode): PostCardNode {
    return new PostCardNode(
      { postId: node.__postId, slug: node.__slug, title: node.__title },
      node.__key
    )
  }

  constructor(payload: PostCardPayload, key?: NodeKey) {
    super(key)
    this.__postId = payload.postId
    this.__slug = payload.slug
    this.__title = payload.title
  }

  createDOM(): HTMLElement {
    return document.createElement('div')
  }

  updateDOM(): false {
    return false
  }

  static importJSON(serializedNode: SerializedPostCardNode): PostCardNode {
    return $createPostCardNode({
      postId: serializedNode.postId,
      slug: serializedNode.slug,
      title: serializedNode.title,
    })
  }

  exportJSON(): SerializedPostCardNode {
    return {
      postId: this.__postId,
      slug: this.__slug,
      title: this.__title,
      type: LEXICAL_NODE_TYPE.POST_CARD,
      version: 1,
    }
  }

  decorate(): ReactNode {
    return <PostCardPlaceholder title={this.__title} slug={this.__slug} />
  }

  getPostId(): string {
    return this.__postId
  }
}

export function $createPostCardNode(payload: PostCardPayload): PostCardNode {
  return new PostCardNode(payload)
}

export function $isPostCardNode(node: LexicalNode | null | undefined): node is PostCardNode {
  return node instanceof PostCardNode
}
