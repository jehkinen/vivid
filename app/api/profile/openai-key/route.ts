import { NextRequest, NextResponse } from 'next/server'
import { authedHandler } from '@/lib/authed-handler'
import { getAuthedAuthorId } from '@/lib/require-auth-request'
import { parseJsonBody } from '@/lib/validators/parse'
import { openAiKeySchema } from '@/lib/validators/schemas'
import { authorSecretsService } from '@/services/author-secrets.service'

export const PUT = authedHandler(async (request: NextRequest) => {
  const authorId = await getAuthedAuthorId(request)
  if (authorId instanceof NextResponse) return authorId

  const body = await parseJsonBody(openAiKeySchema, request)
  const openAi = await authorSecretsService.saveOpenAiKey(authorId, body.apiKey)
  return NextResponse.json({ openAi })
})

export const DELETE = authedHandler(async (request: NextRequest) => {
  const authorId = await getAuthedAuthorId(request)
  if (authorId instanceof NextResponse) return authorId

  await authorSecretsService.deleteOpenAiKey(authorId)
  return NextResponse.json({ openAi: { configured: false } })
})
