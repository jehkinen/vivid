import { describe, it, expect } from 'vitest'
import { ZodError } from 'zod'
import { parseRequest, parseSearchParams } from '@/lib/validators/parse'
import { postsListQuerySchema, graphQuerySchema } from '@/lib/validators/query-schemas'
import { idParamSchema } from '@/lib/validators/schemas'

describe('parseRequest', () => {
  it('returns parsed data on success', () => {
    expect(parseRequest(idParamSchema, 'clh123456789012345678901')).toBe('clh123456789012345678901')
  })

  it('throws ZodError on failure', () => {
    expect(() => parseRequest(idParamSchema, 'bad')).toThrow(ZodError)
  })
})

describe('parseSearchParams', () => {
  it('parses posts list query with defaults and transforms', () => {
    const params = new URLSearchParams({
      search: 'hello',
      tagIds: 'clh123456789012345678901,clh987654321098765432109',
      sort: 'newest',
      includeDeleted: 'true',
      limit: '50',
      offset: '10',
    })
    const query = parseSearchParams(postsListQuerySchema, params)
    expect(query.search).toBe('hello')
    expect(query.tagIds).toHaveLength(2)
    expect(query.includeDeleted).toBe(true)
    expect(query.limit).toBe(50)
    expect(query.offset).toBe(10)
    expect(query.sort).toBe('newest')
  })

  it('applies default limit and sort when missing', () => {
    const query = parseSearchParams(postsListQuerySchema, new URLSearchParams())
    expect(query.limit).toBe(20)
    expect(query.offset).toBe(0)
    expect(query.sort).toBe('newest')
    expect(query.includeDeleted).toBe(false)
  })
})

describe('graphQuerySchema', () => {
  it('defaults depth to 1 when missing', () => {
    const query = parseSearchParams(
      graphQuerySchema,
      new URLSearchParams({ postId: 'clh123456789012345678901' })
    )
    expect(query.postId).toBe('clh123456789012345678901')
    expect(query.depth).toBe(1)
  })

  it('coerces depth within bounds', () => {
    const query = parseSearchParams(graphQuerySchema, new URLSearchParams({ depth: '2' }))
    expect(query.depth).toBe(2)
  })
})
