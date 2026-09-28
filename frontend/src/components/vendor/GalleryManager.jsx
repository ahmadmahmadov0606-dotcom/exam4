import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { restaurantImagesApi } from '../../api/restaurants'
import { showApiError, toFormData } from '../../utils/errors'
import Icon from '../Icon'

// Extra photos of one restaurant, shown in the gallery on its page.
export default function GalleryManager({ restaurant }) {
  const queryClient = useQueryClient()
  const key = ['restaurant-images', restaurant.id]
  const { data: images = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: () => restaurantImagesApi.listAll({ restaurant: restaurant.id }),
  })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: key })
    queryClient.invalidateQueries({ queryKey: ['restaurants', String(restaurant.id)] })
  }
  const upload = useMutation({
    mutationFn: async (files) => {
      for (const file of files) await restaurantImagesApi.create(toFormData({ restaurant: restaurant.id, image: file }))
    },
    onSuccess: (_, files) => {
      toast.success(`${files.length} сурат илова шуд`)
      refresh()
    },
    onError: (e) => showApiError(e),
    onSettled: refresh,
  })
  const remove = useMutation({ mutationFn: restaurantImagesApi.remove, onSuccess: refresh, onError: (e) => showApiError(e) })

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="skeleton h-32" />
      ) : images.length === 0 ? (
        <p className="rounded-xl bg-ivory p-4 text-center text-sm text-muted">Ҳоло сурати иловагӣ нест.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {images.map((img) => (
            <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg">
              <img src={img.image} alt="" className="h-full w-full object-cover" />
              <button
                onClick={() => remove.mutate(img.id)}
                disabled={remove.isPending}
                className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
                aria-label="Нест кардан"
              >
                <Icon name="delete" className="text-[18px]" />
              </button>
            </div>
          ))}
        </div>
      )}
      <label className={`btn-primary w-full cursor-pointer ${upload.isPending ? 'pointer-events-none opacity-60' : ''}`}>
        <Icon name="add_photo_alternate" className="text-[20px]" />
        {upload.isPending ? 'Бор шуда истодааст…' : 'Суратҳо илова кардан'}
        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files.length && upload.mutate([...e.target.files])} />
      </label>
    </div>
  )
}
