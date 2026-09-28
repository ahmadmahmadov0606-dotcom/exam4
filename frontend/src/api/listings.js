import { carsApi } from './cars'
import { productsApi } from './products'
import { restaurantsApi } from './restaurants'
import { servicesApi } from './services'

export const listingsApi = {
  restaurant: restaurantsApi,
  car: carsApi,
  service: servicesApi,
  product: productsApi,
}
