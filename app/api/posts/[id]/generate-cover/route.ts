import { NextRequest, NextResponse } from 'next/server'
import { authedHandler } from '@/lib/authed-handler'
import { API_ERROR_CODE } from '@/shared/constants'
import { getAuthedAuthorId } from '@/lib/require-auth-request'
import { parseJsonBody, parseRouteParams } from '@/lib/validators/parse'
import { generateCoverSchema } from '@/lib/validators/schemas'
import { idRouteParamsSchema } from '@/lib/validators/query-schemas'
import {
  coverGenerationService,
  OpenAiNotConfiguredError,
} from '@/services/cover-generation.service'

export const POST = authedHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const authorId = await getAuthedAuthorId(request)
  if (authorId instanceof NextResponse) return authorId

  const { id } = await parseRouteParams(idRouteParamsSchema, params)
  const body = await parseJsonBody(generateCoverSchema, request)

  try {
    const result = await coverGenerationService.generateCover(authorId, id, body)
    return NextResponse.json({
      preview: {
        base64: result.previewBase64,
        mimeType: result.mimeType,
        filename: result.filename,
      },
      concept: result.concept,
      scene: result.scene,
      prompt: result.prompt,
    })
  } catch (error) {
    if (error instanceof OpenAiNotConfiguredError) {
      return NextResponse.json(
        { error: error.message, code: API_ERROR_CODE.OPENAI_NOT_CONFIGURED },
        { status: 400 }
      )
    }
    if (error instanceof Error && error.message === 'Post not found') {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    throw error
  }
})
