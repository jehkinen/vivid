import { NextRequest, NextResponse } from 'next/server'
import { postsService } from '@/services/posts.service'
import { authedHandler } from '@/lib/authed-handler'
import { parseRouteParams } from '@/lib/validators/parse'
import { idRouteParamsSchema } from '@/lib/validators/query-schemas'

export const PATCH = authedHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await parseRouteParams(idRouteParamsSchema, params)
  await postsService.restore(id)
  return NextResponse.json({ success: true })
})
