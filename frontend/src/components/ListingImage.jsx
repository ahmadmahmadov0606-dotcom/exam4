import Icon from './Icon'

export default function ListingImage({ src, icon, className = '' }) {
  if (src) return <img src={src} alt="" loading="lazy" className={`h-full w-full object-cover ${className}`} />
  return (
    <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-mist to-haze text-primary/40 ${className}`}>
      <Icon name={icon} className="text-6xl" />
    </div>
  )
}
