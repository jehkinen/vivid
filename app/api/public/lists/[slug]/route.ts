import { NextRequest, NextResponse } from 'next/server'
import { listsService } from '@/services/lists.service'
import { apiHandler } from '@/lib/api-handler'
import { slugParamSchema, validateRequest } from '@/lib/validators/schemas'
import { unauthorizedUnlessAuthed } from '@/lib/require-auth-request'

export const GET = apiHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) => {
  const denied = await unauthorizedUnlessAuthed(request)
  if (denied) return denied

  const { slug } = await params
  const slugValidation = validateRequest(slugParamSchema, slug)
  if (!slugValidation.success) {
    return NextResponse.json(
      { error: 'Validation failed', errors: slugValidation.errors },
      { status: 400 }
    )
  }
  const list = await listsService.findBySlug(slugValidation.data)
  if (!list) {
    return NextResponse.json({ error: 'List not found' }, { status: 404 })
  }
  return NextResponse.json(list)
})
