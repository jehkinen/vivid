import { NextRequest, NextResponse } from 'next/server'
import { listsService } from '@/services/lists.service'
import { apiHandler } from '@/lib/api-handler'
import { unauthorizedUnlessAuthed } from '@/lib/require-auth-request'

export const GET = apiHandler(async (request: NextRequest) => {
  const denied = await unauthorizedUnlessAuthed(request)
  if (denied) return denied

  const lists = await listsService.findManyPublic()
  return NextResponse.json(lists)
})
