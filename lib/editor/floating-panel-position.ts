import type { LexicalEditor, NodeKey } from 'lexical'

export type FloatingPanelPosition = {
  top: string
  left: string
  transform: string
}

const PANEL_MARGIN = 8
export const FLOATING_PANEL_OFFSET = 24
export const LINK_UI_OFFSET = 6
export const LINK_POPOVER_OFFSET = LINK_UI_OFFSET

const DEFAULT_FORMAT_PANEL = { width: 420, height: 100 }
const DEFAULT_LINK_PREVIEW_PANEL = { width: 420, height: 44 }
const DEFAULT_LINK_EDIT_PANEL = { width: 420, height: 160 }

export function getSelectionAnchorRect(rootElement: HTMLElement | null): DOMRect | null {
  const domSelection = window.getSelection()
  if (!domSelection || domSelection.rangeCount === 0) return null

  const range = domSelection.getRangeAt(0)
  if (!range) return null

  const commonAncestor = range.commonAncestorContainer
  const ancestorNode =
    commonAncestor.nodeType === Node.TEXT_NODE
      ? commonAncestor.parentElement
      : (commonAncestor as Element)

  if (!ancestorNode || !rootElement?.contains(ancestorNode)) return null

  let rect = range.getBoundingClientRect()

  const startElement =
    range.startContainer.nodeType === Node.TEXT_NODE
      ? range.startContainer.parentElement
      : (range.startContainer as Element)
  const linkAnchor = startElement?.closest('a')
  if (linkAnchor && rootElement.contains(linkAnchor)) {
    return linkAnchor.getBoundingClientRect()
  }

  if (rect.width === 0 && rect.height === 0) {
    const element =
      range.startContainer.nodeType === Node.TEXT_NODE
        ? range.startContainer.parentElement
        : (range.startContainer as Element)
    const anchor = element?.closest('a')
    if (anchor) {
      rect = anchor.getBoundingClientRect()
    } else if (element) {
      rect = element.getBoundingClientRect()
    }
  }

  if (rect.width === 0 && rect.height === 0) return null
  return rect
}

export function getLinkAnchorRect(editor: LexicalEditor, linkKey: NodeKey): DOMRect | null {
  const rootElement = editor.getRootElement()
  if (!rootElement) return null

  const domElement = editor.getElementByKey(linkKey)
  if (!domElement || !rootElement.contains(domElement)) return null

  const anchor =
    domElement instanceof HTMLAnchorElement ? domElement : domElement.closest('a')
  const target = anchor ?? domElement

  const rect = target.getBoundingClientRect()
  if (rect.width === 0 && rect.height === 0) return null
  return rect
}

function clampCenterX(centerX: number, panelWidth: number, viewportW: number) {
  const halfW = panelWidth / 2
  return Math.max(
    PANEL_MARGIN + halfW,
    Math.min(viewportW - PANEL_MARGIN - halfW, centerX)
  )
}

function clampLeft(left: number, panelWidth: number, viewportW: number) {
  return Math.max(PANEL_MARGIN, Math.min(viewportW - PANEL_MARGIN - panelWidth, left))
}

function linkPanelLeft(anchorRect: DOMRect, panelWidth: number, viewportW: number) {
  const centered = anchorRect.left + anchorRect.width / 2 - panelWidth / 2
  return clampLeft(centered, panelWidth, viewportW)
}

export function computePanelPositionAboveLink(
  anchorRect: DOMRect,
  panelWidth: number,
  panelHeight: number,
  offset = LINK_UI_OFFSET
): FloatingPanelPosition {
  const viewportW = window.innerWidth
  const left = linkPanelLeft(anchorRect, panelWidth, viewportW)

  let top = anchorRect.top - offset
  let transform = 'translate(0, -100%)'

  if (top - panelHeight < PANEL_MARGIN) {
    top = anchorRect.bottom + offset
    transform = 'translate(0, 0)'
  }

  return {
    top: `${top}px`,
    left: `${left}px`,
    transform,
  }
}

export function computePanelPositionBelowLink(
  anchorRect: DOMRect,
  panelWidth: number,
  panelHeight: number,
  offset = LINK_UI_OFFSET
): FloatingPanelPosition {
  const viewportW = window.innerWidth
  const viewportH = window.innerHeight
  const left = linkPanelLeft(anchorRect, panelWidth, viewportW)

  let top = anchorRect.bottom + offset
  const maxTop = viewportH - PANEL_MARGIN - panelHeight
  top = Math.min(Math.max(PANEL_MARGIN, top), maxTop)

  return {
    top: `${top}px`,
    left: `${left}px`,
    transform: 'translate(0, 0)',
  }
}

export function computePanelPositionAboveLeftAligned(
  anchorRect: DOMRect,
  panelWidth: number,
  panelHeight: number,
  offset = FLOATING_PANEL_OFFSET
): FloatingPanelPosition {
  const viewportW = window.innerWidth
  const left = clampLeft(anchorRect.left, panelWidth, viewportW)

  let top = anchorRect.top - offset
  let transform = 'translate(0, -100%)'

  if (top - panelHeight < PANEL_MARGIN) {
    top = anchorRect.bottom + offset
    transform = 'translate(0, 0)'
  }

  return {
    top: `${top}px`,
    left: `${left}px`,
    transform,
  }
}

export function computePanelPositionBelowLeftAligned(
  anchorRect: DOMRect,
  panelWidth: number,
  panelHeight: number,
  offset = LINK_POPOVER_OFFSET
): FloatingPanelPosition {
  const viewportW = window.innerWidth
  const viewportH = window.innerHeight
  const left = clampLeft(anchorRect.left, panelWidth, viewportW)

  let top = anchorRect.bottom + offset
  const maxTop = viewportH - PANEL_MARGIN - panelHeight
  top = Math.min(Math.max(PANEL_MARGIN, top), maxTop)

  return {
    top: `${top}px`,
    left: `${left}px`,
    transform: 'translate(0, 0)',
  }
}

export function computePanelPositionAbove(
  anchorRect: DOMRect,
  panelWidth: number,
  panelHeight: number,
  offset = FLOATING_PANEL_OFFSET
): FloatingPanelPosition {
  const viewportW = window.innerWidth
  const centerX = clampCenterX(
    anchorRect.left + anchorRect.width / 2,
    panelWidth,
    viewportW
  )

  let top = anchorRect.top - offset
  let transform = 'translate(-50%, -100%)'

  if (top - panelHeight < PANEL_MARGIN) {
    top = anchorRect.bottom + offset
    transform = 'translate(-50%, 0)'
  }

  return {
    top: `${top}px`,
    left: `${centerX}px`,
    transform,
  }
}

export function computePanelPositionBelow(
  anchorRect: DOMRect,
  panelWidth: number,
  panelHeight: number,
  offset = LINK_POPOVER_OFFSET
): FloatingPanelPosition {
  const viewportW = window.innerWidth
  const viewportH = window.innerHeight
  const centerX = clampCenterX(
    anchorRect.left + anchorRect.width / 2,
    panelWidth,
    viewportW
  )

  let top = anchorRect.bottom + offset
  const maxTop = viewportH - PANEL_MARGIN - panelHeight
  top = Math.min(Math.max(PANEL_MARGIN, top), maxTop)

  return {
    top: `${top}px`,
    left: `${centerX}px`,
    transform: 'translate(-50%, 0)',
  }
}

export function computeFloatingPanelPosition(
  anchorRect: DOMRect,
  panelWidth: number,
  panelHeight: number,
  offset = FLOATING_PANEL_OFFSET
): FloatingPanelPosition {
  return computePanelPositionAbove(anchorRect, panelWidth, panelHeight, offset)
}

export function getDefaultPanelSize(mode: 'format' | 'link-preview' | 'link-edit') {
  if (mode === 'link-preview') return DEFAULT_LINK_PREVIEW_PANEL
  if (mode === 'link-edit') return DEFAULT_LINK_EDIT_PANEL
  return DEFAULT_FORMAT_PANEL
}
