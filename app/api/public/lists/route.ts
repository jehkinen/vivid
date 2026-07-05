import { NextRequest, NextResponse } from 'next/server'
import { listsService } from '@/services/lists.service'
import { authedHandler } from '@/lib/authed-handler'

export const GET = authedHandler(async () => {
  const lists = await listsService.findManyPublic()
  return NextResponse.json(lists)
})
