import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL

export const tokens = {
  get access() {
    return localStorage.getItem('access')
  },
  get refresh() {
    return localStorage.getItem('refresh')
  },
  set({ access, refresh }) {
    localStorage.setItem('access', access)
    if (refresh) localStorage.setItem('refresh', refresh)
  },
  clear() {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
  },
}

const api = axios.create({ baseURL })

api.interceptors.request.use((config) => {
  if (tokens.access) config.headers.Authorization = `Bearer ${tokens.access}`
  return config
})

// Refresh tokens rotate, so parallel 401s must share one refresh request.
let refreshing = null

function refreshTokens() {
  refreshing ??= axios
    .post(`${baseURL}/auth/refresh/`, { refresh: tokens.refresh })
    .then(({ data }) => tokens.set(data))
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

const NO_REFRESH = ['/auth/login/', '/auth/refresh/', '/auth/register/']

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const canRetry =
      error.response?.status === 401 && !original._retry && tokens.refresh && !NO_REFRESH.includes(original.url)
    if (!canRetry) return Promise.reject(error)

    original._retry = true
    try {
      await refreshTokens()
    } catch {
      tokens.clear()
      window.dispatchEvent(new Event('auth:logout'))
      return Promise.reject(error)
    }
    return api(original)
  },
)

const data = (response) => response.data

function cleanParams(params = {}) {
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined))
}

export function resource(path) {
  return {
    list: (params) => api.get(`${path}/`, { params: cleanParams(params) }).then(data),
    async listAll(params) {
      let page = await api.get(`${path}/`, { params: cleanParams(params) }).then(data)
      const items = [...page.results]
      while (page.next) {
        page = await api.get(page.next).then(data)
        items.push(...page.results)
      }
      return items
    },
    get: (id) => api.get(`${path}/${id}/`).then(data),
    create: (body) => api.post(`${path}/`, body).then(data),
    update: (id, body) => api.patch(`${path}/${id}/`, body).then(data),
    remove: (id) => api.delete(`${path}/${id}/`),
  }
}

export function listingResource(path) {
  return {
    ...resource(path),
    mine: (params) => api.get(`${path}/mine/`, { params: cleanParams(params) }).then(data),
  }
}

export function bookingResource(path) {
  return {
    ...resource(path),
    cancel: (id) => api.post(`${path}/${id}/cancel/`).then(data),
    setStatus: (id, status) => api.post(`${path}/${id}/set_status/`, { status }).then(data),
  }
}

export default api
