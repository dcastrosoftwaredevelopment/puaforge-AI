declare const __API_URL__: string

const BASE_URL = __API_URL__ || window.location.origin

export class ApiError extends Error {
  code: string
  status: number

  constructor(code: string, status: number) {
    super(code)
    this.code = code
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!res.ok) {
    const json = await res.json().catch(() => null)
    const code = (json?.code as string | undefined) ?? `HTTP_${res.status}`
    throw new ApiError(code, res.status)
  }

  return res.json() as Promise<T>
}

export const api = {
  get<T>(path: string, headers?: Record<string, string>) {
    return request<T>(path, { method: 'GET', headers })
  },
  post<T>(path: string, body: unknown, headers?: Record<string, string>) {
    return request<T>(path, { method: 'POST', body: JSON.stringify(body), headers })
  },
  put<T>(path: string, body: unknown, headers?: Record<string, string>) {
    return request<T>(path, { method: 'PUT', body: JSON.stringify(body), headers })
  },
  patch<T>(path: string, body: unknown, headers?: Record<string, string>) {
    return request<T>(path, { method: 'PATCH', body: JSON.stringify(body), headers })
  },
  delete<T>(path: string, headers?: Record<string, string>) {
    return request<T>(path, { method: 'DELETE', headers })
  },
}
