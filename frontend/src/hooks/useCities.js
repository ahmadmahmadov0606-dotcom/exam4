import { useQuery } from '@tanstack/react-query'
import { citiesApi } from '../api/cities'

export default function useCities() {
  const { data = [] } = useQuery({ queryKey: ['cities'], queryFn: citiesApi.list, staleTime: Infinity })
  return data
}
