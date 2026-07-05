import { describe, it, expect } from 'vitest'
import { applyMediaSelection } from '@/components/admin/media/media-selection'

const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }]

describe('applyMediaSelection', () => {
  it('selects a single item on plain click', () => {
    const result = applyMediaSelection(items, new Set(['b', 'c']), 'd', 'b', {
      shiftKey: false,
      metaKey: false,
      ctrlKey: false,
    })
    expect(result.selectedIds).toEqual(new Set(['d']))
    expect(result.anchorId).toBe('d')
  })

  it('selects a range on shift click', () => {
    const result = applyMediaSelection(items, new Set(['a']), 'c', 'a', {
      shiftKey: true,
      metaKey: false,
      ctrlKey: false,
    })
    expect(result.selectedIds).toEqual(new Set(['a', 'b', 'c']))
    expect(result.anchorId).toBe('a')
  })

  it('toggles an item on cmd click', () => {
    const result = applyMediaSelection(items, new Set(['a', 'b']), 'c', 'a', {
      shiftKey: false,
      metaKey: true,
      ctrlKey: false,
    })
    expect(result.selectedIds).toEqual(new Set(['a', 'b', 'c']))
    expect(result.anchorId).toBe('c')
  })

  it('adds a range on shift cmd click', () => {
    const result = applyMediaSelection(items, new Set(['a']), 'd', 'b', {
      shiftKey: true,
      metaKey: true,
      ctrlKey: false,
    })
    expect(result.selectedIds).toEqual(new Set(['a', 'b', 'c', 'd']))
    expect(result.anchorId).toBe('b')
  })
})
