import { NextRequest, NextResponse } from 'next/server'
import { tagsService } from '@/services/tags.service'
import { authedHandler } from '@/lib/authed-handler'
import { tagMergeSchema } from '@/lib/validators/schemas'
import { parseJsonBody } from '@/lib/validators/parse'
import { invalidatePublishedTagsCache } from '@/lib/cache-invalidation'

export const POST = authedHandler(async (request: NextRequest) => {
  const data = await parseJsonBody(tagMergeSchema, request)
  const result = await tagsService.merge(data.sourceTagId, data.targetTagId)
  invalidatePublishedTagsCache()
  return NextResponse.json(result)
})
