import { NextRequest, NextResponse } from 'next/server'
import { listsService } from '@/services/lists.service'
import { apiHandler } from '@/lib/api-handler'

export const GET = apiHandler(async (request: NextRequest) => {
  void request
  const lists = await listsService.findManyPublic()
  return NextResponse.json(lists)
})
