import type { NextRequest } from 'next/server'
import { z } from 'zod'

export function parseRequest<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  return schema.parse(data)
}

export function searchParamsToObject(params: URLSearchParams): Record<string, string> {
  const obj: Record<string, string> = {}
  params.forEach((value, key) => {
    obj[key] = value
  })
  return obj
}

export function parseSearchParams<T extends z.ZodTypeAny>(
  schema: T,
  params: URLSearchParams
): z.infer<T> {
  return schema.parse(searchParamsToObject(params))
}

export async function parseRouteParams<T extends z.ZodTypeAny>(
  schema: T,
  params: Promise<Record<string, string>>
): Promise<z.infer<T>> {
  return schema.parse(await params)
}

export async function parseJsonBody<T extends z.ZodTypeAny>(
  schema: T,
  request: NextRequest
): Promise<z.infer<T>> {
  return schema.parse(await request.json())
}
