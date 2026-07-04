/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { LexicalEditor } from 'lexical'
import {
  getSelectionAnchorRect,
  getLinkAnchorRect,
} from '@/lib/editor/floating-panel-position'

function expectRect(
  actual: DOMRect | null,
  left: number,
  top: number,
  width: number,
  height: number
) {
  expect(actual).toMatchObject({ left, top, width, height })
}

function mockRect(left: number, top: number, width: number, height: number): DOMRect {
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

describe('floating-panel-position (DOM)', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="editor-root"></div>'
  })

  it('getSelectionAnchorRect returns full link rect when caret is inside anchor', () => {
    const root = document.getElementById('editor-root')!
    root.innerHTML = '<p>before <a href="https://example.com">link text</a> after</p>'
    const anchor = root.querySelector('a')!
    vi.spyOn(anchor, 'getBoundingClientRect').mockReturnValue(mockRect(100, 200, 80, 18))

    const textNode = anchor.firstChild!
    const range = document.createRange()
    range.setStart(textNode, 3)
    range.setEnd(textNode, 3)
    vi.spyOn(range, 'getBoundingClientRect').mockReturnValue(mockRect(115, 200, 2, 18))

    const sel = window.getSelection()!
    sel.removeAllRanges()
    sel.addRange(range)

    const anchorRect = getSelectionAnchorRect(root)

    expectRect(anchorRect, 100, 200, 80, 18)
  })

  it('getLinkAnchorRect resolves anchor element from link node key', () => {
    const root = document.getElementById('editor-root')!
    const anchor = document.createElement('a')
    anchor.href = 'https://example.com'
    anchor.textContent = 'My link'
    root.appendChild(anchor)
    vi.spyOn(anchor, 'getBoundingClientRect').mockReturnValue(mockRect(50, 120, 90, 20))

    const editor = {
      getRootElement: () => root,
      getElementByKey: () => anchor,
    } as unknown as LexicalEditor

    expectRect(getLinkAnchorRect(editor, 'link-key'), 50, 120, 90, 20)
  })

  it('getLinkAnchorRect uses closest anchor when element is nested', () => {
    const root = document.getElementById('editor-root')!
    const anchor = document.createElement('a')
    anchor.href = 'https://example.com'
    const span = document.createElement('span')
    span.textContent = 'nested'
    anchor.appendChild(span)
    root.appendChild(anchor)
    vi.spyOn(anchor, 'getBoundingClientRect').mockReturnValue(mockRect(10, 10, 60, 16))

    const editor = {
      getRootElement: () => root,
      getElementByKey: () => span,
    } as unknown as LexicalEditor

    expectRect(getLinkAnchorRect(editor, 'span-key'), 10, 10, 60, 16)
  })
})
