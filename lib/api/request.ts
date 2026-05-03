export interface ApiError extends Error {
  status: number
  code?: string
  details?: unknown
}

type QueryValue = string | number | boolean | null | undefined

export interface RequestOptions {
  path: string
  method?: string
  query?: Record<string, QueryValue | QueryValue[]>
  body?: unknown
  signal?: AbortSignal
}

function buildSearchParams(query?: RequestOptions['query']) {
  const params = new URLSearchParams()
  if (!query) return params

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    if (Array.isArray(value)) {
      value.forEach((v) => {
        if (v === undefined || v === null) return
        params.append(key, String(v))
      })
      return
    }
    params.set(key, String(value))
  })

  return params
}

export async function apiRequest<T>(options: RequestOptions): Promise<T> {
  const method = options.method ?? 'GET'
  const basePath = options.path.startsWith('/') ? options.path : `/${options.path}`

  const searchParams = buildSearchParams(options.query)
  const queryString = searchParams.toString()
  const url = queryString ? `${basePath}?${queryString}` : basePath

  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    signal: options.signal,
  }

  if (options.body !== undefined) {
    init.body = JSON.stringify(options.body)
  }

  const response = await fetch(url, init)

  let data: unknown = null
  const text = await response.text()
  if (text) {
    try {
      data = JSON.parse(text) as unknown
    } catch {
      data = text
    }
  }

  if (!response.ok) {
    const errBody = data && typeof data === 'object' ? (data as Record<string, unknown>) : null
    const messageFromBody =
      (errBody && typeof errBody.error === 'string' && errBody.error) ||
      (errBody && typeof errBody.message === 'string' && errBody.message) ||
      `Request failed with status ${response.status}`
    const error: ApiError = new Error(messageFromBody) as ApiError
    error.status = response.status
    if (data && typeof data === 'object') {
      if ('code' in data && typeof (data as Record<string, unknown>).code === 'string') {
        error.code = (data as Record<string, unknown>).code as string
      }
      error.details = data
    }
    throw error
  }

  return data as T
}

