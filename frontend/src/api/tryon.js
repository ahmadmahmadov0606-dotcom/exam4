import api from './client'

export const tryonApi = {
  // Which AI provider is active: {active: 'fashn' | 'huggingface' | null, providers: [...]}
  status: () => api.get('/tryon/status/').then((r) => r.data),
  // The free provider can take up to two minutes.
  run: (form) => api.post('/tryon/', form, { timeout: 200_000 }).then((r) => r.data),
}
