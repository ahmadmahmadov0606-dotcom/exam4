import api, { resource } from './client'

export const notificationsApi = {
  ...resource('/notifications'),
  readAll: () => api.post('/notifications/read_all/'),
}
