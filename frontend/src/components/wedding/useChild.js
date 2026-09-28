import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { showApiError } from '../../utils/errors'

// CRUD for guests / tasks / expenses of one wedding (?wedding=<id>).
export default function useChild(api, name, weddingId) {
  const queryClient = useQueryClient()
  const key = ['wedding', weddingId, name]
  const query = useQuery({ queryKey: key, queryFn: () => api.listAll({ wedding: weddingId }) })

  const onSuccess = () => {
    queryClient.invalidateQueries({ queryKey: key })
    if (name === 'expenses') queryClient.invalidateQueries({ queryKey: ['weddings'] })
  }
  const onError = (e) => showApiError(e)

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    create: useMutation({ mutationFn: (body) => api.create({ ...body, wedding: weddingId }), onSuccess }),
    update: useMutation({ mutationFn: ({ id, ...body }) => api.update(id, body), onSuccess, onError }),
    remove: useMutation({ mutationFn: api.remove, onSuccess, onError }),
  }
}
