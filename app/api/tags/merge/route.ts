import { NextRequest, NextResponse } from 'next/server'
import { tagsService } from '@/services/tags.service'
import { apiHandler } from '@/lib/api-handler'
import { tagMergeSchema, validateRequest } from '@/lib/validators/schemas'

export const POST = apiHandler(async (request: NextRequest) => {
  const body = await request.json()
  const validation = validateRequest(tagMergeSchema, body)

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', errors: validation.errors },
      { status: 400 }
    )
  }

  const result = await tagsService.merge(validation.data.sourceTagId, validation.data.targetTagId)
  return NextResponse.json(result)
})
