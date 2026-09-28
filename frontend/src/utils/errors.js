import toast from 'react-hot-toast'

const join = (value) => [].concat(value).join(' ')

export function parseApiErrors(error) {
  const response = error?.response
  if (!response) return { fields: {}, message: 'Пайвастшавӣ бо сервер ғайриимкон аст.' }

  const body = response.data
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { fields: {}, message: response.status >= 500 ? 'Хатои сервер. Баъдтар кӯшиш кунед.' : 'Хатогӣ рух дод.' }
  }

  const { detail, non_field_errors: nonField, ...rest } = body
  const fields = Object.fromEntries(Object.entries(rest).map(([key, value]) => [key, join(value)]))
  return { fields, message: detail ? join(detail) : nonField ? join(nonField) : '' }
}

export function showApiError(error, setErrors) {
  const { fields, message } = parseApiErrors(error)
  setErrors?.(fields)
  toast.error(message || Object.values(fields)[0] || 'Хатогӣ рух дод.')
}

export function toFormData(values) {
  const form = new FormData()
  Object.entries(values).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    if (key === 'image' || key === 'avatar' || key === 'video' || key === 'model_3d' || key === 'interior') {
      if (value instanceof File) form.append(key, value)
      return
    }
    form.append(key, value)
  })
  return form
}
