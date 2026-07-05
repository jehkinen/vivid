import { NextRequest, NextResponse } from 'next/server'
import { authedHandler } from '@/lib/authed-handler'
import { mediaService } from '@/services/media.service'
import { parseSearchParams } from '@/lib/validators/parse'
import { mediaLibraryQuerySchema } from '@/lib/validators/query-schemas'

export const GET = authedHandler(async (request: NextRequest) => {
  const query = parseSearchParams(mediaLibraryQuerySchema, request.nextUrl.searchParams)
  const result = await mediaService.getLibrary(query)
  return NextResponse.json(result)
})
