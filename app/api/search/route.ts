import { NextRequest, NextResponse } from 'next/server'
import { searchService } from '@/services/search.service'
import { apiHandler } from '@/lib/api-handler'
import { searchQuerySchema, validateRequest } from '@/lib/validators/schemas'
import { unauthorizedUnlessAuthed } from '@/lib/require-auth-request'

export const GET = apiHandler(async (request: NextRequest) => {
  const denied = await unauthorizedUnlessAuthed(request)
  if (denied) return denied

  const searchParams = request.nextUrl.searchParams
  const q = searchParams.get('q') || ''

  const validation = validateRequest(searchQuerySchema, { query: q })

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', errors: validation.errors },
      { status: 400 }
    )
  }

  const results = await searchService.search(validation.data.query)
  return NextResponse.json(results)
})