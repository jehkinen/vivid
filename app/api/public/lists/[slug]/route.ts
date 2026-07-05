import { NextRequest, NextResponse } from 'next/server'
import { listsService } from '@/services/lists.service'
import { authedHandler } from '@/lib/authed-handler'
import { parseRouteParams } from '@/lib/validators/parse'
import { slugRouteParamsSchema } from '@/lib/validators/query-schemas'

export const GET = authedHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) => {
  const { slug } = await parseRouteParams(slugRouteParamsSchema, params)
  const list = await listsService.findBySlug(slug)
  if (!list) {
    return NextResponse.json({ error: 'List not found' }, { status: 404 })
  }
  return NextResponse.json(list)
})
