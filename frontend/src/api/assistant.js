import api from './client'

export const assistantApi = {
  status: () => api.get('/assistant/').then((r) => r.data),
  ask: (messages) => api.post('/assistant/', { messages }).then((r) => r.data.reply),
}
