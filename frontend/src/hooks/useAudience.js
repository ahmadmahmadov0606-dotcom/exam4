import { useAuth } from '../context/AuthContext'

// 'groom' | 'bride' for a client who picked a side, '' for guests and vendors.
export default function useAudience() {
  const { user } = useAuth()
  return user?.role === 'client' ? user.side || '' : ''
}
