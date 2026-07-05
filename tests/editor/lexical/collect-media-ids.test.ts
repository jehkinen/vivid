import { describe, it, expect } from 'vitest'
import { collectMediaIds, extractMediaReferences } from '@/lib/editor/lexical/collect-media-ids'
import { LEXICAL_NODE_TYPE } from '@/shared/constants'

function lexicalDoc(...children: unknown[]) {
  return JSON.stringify({ root: { children } })
}

describe('extractMediaReferences', () => {
  it('collects image mediaId', () => {
    const json = lexicalDoc({
      type: LEXICAL_NODE_TYPE.IMAGE,
      src: '',
      mediaId: 'img-1',
    })
    expect(extractMediaReferences(json)).toEqual([{ src: '', mediaId: 'img-1' }])
  })

  it('collects audio mediaId', () => {
    const json = lexicalDoc({
      type: LEXICAL_NODE_TYPE.AUDIO,
      src: '',
      mediaId: 'audio-1',
    })
    expect(extractMediaReferences(json)).toEqual([{ src: '', mediaId: 'audio-1' }])
  })

  it('collects gallery image mediaIds', () => {
    const json = lexicalDoc({
      type: LEXICAL_NODE_TYPE.GALLERY,
      images: [
        { src: '', mediaId: 'g1' },
        { src: '', mediaId: 'g2' },
      ],
    })
    expect(extractMediaReferences(json)).toEqual([
      { src: '', mediaId: 'g1' },
      { src: '', mediaId: 'g2' },
    ])
  })
})

describe('collectMediaIds', () => {
  it('returns only mediaId values', () => {
    const json = lexicalDoc(
      { type: LEXICAL_NODE_TYPE.IMAGE, src: '', mediaId: 'a' },
      { type: LEXICAL_NODE_TYPE.AUDIO, src: '', mediaId: 'b' }
    )
    expect(collectMediaIds(json)).toEqual(['a', 'b'])
  })
})
