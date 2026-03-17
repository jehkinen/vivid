import { NextRequest, NextResponse } from 'next/server'
import { listsService } from '@/services/lists.service'
import { apiHandler } from '@/lib/api-handler'
import { listCreateSchema, validateRequest } from '@/lib/validators/schemas'

export const GET = apiHandler(async (request: NextRequest) => {
  const visibility = request.nextUrl.searchParams.get('visibility') ?? undefined
  const lists = await listsService.findMany(visibility)
  return NextResponse.json(lists)
})

export const POST = apiHandler(async (request: NextRequest) => {
  const body = await request.json()
  const validation = validateRequest(listCreateSchema, body)

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', errors: validation.errors },
      { status: 400 }
    )
  }

  const list = await listsService.create(validation.data)
  return NextResponse.json(list)
})
