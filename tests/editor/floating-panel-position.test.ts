import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  computePanelPositionAbove,
  computePanelPositionBelow,
  computePanelPositionAboveLink,
  computePanelPositionBelowLink,
  computePanelPositionAboveLeftAligned,
  computeFloatingPanelPosition,
  getDefaultPanelSize,
  FLOATING_PANEL_OFFSET,
  LINK_UI_OFFSET,
} from '@/lib/editor/floating-panel-position'

function rect(
  left: number,
  top: number,
  width: number,
  height: number
): DOMRect {
  return {
    x: left,
    y: top,
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
    toJSON: () => ({}),
  } as DOMRect
}

describe('floating-panel-position (layout math)', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      innerWidth: 1000,
      innerHeight: 800,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('computePanelPositionAbove', () => {
    it('centers horizontally and places panel above anchor with offset', () => {
      const anchor = rect(200, 300, 100, 24)
      const position = computePanelPositionAbove(anchor, 200, 80, 14)

      expect(position.left).toBe('250px')
      expect(position.top).toBe('286px')
      expect(position.transform).toBe('translate(-50%, -100%)')
    })

    it('flips below anchor when there is no room above', () => {
      const anchor = rect(200, 10, 100, 20)
      const position = computePanelPositionAbove(anchor, 200, 80, 14)

      expect(position.top).toBe('44px')
      expect(position.transform).toBe('translate(-50%, 0)')
    })

    it('clamps center x inside viewport margins', () => {
      const anchor = rect(20, 300, 40, 20)
      const position = computePanelPositionAbove(anchor, 400, 80, 14)

      expect(parseInt(position.left, 10)).toBeGreaterThanOrEqual(208)
    })
  })

  describe('computePanelPositionBelow', () => {
    it('places panel below anchor center', () => {
      const anchor = rect(100, 200, 80, 20)
      const position = computePanelPositionBelow(anchor, 160, 60, 8)

      expect(position.left).toBe('140px')
      expect(position.top).toBe('228px')
      expect(position.transform).toBe('translate(-50%, 0)')
    })
  })

  describe('computePanelPositionAboveLink', () => {
    it('aligns link panel to anchor center', () => {
      const anchor = rect(100, 200, 60, 18)
      const position = computePanelPositionAboveLink(anchor, 420, 44, LINK_UI_OFFSET)

      expect(position.left).toBe('8px')
      expect(position.transform).toBe('translate(0, -100%)')
    })

    it('flips below when anchor is near top edge', () => {
      const anchor = rect(100, 4, 60, 18)
      const position = computePanelPositionAboveLink(anchor, 420, 44, LINK_UI_OFFSET)

      expect(position.transform).toBe('translate(0, 0)')
      expect(parseInt(position.top, 10)).toBeGreaterThan(anchor.bottom)
    })
  })

  describe('computePanelPositionBelowLink', () => {
    it('places link editor below anchor', () => {
      const anchor = rect(120, 180, 90, 20)
      const position = computePanelPositionBelowLink(anchor, 420, 160, LINK_UI_OFFSET)

      expect(position.top).toBe(`${180 + 20 + LINK_UI_OFFSET}px`)
      expect(position.transform).toBe('translate(0, 0)')
    })
  })

  describe('computePanelPositionAboveLeftAligned', () => {
    it('aligns left edge to anchor left', () => {
      const anchor = rect(150, 250, 200, 22)
      const position = computePanelPositionAboveLeftAligned(
        anchor,
        300,
        50,
        FLOATING_PANEL_OFFSET
      )

      expect(position.left).toBe('150px')
      expect(position.transform).toBe('translate(0, -100%)')
    })
  })

  describe('computeFloatingPanelPosition', () => {
    it('delegates to computePanelPositionAbove', () => {
      const anchor = rect(200, 300, 100, 24)
      expect(computeFloatingPanelPosition(anchor, 200, 80, 14)).toEqual(
        computePanelPositionAbove(anchor, 200, 80, 14)
      )
    })
  })

  describe('getDefaultPanelSize', () => {
    it('returns sizes for each panel mode', () => {
      expect(getDefaultPanelSize('format').width).toBe(420)
      expect(getDefaultPanelSize('link-preview').height).toBe(44)
      expect(getDefaultPanelSize('link-edit').height).toBe(160)
    })
  })
})
