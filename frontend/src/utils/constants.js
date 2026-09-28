export const STATUSES = {
  pending: { label: 'Дар интизорӣ', className: 'bg-amber-100 text-amber-800' },
  confirmed: { label: 'Тасдиқ шуд', className: 'bg-emerald-100 text-emerald-800' },
  rejected: { label: 'Рад шуд', className: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Бекор шуд', className: 'bg-stone-200 text-stone-600' },
  completed: { label: 'Анҷом ёфт', className: 'bg-sky-100 text-sky-800' },
}

export const SERVICE_CATEGORIES = {
  singer: 'Ҳофиз',
  musicians: 'Созандагон',
  host: 'Тамада / Ведущий',
  photographer: 'Суратгир',
  videographer: 'Видеограф',
  makeup: 'Ороишгари арӯс',
  decor: 'Ороиши толор',
  cake: 'Торт ва ширинӣ',
}

export const PRODUCT_CATEGORIES = {
  groom_national: 'Либоси миллии домод (чапон, тоқӣ)',
  groom_suit: 'Костюми домод',
  bride_dress: 'Либоси арӯсӣ',
  bride_national: 'Либоси миллии арӯс',
  veil: 'Фатаи арӯс',
  cosmetics: 'Косметика',
  trousers: 'Шими домод',
  furniture: 'Мебел (сеп)',
  bedding: 'Кӯрпа ва кӯрпача',
  jewelry: 'Заргарӣ',
}

// Product categories grouped the way people shop: clothes, dowry (сеп), jewellery.
export const PRODUCT_GROUPS = {
  clothes: { title: 'Либосҳо', icon: 'styler', categories: ['groom_national', 'groom_suit', 'trousers', 'bride_dress', 'bride_national', 'veil'] },
  sep: { title: 'Сеп: мебел ва кӯрпа', icon: 'bed', categories: ['furniture', 'bedding'] },
  cosmetics: { title: 'Косметика', icon: 'spa', categories: ['cosmetics'] },
  jewelry: { title: 'Заргарӣ', icon: 'diamond', categories: ['jewelry'] },
}

// Who each category is for. Missing = shared by groom and bride (restaurants, cars, rings…).
export const CATEGORY_SIDE = {
  groom_national: 'groom',
  groom_suit: 'groom',
  trousers: 'groom',
  bride_dress: 'bride',
  bride_national: 'bride',
  veil: 'bride',
  cosmetics: 'bride',
  furniture: 'bride',
  bedding: 'bride',
  makeup: 'bride',
}

export const AUDIENCES = {
  groom: { label: 'Домод', icon: 'man', text: 'Костюм, шим, чапон ва тоқӣ' },
  bride: { label: 'Арӯс', icon: 'woman', text: 'Либоси арӯсӣ, фата, сеп ва косметика' },
}

// Categories a groom/bride should see; everyone else sees all.
export function visibleFor(side, categories) {
  if (!side) return categories
  return Object.fromEntries(Object.entries(categories).filter(([key]) => !CATEGORY_SIDE[key] || CATEGORY_SIDE[key] === side))
}

export const SIDES = { groom: 'Тарафи домод', bride: 'Тарафи арӯс', both: 'Ҳарду' }

const COMMON_FIELDS = [
  { name: 'name', label: 'Ном', required: true },
  { name: 'city', label: 'Шаҳр', type: 'city', required: true },
  { name: 'phone', label: 'Телефон' },
  { name: 'description', label: 'Тавсиф', type: 'textarea', wide: true },
]

// One entry per listing type; `key` matches the backend FK name (restaurant, car, service, product).
export const TYPES = {
  restaurant: {
    key: 'restaurant',
    slug: 'restaurants',
    title: 'Тарабхонаҳо',
    single: 'Тарабхона',
    icon: 'apartment',
    tagline: 'Толорҳои тӯй барои ҳар андоза',
    priceField: 'price_per_person',
    priceSuffix: '/ нафар',
    bookingTitle: 'Тарабхонаҳо',
    subtitle: (x) => `${x.address} · то ${x.capacity} нафар`,
    fields: [
      ...COMMON_FIELDS,
      { name: 'address', label: 'Суроға', required: true },
      { name: 'capacity', label: 'Ғунҷоиш (нафар)', type: 'number', required: true },
      { name: 'price_per_person', label: 'Нарх барои як нафар', type: 'number', required: true },
    ],
  },
  car: {
    key: 'car',
    slug: 'cars',
    title: 'Мошинҳо',
    single: 'Мошин',
    icon: 'directions_car',
    tagline: 'Мошинҳои зебо барои домоду арӯс',
    priceField: 'price_per_hour',
    priceSuffix: '/ соат',
    bookingTitle: 'Мошинҳо',
    subtitle: (x) => `${x.brand} ${x.model} · ${x.year} · ${x.color}`,
    fields: [
      ...COMMON_FIELDS,
      { name: 'brand', label: 'Бренд', required: true },
      { name: 'model', label: 'Модел', required: true },
      { name: 'year', label: 'Сол', type: 'number', required: true },
      { name: 'color', label: 'Ранг', required: true },
      { name: 'seats', label: 'Ҷойҳо', type: 'number' },
      { name: 'price_per_hour', label: 'Нарх барои як соат', type: 'number', required: true },
      { name: 'with_driver', label: 'Бо ронанда', type: 'checkbox' },
    ],
  },
  service: {
    key: 'service',
    slug: 'services',
    title: 'Хизматҳо',
    single: 'Хизмат',
    icon: 'mic',
    tagline: 'Ҳофиз, тамада, суратгир ва дигарон',
    priceField: 'price',
    priceSuffix: '',
    bookingTitle: 'Хизматҳо',
    categories: SERVICE_CATEGORIES,
    subtitle: (x) => `${SERVICE_CATEGORIES[x.category]} · таҷриба ${x.experience_years} сол`,
    fields: [
      ...COMMON_FIELDS,
      { name: 'category', label: 'Категория', type: 'select', options: SERVICE_CATEGORIES, required: true },
      { name: 'price', label: 'Нарх', type: 'number', required: true },
      { name: 'experience_years', label: 'Таҷриба (сол)', type: 'number' },
    ],
  },
  product: {
    key: 'product',
    slug: 'products',
    title: 'Молҳо',
    single: 'Мол',
    icon: 'styler',
    tagline: 'Либос, сеп, кӯрпа ва заргарӣ',
    priceField: 'price',
    priceSuffix: '',
    bookingTitle: 'Фармоишҳо',
    categories: PRODUCT_CATEGORIES,
    sides: SIDES,
    subtitle: (x) => `${PRODUCT_CATEGORIES[x.category]} · ${SIDES[x.side]}`,
    fields: [
      ...COMMON_FIELDS,
      { name: 'category', label: 'Категория', type: 'select', options: PRODUCT_CATEGORIES, required: true },
      { name: 'side', label: 'Тараф', type: 'select', options: SIDES },
      { name: 'price', label: 'Нарх', type: 'number', required: true },
      { name: 'stock', label: 'Дар анбор (дона)', type: 'number' },
    ],
  },
}

export const TYPE_LIST = Object.values(TYPES)

export const typeBySlug = (slug) => TYPE_LIST.find((t) => t.slug === slug)
