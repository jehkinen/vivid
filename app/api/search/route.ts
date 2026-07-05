import { NextRequest, NextResponse } from 'next/server'
import { searchService } from '@/services/search.service'
import { authedHandler } from '@/lib/authed-handler'
import { parseSearchParams } from '@/lib/validators/parse'
import { searchQueryParamsSchema } from '@/lib/validators/query-schemas'

export const GET = authedHandler(async (request: NextRequest) => {
  const { query } = parseSearchParams(searchQueryParamsSchema, request.nextUrl.searchParams)
  const results = await searchService.search(query)
  return NextResponse.json(results)
})
