declare const __API_URL__: string

const BASE_URL = __API_URL__ || window.location.origin

export class ApiError extends Error {
  code: string
  status: number
  data: Record<string, unknown> | null

  constructor(code: string, status: number, data?: Record<string, unknown> | null) {
    super((data?.error as string | undefined) ?? code)
    this.code = code
    this.status = status
    this.data = data ?? null
  }
}

export class PlanLimitError extends Error {
  requiredPlan: 'indie' | 'pro'
  limitType: string

  constructor(message: string, requiredPlan: 'indie' | 'pro', limitType: string) {
    super(message)
    this.name = 'PlanLimitError'
    this.requiredPlan = requiredPlan
    this.limitType = limitType
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isFormData = options.body instanceof FormData
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: isFormData
      ? options.headers
      : { 'Content-Type': 'application/json', ...options.headers },
  })

  if (!res.ok) {
    const json = await res.json().catch(() => null)
    if (res.status === 403 && json?.upgradeRequired) {
      throw new PlanLimitError(
        (json.error as string) ?? 'Upgrade required',
        (json.requiredPlan as 'indie' | 'pro') ?? 'indie',
        (json.limitType as string) ?? 'unknown',
      )
    }
    const code = (json?.code as string | undefined) ?? `HTTP_${res.status}`
    throw new ApiError(code, res.status, json)
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
  /** Multipart upload — does NOT set Content-Type so the browser adds the boundary automatically */
  upload<T>(path: string, formData: FormData, headers?: Record<string, string>) {
    return request<T>(path, { method: 'POST', body: formData, headers })
  },
}
