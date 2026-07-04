'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { isHTMLAnchorElement } from '@lexical/utils'
import { useEffect } from 'react'

function findAnchorInRoot(target: EventTarget | null, root: HTMLElement): HTMLAnchorElement | null {
  if (!(target instanceof Node)) return null
  let node: Node | null = target
  while (node && node !== root) {
    if (isHTMLAnchorElement(node)) return node
    node = node.parentNode
  }
  return null
}

function isInsideLinkCard(target: EventTarget | null): boolean {
  if (!(target instanceof Node)) return false
  const element = target instanceof Element ? target : target.parentElement
  return !!element?.closest('[data-editor-link-card]')
}

export default function EditorLinkSelectionPlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerRootListener((rootElement) => {
      if (!rootElement) return

      const onMouseDown = (event: MouseEvent) => {
        if (event.button !== 0) return
        if (isInsideLinkCard(event.target)) return
        if (!findAnchorInRoot(event.target, rootElement)) return
        event.preventDefault()
      }

      const onClick = (event: MouseEvent) => {
        if (isInsideLinkCard(event.target)) return
        const anchor = findAnchorInRoot(event.target, rootElement)
        if (!anchor) return
        if (event.metaKey || event.ctrlKey) {
          window.open(anchor.href, '_blank', 'noopener,noreferrer')
        }
        event.preventDefault()
      }

      const onDragStart = (event: DragEvent) => {
        if (!findAnchorInRoot(event.target, rootElement)) return
        event.preventDefault()
      }

      rootElement.addEventListener('mousedown', onMouseDown, true)
      rootElement.addEventListener('click', onClick, true)
      rootElement.addEventListener('dragstart', onDragStart, true)

      return () => {
        rootElement.removeEventListener('mousedown', onMouseDown, true)
        rootElement.removeEventListener('click', onClick, true)
        rootElement.removeEventListener('dragstart', onDragStart, true)
      }
    })
  }, [editor])

  return null
}
