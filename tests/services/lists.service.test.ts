import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LIST_VISIBILITY } from '@/shared/constants'

const { listFindMany, listFindUnique } = vi.hoisted(() => ({
  listFindMany: vi.fn(),
  listFindUnique: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    list: {
      findMany: listFindMany,
      findUnique: listFindUnique,
    },
  },
}))

import { listsService } from '@/services/lists.service'

describe('listsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listFindMany.mockResolvedValue([])
    listFindUnique.mockResolvedValue(null)
  })

  it('findManyPublic filters by public visibility', async () => {
    await listsService.findManyPublic()
    expect(listFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { visibility: LIST_VISIBILITY.PUBLIC },
      })
    )
  })

  it('findOne loads list with items', async () => {
    listFindUnique.mockResolvedValue({ id: 'l1', title: 'Tasks', items: [] })
    const result = await listsService.findOne('l1')
    expect(listFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'l1' } })
    )
    expect(result?.id).toBe('l1')
  })
})
