import { NextRequest, NextResponse } from 'next/server'
import { authedHandler } from '@/lib/authed-handler'
import { parseSearchParams } from '@/lib/validators/parse'
import { graphQuerySchema } from '@/lib/validators/query-schemas'
import { postReferencesService } from '@/services/post-references.service'

export const GET = authedHandler(async (request: NextRequest) => {
  const query = parseSearchParams(graphQuerySchema, request.nextUrl.searchParams)
  const graph = await postReferencesService.getSubgraph({
    postId: query.postId,
    depth: query.depth,
  })
  return NextResponse.json(graph)
})
