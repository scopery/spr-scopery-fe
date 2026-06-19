export type ApiRequestInit = RequestInit & {
  parseJson?: boolean
  skipAuthRedirect?: boolean
  /** Skip the global top loading bar (e.g. debounced autosave). */
  skipGlobalLoading?: boolean
}

export type ApiRequestContext = {
  url: string
  init: ApiRequestInit
}

export type RequestInterceptor = (
  ctx: ApiRequestContext
) => ApiRequestContext | Promise<ApiRequestContext>

export type ResponseInterceptor = <T>(
  ctx: ApiRequestContext,
  data: T
) => T | Promise<T>

export type ErrorInterceptor = (
  ctx: ApiRequestContext,
  error: unknown
) => unknown | Promise<unknown>

const requestInterceptors: RequestInterceptor[] = []
const responseInterceptors: ResponseInterceptor[] = []
const errorInterceptors: ErrorInterceptor[] = []

export function registerRequestInterceptor(interceptor: RequestInterceptor): () => void {
  requestInterceptors.push(interceptor)
  return () => {
    const index = requestInterceptors.indexOf(interceptor)
    if (index >= 0) requestInterceptors.splice(index, 1)
  }
}

export function registerResponseInterceptor(interceptor: ResponseInterceptor): () => void {
  responseInterceptors.push(interceptor)
  return () => {
    const index = responseInterceptors.indexOf(interceptor)
    if (index >= 0) responseInterceptors.splice(index, 1)
  }
}

export function registerErrorInterceptor(interceptor: ErrorInterceptor): () => void {
  errorInterceptors.push(interceptor)
  return () => {
    const index = errorInterceptors.indexOf(interceptor)
    if (index >= 0) errorInterceptors.splice(index, 1)
  }
}

export async function runRequestInterceptors(ctx: ApiRequestContext): Promise<ApiRequestContext> {
  let current = ctx
  for (const interceptor of requestInterceptors) {
    current = await interceptor(current)
  }
  return current
}

export async function runResponseInterceptors<T>(
  ctx: ApiRequestContext,
  data: T
): Promise<T> {
  let current = data
  for (const interceptor of responseInterceptors) {
    current = await interceptor(ctx, current)
  }
  return current
}

export async function runErrorInterceptors(
  ctx: ApiRequestContext,
  error: unknown
): Promise<unknown> {
  let current = error
  for (const interceptor of errorInterceptors) {
    current = await interceptor(ctx, current)
  }
  return current
}
