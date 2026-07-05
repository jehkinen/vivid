import { NextRequest, NextResponse } from 'next/server'
import { authedHandler } from '@/lib/authed-handler'
import { mediaGetSchema } from '@/lib/validators/schemas'
import { parseSearchParams } from '@/lib/validators/parse'
import { mediaDeleteQuerySchema } from '@/lib/validators/query-schemas'
import { mediaService } from '@/services/media.service'

export const GET = authedHandler(async (request: NextRequest) => {
  const query = parseSearchParams(mediaGetSchema, request.nextUrl.searchParams)
  const media = await mediaService.findMany(
    query.mediableType,
    query.mediableId,
    query.collection
  )

  if (query.conversion) {
    const mediaWithConversions = await Promise.all(
      media.map(async (m) => {
        const conversionUrl = await mediaService.getConversionUrl(m, query.conversion!)
        return { ...m, conversionUrl }
      })
    )
    return NextResponse.json(mediaWithConversions)
  }

  return NextResponse.json(media)
})

export const DELETE = authedHandler(async (request: NextRequest) => {
  const { id } = parseSearchParams(mediaDeleteQuerySchema, request.nextUrl.searchParams)
  await mediaService.softDelete(id)
  return NextResponse.json({ success: true })
})
