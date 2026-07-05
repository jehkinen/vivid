export type MediaSelectionModifiers = {
  shiftKey: boolean
  metaKey: boolean
  ctrlKey: boolean
}

export function mediaSelectionModifiers(event: {
  shiftKey: boolean
  metaKey: boolean
  ctrlKey: boolean
}): MediaSelectionModifiers {
  return {
    shiftKey: event.shiftKey,
    metaKey: event.metaKey,
    ctrlKey: event.ctrlKey,
  }
}

export function applyMediaSelection(
  items: ReadonlyArray<{ id: string }>,
  selectedIds: ReadonlySet<string>,
  targetId: string,
  anchorId: string | null,
  modifiers: MediaSelectionModifiers
): { selectedIds: Set<string>; anchorId: string } {
  const targetIndex = items.findIndex((item) => item.id === targetId)
  if (targetIndex === -1) {
    return {
      selectedIds: new Set(selectedIds),
      anchorId: anchorId ?? targetId,
    }
  }

  const additive = modifiers.metaKey || modifiers.ctrlKey
  const resolvedAnchorId = anchorId ?? targetId

  if (modifiers.shiftKey) {
    const anchorIndex = items.findIndex((item) => item.id === resolvedAnchorId)
    const start = anchorIndex === -1 ? targetIndex : Math.min(anchorIndex, targetIndex)
    const end = anchorIndex === -1 ? targetIndex : Math.max(anchorIndex, targetIndex)
    const rangeIds = items.slice(start, end + 1).map((item) => item.id)

    if (additive) {
      const next = new Set(selectedIds)
      for (const id of rangeIds) next.add(id)
      return { selectedIds: next, anchorId: resolvedAnchorId }
    }

    return { selectedIds: new Set(rangeIds), anchorId: resolvedAnchorId }
  }

  if (additive) {
    const next = new Set(selectedIds)
    if (next.has(targetId)) next.delete(targetId)
    else next.add(targetId)
    return { selectedIds: next, anchorId: targetId }
  }

  return { selectedIds: new Set([targetId]), anchorId: targetId }
}
