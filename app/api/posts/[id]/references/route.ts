import { NextResponse } from 'next/server'
import { authedHandler } from '@/lib/authed-handler'
import { parseRouteParams } from '@/lib/validators/parse'
import { idRouteParamsSchema } from '@/lib/validators/query-schemas'
import { postReferencesService } from '@/services/post-references.service'

export const GET = authedHandler(async (
  _request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await parseRouteParams(idRouteParamsSchema, params)
  const references = await postReferencesService.findForPost(id)
  return NextResponse.json(references)
})
