import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState'

export default function NotFound() {
  return (
    <div className="container-page py-16">
      <EmptyState
        icon="search_off"
        title="Саҳифа ёфт нашуд"
        text="Шояд суроға нодуруст аст ё саҳифа нест карда шудааст."
        action={
          <Link to="/" className="btn-primary">
            Ба саҳифаи асосӣ
          </Link>
        }
      />
    </div>
  )
}
