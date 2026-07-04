export type FloatingPanelPosition = {
  top: string
  left: string
  transform: string
}

const PANEL_MARGIN = 8
export const FLOATING_PANEL_OFFSET = 50

const DEFAULT_FORMAT_PANEL = { width: 420, height: 88 }
const DEFAULT_LINK_PANEL = { width: 320, height: 240 }

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

export function computeFloatingPanelPosition(
  anchorRect: DOMRect,
  panelWidth: number,
  panelHeight: number,
  offset = FLOATING_PANEL_OFFSET
): FloatingPanelPosition {
  const viewportW = window.innerWidth
  const viewportH = window.innerHeight

  let centerX = anchorRect.left + anchorRect.width / 2
  const halfW = panelWidth / 2
  centerX = Math.max(
    PANEL_MARGIN + halfW,
    Math.min(viewportW - PANEL_MARGIN - halfW, centerX)
  )

  const spaceAbove = anchorRect.top - offset - panelHeight
  const spaceBelow = viewportH - anchorRect.bottom - offset - panelHeight
  const preferAbove = spaceAbove >= PANEL_MARGIN || spaceAbove >= spaceBelow

  let top: number
  let transform: string

  if (preferAbove) {
    top = anchorRect.top - offset
    transform = 'translate(-50%, -100%)'
    if (top - panelHeight < PANEL_MARGIN) {
      top = anchorRect.bottom + offset
      transform = 'translate(-50%, 0)'
    }
  } else {
    top = anchorRect.bottom + offset
    transform = 'translate(-50%, 0)'
    if (top + panelHeight > viewportH - PANEL_MARGIN) {
      top = Math.max(PANEL_MARGIN + panelHeight, anchorRect.top - offset)
      transform = 'translate(-50%, -100%)'
    }
  }

  return {
    top: `${top}px`,
    left: `${centerX}px`,
    transform,
  }
}

export function getDefaultPanelSize(mode: 'format' | 'link') {
  return mode === 'link' ? DEFAULT_LINK_PANEL : DEFAULT_FORMAT_PANEL
}
