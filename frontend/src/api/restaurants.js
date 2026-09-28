import api, { listingResource, resource } from './client'

export const restaurantsApi = {
  ...listingResource('/restaurants'),
  busyDates: (id) => api.get(`/restaurants/${id}/busy_dates/`).then((r) => r.data),
}

export const restaurantImagesApi = resource('/restaurant-images')
