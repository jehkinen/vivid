import { NextRequest, NextResponse } from 'next/server'
import { tagsService } from '@/services/tags.service'
import { apiHandler } from '@/lib/api-handler'
import { unauthorizedUnlessAuthed } from '@/lib/require-auth-request'

export const GET = apiHandler(async (request: NextRequest) => {
  const denied = await unauthorizedUnlessAuthed(request)
  if (denied) return denied

  const search = request.nextUrl.searchParams.get('search')?.trim()
  const tags = await tagsService.findManyWithPublishedPostCount()
  let result = tags.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    color: t.color,
    postCount: t.postCount,
  }))
  if (search) {
    const q = search.toLowerCase()
    result = result.filter(
      (t) => t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q)
    )
  }
  return NextResponse.json(result)
})
