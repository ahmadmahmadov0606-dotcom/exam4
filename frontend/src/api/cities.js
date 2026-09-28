import api from './client'

export const citiesApi = {
  list: () => api.get('/cities/').then((r) => r.data),
}
