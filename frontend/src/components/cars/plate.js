// Tajik-style licence plates: "1234 AB 01" in black on white, with the national flag and "TJ" on the left.
// Numbers are generated from the car id (stable per car) — they are decorative, not real registrations.

const LETTERS = 'ABCEHKMOPTX' // letters shared by the Latin and Cyrillic alphabets
// Approximate region codes by city (01 Dushanbe, 02 Sughd, 03 Khatlon, 04 GBAO, 05 districts of republican subordination).
const REGION = { Душанбе: '01', Хуҷанд: '02', Истаравшан: '02', Панҷакент: '02', Бохтар: '03', Кӯлоб: '03', Хоруғ: '04', Ҳисор: '05' }

export function plateFor(car) {
  const seed = (car.id * 7919 + 1237) % 99991
  const digits = String(1000 + (seed % 9000))
  const letters = LETTERS[seed % LETTERS.length] + LETTERS[Math.floor(seed / 11) % LETTERS.length]
  return { digits, letters, region: REGION[car.city_name] ?? '01' }
}

export const plateText = (car) => {
  const p = plateFor(car)
  return `${p.digits} ${p.letters} ${p.region}`
}

// Draws the plate onto a canvas (4:1). Used as a 3D texture and to cover plates on photos.
export function drawPlate(car, width = 1024) {
  const { digits, letters, region } = plateFor(car)
  const h = width / 4
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = h
  const ctx = canvas.getContext('2d')
  const u = width / 1024

  ctx.fillStyle = '#fbfbf8'
  ctx.fillRect(0, 0, width, h)
  ctx.lineWidth = 14 * u
  ctx.strokeStyle = '#111'
  ctx.strokeRect(7 * u, 7 * u, width - 14 * u, h - 14 * u)

  // flag: red / white (with a small gold crown) / green, then "TJ"
  const fx = 34 * u, fy = 38 * u, fw = 118 * u, fh = 84 * u
  ctx.fillStyle = '#cc0000'
  ctx.fillRect(fx, fy, fw, fh * 2 / 7)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(fx, fy + fh * 2 / 7, fw, fh * 3 / 7)
  ctx.fillStyle = '#006600'
  ctx.fillRect(fx, fy + fh * 5 / 7, fw, fh * 2 / 7)
  ctx.fillStyle = '#f8c300'
  ctx.beginPath()
  ctx.arc(fx + fw / 2, fy + fh / 2, 9 * u, Math.PI, 0)
  ctx.fill()
  ctx.lineWidth = 2 * u
  ctx.strokeStyle = '#999'
  ctx.strokeRect(fx, fy, fw, fh)
  ctx.fillStyle = '#123f9e'
  ctx.font = `bold ${70 * u}px Arial, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('TJ', fx + fw / 2, 180 * u)

  ctx.fillStyle = '#111'
  ctx.fillRect(186 * u, 28 * u, 4 * u, h - 56 * u)
  ctx.font = `bold ${178 * u}px "Arial Narrow", Arial, sans-serif`
  ctx.textAlign = 'left'
  ctx.fillText(`${digits} ${letters}`, 214 * u, h / 2 + 8 * u, 600 * u)
  ctx.fillRect(832 * u, 28 * u, 4 * u, h - 56 * u)
  ctx.textAlign = 'center'
  ctx.fillText(region, 928 * u, h / 2 + 8 * u, 150 * u)
  return canvas
}
