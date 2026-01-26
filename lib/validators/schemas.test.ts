import { describe, it, expect } from 'vitest'
import {
  postCreateSchema,
  postUpdateSchema,
  validateRequest,
} from './schemas'
import { POST_STATUS, POST_VISIBILITY } from '@/shared/constants'

describe('postCreateSchema', () => {
  it('accepts empty title and no lexical', () => {
    const r = validateRequest(postCreateSchema, {
      slug: 'empty-post',
      status: POST_STATUS.DRAFT,
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.title).toBeUndefined()
      expect(r.data.lexical).toBeUndefined()
    }
  })

  it('accepts title empty string when provided', () => {
    const r = validateRequest(postCreateSchema, {
      title: '',
      slug: 'x',
      status: POST_STATUS.DRAFT,
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.title).toBe('')
  })

  it('accepts lexical null', () => {
    const r = validateRequest(postCreateSchema, {
      slug: 'a',
      status: POST_STATUS.DRAFT,
      lexical: null,
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.lexical).toBeNull()
  })

  it('accepts publishedAt null', () => {
    const r = validateRequest(postCreateSchema, {
      slug: 'a',
      status: POST_STATUS.DRAFT,
      publishedAt: null,
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.publishedAt).toBeNull()
  })

  it('accepts valid lexical JSON', () => {
    const r = validateRequest(postCreateSchema, {
      slug: 'a',
      status: POST_STATUS.DRAFT,
      lexical: '{"root":{"children":[],"direction":null,"format":"","indent":0,"type":"root","version":1}}',
    })
    expect(r.success).toBe(true)
  })

  it('rejects invalid lexical JSON', () => {
    const r = validateRequest(postCreateSchema, {
      slug: 'a',
      status: POST_STATUS.DRAFT,
      lexical: 'not json',
    })
    expect(r.success).toBe(false)
  })

  it('rejects missing slug', () => {
    const r = validateRequest(postCreateSchema, {
      status: POST_STATUS.DRAFT,
    })
    expect(r.success).toBe(false)
  })

  it('rejects invalid slug', () => {
    const r = validateRequest(postCreateSchema, {
      slug: 'UPPER-invalid',
      status: POST_STATUS.DRAFT,
    })
    expect(r.success).toBe(false)
  })
})

describe('postUpdateSchema', () => {
  it('accepts only status (partial update)', () => {
    const r = validateRequest(postUpdateSchema, { status: POST_STATUS.PUBLISHED })
    expect(r.success).toBe(true)
  })

  it('accepts title empty string', () => {
    const r = validateRequest(postUpdateSchema, { title: '' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.title).toBe('')
  })

  it('accepts lexical null', () => {
    const r = validateRequest(postUpdateSchema, { lexical: null })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.lexical).toBeNull()
  })

  it('accepts publishedAt null', () => {
    const r = validateRequest(postUpdateSchema, { publishedAt: null })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.publishedAt).toBeNull()
  })

  it('rejects invalid lexical', () => {
    const r = validateRequest(postUpdateSchema, { lexical: '}{' })
    expect(r.success).toBe(false)
  })
})
