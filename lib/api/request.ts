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

  let data: any = null
  const text = await response.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!response.ok) {
    const error: ApiError = new Error(
      (data && typeof data === 'object' && 'error' in data && (data as any).error) ||
        (data && typeof data === 'object' && 'message' in data && (data as any).message) ||
        `Request failed with status ${response.status}`
    ) as ApiError
    error.status = response.status
    if (data && typeof data === 'object') {
      if ('code' in data && typeof (data as any).code === 'string') {
        error.code = (data as any).code
      }
      error.details = data
    }
    throw error
  }

  return data as T
}

