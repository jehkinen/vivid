import { NextRequest, NextResponse } from 'next/server'
import { listsService } from '@/services/lists.service'
import { authedHandler } from '@/lib/authed-handler'
import { listCreateSchema } from '@/lib/validators/schemas'
import { parseJsonBody, parseSearchParams } from '@/lib/validators/parse'
import { listsQuerySchema } from '@/lib/validators/query-schemas'

export const GET = authedHandler(async (request: NextRequest) => {
  const { visibility } = parseSearchParams(listsQuerySchema, request.nextUrl.searchParams)
  const lists = await listsService.findMany(visibility)
  return NextResponse.json(lists)
})

export const POST = authedHandler(async (request: NextRequest) => {
  const data = await parseJsonBody(listCreateSchema, request)
  const list = await listsService.create(data)
  return NextResponse.json(list)
})
