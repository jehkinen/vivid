import { NextRequest, NextResponse } from 'next/server'
import { authedHandler } from '@/lib/authed-handler'
import { parseJsonBody } from '@/lib/validators/parse'
import { mediaBulkDeleteSchema } from '@/lib/validators/schemas'
import { mediaService } from '@/services/media.service'

export const POST = authedHandler(async (request: NextRequest) => {
  const { ids } = await parseJsonBody(mediaBulkDeleteSchema, request)
  const result = await mediaService.bulkHardDelete(ids)
  return NextResponse.json(result)
})
