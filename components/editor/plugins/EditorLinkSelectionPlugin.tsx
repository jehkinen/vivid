'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getNearestNodeFromDOMNode } from 'lexical'
import { $isLinkNode } from '@lexical/link'
import { $findMatchingParent, isHTMLAnchorElement } from '@lexical/utils'
import { useEffect } from 'react'
import { $buildLinkSessionFromKey } from '@/lib/editor/link-utils'
import { useEditorFloatingUI } from '../floating/EditorFloatingUIContext'

function findAnchorInRoot(target: EventTarget | null, root: HTMLElement): HTMLAnchorElement | null {
  if (!(target instanceof Node)) return null
  let node: Node | null = target
  while (node && node !== root) {
    if (isHTMLAnchorElement(node)) return node
    node = node.parentNode
  }
  return null
}

function isInsideFloatingUI(target: EventTarget | null): boolean {
  if (!(target instanceof Node)) return false
  const element = target instanceof Element ? target : target.parentElement
  return !!element?.closest('[data-editor-floating-ui]')
}

export function EditorLinkSelectionPlugin() {
  const [editor] = useLexicalComposerContext()
  const { openLinkView } = useEditorFloatingUI()

  useEffect(() => {
    return editor.registerRootListener((rootElement) => {
      if (!rootElement) return

      const onClick = (event: MouseEvent) => {
        if (event.button !== 0) return
        if (isInsideFloatingUI(event.target)) return

        const anchor = findAnchorInRoot(event.target, rootElement)
        if (!anchor) return

        event.preventDefault()

        let session = null
        editor.read(() => {
          const nearest = $getNearestNodeFromDOMNode(anchor)
          if (!nearest) return

          const linkNode = $findMatchingParent(nearest, $isLinkNode)
          if (!linkNode || !$isLinkNode(linkNode)) return

          session = $buildLinkSessionFromKey(linkNode.getKey())
        })

        if (session) {
          openLinkView(session)
        }
      }

      const onDragStart = (event: DragEvent) => {
        if (!findAnchorInRoot(event.target, rootElement)) return
        event.preventDefault()
      }

      rootElement.addEventListener('click', onClick, true)
      rootElement.addEventListener('dragstart', onDragStart, true)

      return () => {
        rootElement.removeEventListener('click', onClick, true)
        rootElement.removeEventListener('dragstart', onDragStart, true)
      }
    })
  }, [editor, openLinkView])

  return null
}
