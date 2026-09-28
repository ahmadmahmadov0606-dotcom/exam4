import { useState } from 'react'

export default function useForm(initial) {
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState({})

  const set = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev))
  }

  const bind = (name) => ({
    name,
    value: values[name] ?? '',
    error: errors[name],
    onChange: (e) => set(name, e.target.type === 'checkbox' ? e.target.checked : e.target.value),
  })

  return { values, setValues, set, bind, errors, setErrors }
}
