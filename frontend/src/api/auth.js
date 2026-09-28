import api from './client'

const data = (response) => response.data

export const authApi = {
  login: (credentials) => api.post('/auth/login/', credentials).then(data),
  register: (body) => api.post('/auth/register/', body).then(data),
  logout: (refresh) => api.post('/auth/logout/', { refresh }),
  me: () => api.get('/auth/me/').then(data),
  updateMe: (body) => api.patch('/auth/me/', body).then(data),
  changePassword: (body) => api.post('/auth/change-password/', body).then(data),
}
