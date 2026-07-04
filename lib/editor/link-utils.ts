import {
  $isRangeSelection,
  $getSelection,
  $createTextNode,
  $setSelection,
  $createRangeSelection,
  $getNodeByKey,
  $isTextNode,
  type LexicalEditor,
  type RangeSelection,
  type NodeKey,
} from 'lexical'
import {
  $toggleLink,
  $isLinkNode,
  $isAutoLinkNode,
  $createLinkNode,
  formatUrl,
  type AutoLinkNode,
  type LinkNode,
} from '@lexical/link'
import { $findMatchingParent } from '@lexical/utils'

export type SavedLinkSelection = {
  anchorKey: NodeKey
  anchorOffset: number
  anchorType: 'text' | 'element'
  focusKey: NodeKey
  focusOffset: number
  focusType: 'text' | 'element'
}

export function $savedSelectionFromRange(selection: RangeSelection): SavedLinkSelection {
  return {
    anchorKey: selection.anchor.key,
    anchorOffset: selection.anchor.offset,
    anchorType: selection.anchor.type,
    focusKey: selection.focus.key,
    focusOffset: selection.focus.offset,
    focusType: selection.focus.type,
  }
}

export function $saveLinkSelection(): SavedLinkSelection | null {
  const selection = $getSelection()
  if (!$isRangeSelection(selection) || selection.isCollapsed()) return null
  return $savedSelectionFromRange(selection)
}

export function $restoreLinkSelection(saved: SavedLinkSelection | null): RangeSelection | null {
  if (!saved) return null

  const anchorNode = $getNodeByKey(saved.anchorKey)
  const focusNode = $getNodeByKey(saved.focusKey)
  if (!anchorNode?.isAttached() || !focusNode?.isAttached()) {
    return $restoreLinkSelectionOnTextNode(saved.anchorKey)
  }

  const selection = $createRangeSelection()
  selection.anchor.set(saved.anchorKey, saved.anchorOffset, saved.anchorType)
  selection.focus.set(saved.focusKey, saved.focusOffset, saved.focusType)
  $setSelection(selection)

  const current = $getSelection()
  if (!$isRangeSelection(current) || current.isCollapsed()) return null
  return current
}

function $restoreLinkSelectionOnTextNode(nodeKey: NodeKey): RangeSelection | null {
  const node = $getNodeByKey(nodeKey)
  if (!$isTextNode(node) || !node.isAttached()) return null

  const length = node.getTextContent().length
  if (length === 0) return null

  const selection = $createRangeSelection()
  selection.anchor.set(nodeKey, 0, 'text')
  selection.focus.set(nodeKey, length, 'text')
  $setSelection(selection)
  return selection
}

export function $getActiveLinkNode(selection: RangeSelection): LinkNode | null {
  const linkNode = $findMatchingParent(selection.anchor.getNode(), $isLinkNode)
  if (!linkNode) return null
  if ($isAutoLinkNode(linkNode) && linkNode.getIsUnlinked()) return null
  return linkNode
}

export function $isSelectionInLink(selection: RangeSelection): boolean {
  return $getActiveLinkNode(selection) !== null
}

export function $isSelectionInManualLink(selection: RangeSelection): boolean {
  const linkNode = $getActiveLinkNode(selection)
  return linkNode !== null && !$isAutoLinkNode(linkNode)
}

export function $getLinkDisplayText(linkNode: LinkNode): string {
  return linkNode.getTextContent()
}

export function $buildLinkSessionFromKey(linkKey: NodeKey): {
  editingLinkKey: string
  linkText: string
  linkUrl: string
  savedSelection: null
} | null {
  const node = $getNodeByKey(linkKey)
  if (!node || !$isLinkNode(node)) return null
  if ($isAutoLinkNode(node) && node.getIsUnlinked()) return null
  return {
    editingLinkKey: linkKey,
    linkText: $getLinkDisplayText(node),
    linkUrl: node.getURL(),
    savedSelection: null,
  }
}

export function $setLinkDisplayText(linkNode: LinkNode, text: string) {
  const writable = linkNode.getWritable()
  const firstChild = writable.getFirstChild()
  if ($isTextNode(firstChild)) {
    firstChild.getWritable().setTextContent(text)
    firstChild.select(text.length, text.length)
    return
  }
  $setSelection(null)
  writable.getChildren().forEach((child) => child.remove())
  if (text.length > 0) {
    const textNode = $createTextNode(text)
    writable.append(textNode)
    const selection = $createRangeSelection()
    selection.anchor.set(textNode.getKey(), text.length, 'text')
    selection.focus.set(textNode.getKey(), text.length, 'text')
    $setSelection(selection)
    return
  }
  $selectLinkEnd(writable)
}

function $convertAutoLinkToLink(autoLinkNode: AutoLinkNode): LinkNode {
  const linkNode = $createLinkNode(autoLinkNode.getURL(), {
    rel: autoLinkNode.getRel(),
    target: autoLinkNode.getTarget(),
    title: autoLinkNode.getTitle(),
  })
  autoLinkNode.getChildren().forEach((child) => {
    linkNode.append(child)
  })
  autoLinkNode.replace(linkNode)
  return linkNode
}

function $finalizeLinkNode(linkNode: LinkNode): LinkNode {
  if ($isAutoLinkNode(linkNode)) {
    return $convertAutoLinkToLink(linkNode)
  }
  return linkNode
}

function $selectLinkEnd(linkNode: LinkNode) {
  linkNode.selectEnd()
}

export function $removeLinksInSelection() {
  const selection = $getSelection()
  if (!$isRangeSelection(selection)) return

  const autoLinks = new Set<NodeKey>()

  if (selection.isCollapsed()) {
    const linkNode = $getActiveLinkNode(selection)
    if (!linkNode) return
    if ($isAutoLinkNode(linkNode)) {
      if (!linkNode.getIsUnlinked()) {
        linkNode.setIsUnlinked(true)
        linkNode.markDirty()
      }
      return
    }
    linkNode.select(0, linkNode.getChildrenSize())
  } else {
    for (const node of selection.getNodes()) {
      const autoLink = $findMatchingParent(node, $isAutoLinkNode)
      if (autoLink && $isAutoLinkNode(autoLink) && !autoLink.getIsUnlinked()) {
        autoLinks.add(autoLink.getKey())
      }
    }
    for (const key of autoLinks) {
      const autoLink = $getNodeByKey(key)
      if (autoLink && $isAutoLinkNode(autoLink) && !autoLink.getIsUnlinked()) {
        autoLink.setIsUnlinked(true)
        autoLink.markDirty()
      }
    }
  }

  $toggleLink(null)
}

export type CommitLinkEditInput = {
  url: string
  displayText: string
  savedSelection: SavedLinkSelection | null
  editingLinkKey: string | null
}

export function $updateLinkDisplayTextByKey(linkKey: NodeKey, displayText: string) {
  const node = $getNodeByKey(linkKey)
  if (!node || !$isLinkNode(node)) return null

  const text = displayText || node.getTextContent()
  let linkNode = $isAutoLinkNode(node) ? $convertAutoLinkToLink(node) : node
  $setLinkDisplayText(linkNode, text)
  return linkNode
}

export function $commitLinkEdit(editor: LexicalEditor, input: CommitLinkEditInput) {
  const displayText = input.displayText.trim()
  if (!displayText && !input.editingLinkKey) return

  editor.update(
    () => {
      if (input.editingLinkKey) {
        $updateLinkDisplayTextByKey(input.editingLinkKey, displayText || $getNodeByKey(input.editingLinkKey)?.getTextContent() || '')
        return
      }

      const trimmedUrl = input.url.trim()
      if (!trimmedUrl) return

      const formattedUrl = formatUrl(trimmedUrl)
      const finalDisplayText = displayText || trimmedUrl

      if (input.savedSelection) {
        $restoreLinkSelection(input.savedSelection)
      }

      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        const autoLink = $getActiveLinkNode(selection)
        if (autoLink && $isAutoLinkNode(autoLink)) {
          const linkNode = $convertAutoLinkToLink(autoLink)
          linkNode.setURL(formattedUrl)
          if (finalDisplayText !== linkNode.getTextContent()) {
            $setLinkDisplayText(linkNode, finalDisplayText)
          } else {
            $selectLinkEnd(linkNode)
          }
          return
        }

        for (const node of selection.getNodes()) {
          if ($isTextNode(node) && node.hasFormat('code')) {
            node.toggleFormat('code')
          }
        }
      }

      $toggleLink(formattedUrl)

      const after = $getSelection()
      if (!$isRangeSelection(after)) return

      let linkNode = $getActiveLinkNode(after)
      if (!linkNode) {
        const parent = $findMatchingParent(after.anchor.getNode(), $isLinkNode)
        if (parent && $isLinkNode(parent)) {
          linkNode = parent
        }
      }
      if (!linkNode) return

      linkNode = $finalizeLinkNode(linkNode)
      if (finalDisplayText !== linkNode.getTextContent()) {
        $setLinkDisplayText(linkNode, finalDisplayText)
      } else {
        $selectLinkEnd(linkNode)
      }
    },
    { discrete: true }
  )
}
