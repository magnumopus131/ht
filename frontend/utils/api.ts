// Dynamic API URL detection for production
export const getApiUrl = (): string => {
  // Priority 1: Environment variable (set in production)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }
  
  // Priority 2: Auto-detect from hostname (for same-domain deployments)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:'
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      // Try same hostname with :8000, or remove port for subdomain deployments
      return `${protocol}//${hostname}:8000`
    }
  }
  
  // Priority 3: Default to localhost for development
  return 'http://localhost:8000'
}

export const API_URL = getApiUrl()

