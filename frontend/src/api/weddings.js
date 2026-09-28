import { resource } from './client'

export const weddingsApi = resource('/weddings')
export const guestsApi = resource('/wedding-guests')
export const tasksApi = resource('/wedding-tasks')
export const expensesApi = resource('/wedding-expenses')
