import { NextRequest } from 'next/server'
import { apiHandler, type ApiHandler } from '@/lib/api-handler'
import { unauthorizedUnlessAuthed } from '@/lib/require-auth-request'

export function authedHandler<T = void>(handler: ApiHandler<T>): ApiHandler<T> {
  return apiHandler((async (request: NextRequest, context?: T) => {
    const denied = await unauthorizedUnlessAuthed(request)
    if (denied) return denied
    return handler(request, context as T)
  }) as ApiHandler<T>)
}
