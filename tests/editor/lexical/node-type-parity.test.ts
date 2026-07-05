import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { LEXICAL_NODE_TYPE } from '@/shared/constants'

const postContentSource = readFileSync(
  join(process.cwd(), 'components/public/PostContent.tsx'),
  'utf8'
)

describe('PostContent node type parity', () => {
  it('handles every LEXICAL_NODE_TYPE value', () => {
    const missing: string[] = []
    for (const type of Object.values(LEXICAL_NODE_TYPE)) {
      const patterns = [
        `node.type === LEXICAL_NODE_TYPE.${type.toUpperCase().replace(/-/g, '_')}`,
        `LEXICAL_NODE_TYPE.${type.toUpperCase().replace(/-/g, '_')}`,
      ]
      const enumKey = Object.entries(LEXICAL_NODE_TYPE).find(([, v]) => v === type)?.[0]
      const hasReference =
        (enumKey && postContentSource.includes(`LEXICAL_NODE_TYPE.${enumKey}`)) ||
        postContentSource.includes(`'${type}'`) ||
        postContentSource.includes(`"${type}"`)
      if (!hasReference) {
        missing.push(type)
      }
    }
    expect(missing).toEqual([])
  })

  it('includes AUDIO in decorator block types', () => {
    expect(postContentSource).toContain('LEXICAL_NODE_TYPE.AUDIO')
    expect(postContentSource).toContain('DECORATOR_BLOCK_TYPES')
  })
})
