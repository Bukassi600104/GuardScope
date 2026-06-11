export const BACKEND_URL = 'https://guardscope.app'

export function websiteUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${BACKEND_URL}${normalizedPath}`
}
