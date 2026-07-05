import { NextRequest, NextResponse } from 'next/server'
import { authedHandler } from '@/lib/authed-handler'
import { getAuthedAuthorId } from '@/lib/require-auth-request'
import { parseJsonBody, parseRouteParams } from '@/lib/validators/parse'
import { acceptGeneratedCoverSchema } from '@/lib/validators/schemas'
import { idRouteParamsSchema } from '@/lib/validators/query-schemas'
import { coverGenerationService } from '@/services/cover-generation.service'

export const POST = authedHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const authorId = await getAuthedAuthorId(request)
  if (authorId instanceof NextResponse) return authorId

  const { id } = await parseRouteParams(idRouteParamsSchema, params)
  const body = await parseJsonBody(acceptGeneratedCoverSchema, request)

  try {
    const media = await coverGenerationService.acceptGeneratedCover(id, body)
    return NextResponse.json({ media })
  } catch (error) {
    if (error instanceof Error && error.message === 'Post not found') {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    throw error
  }
})
