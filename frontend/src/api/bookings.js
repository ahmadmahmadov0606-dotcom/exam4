import { bookingResource } from './client'

export const bookingsApi = {
  restaurant: bookingResource('/restaurant-bookings'),
  car: bookingResource('/car-bookings'),
  service: bookingResource('/service-bookings'),
  product: bookingResource('/orders'),
}
