import { describe, it, expect } from 'vitest'
import { parseCoverVisualBriefResponse } from '@/lib/ai/parse-cover-visual-brief'

describe('parseCoverVisualBriefResponse', () => {
  it('parses json object with coreMoment and scene', () => {
    const result = parseCoverVisualBriefResponse(
      JSON.stringify({
        coreMoment: 'A girl refuses a gift from a classmate.',
        scene:
          'In a bright school hallway, a young woman turns away with a closed expression while a small gift box stays in an outstretched hand she will not take.',
      })
    )
    expect(result.coreMoment).toContain('refuses a gift')
    expect(result.scene).toContain('school hallway')
  })

  it('parses json wrapped in prose', () => {
    const result = parseCoverVisualBriefResponse(
      `Here is the scene: {"coreMoment":"They say goodbye at the station.","scene":"Two figures on a rain-wet platform, one boarding a train, the other left behind under dim platform lights."}`
    )
    expect(result.coreMoment).toContain('goodbye')
    expect(result.scene).toContain('platform')
  })

  it('falls back coreMoment to scene when missing', () => {
    const result = parseCoverVisualBriefResponse(
      JSON.stringify({
        scene: 'A lone figure beside a sunlit window.',
      })
    )
    expect(result.coreMoment).toBe('A lone figure beside a sunlit window.')
  })
})
