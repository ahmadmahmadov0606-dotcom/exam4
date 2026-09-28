import { useEffect, useImperativeHandle, useRef, useState } from 'react'
import Icon from '../Icon'
import InteriorView from './InteriorView'
import { drawPlate, plateText } from './plate'
import { addWeddingDecor } from './weddingDecor'

const HDRI = '/3d/venice_sunset_1k.hdr' // lighting and reflections
const BACKDROP = '/3d/venice_sunset_bg.jpg' // what you see around the car
const TURN = Math.PI / 4 // one hand swipe turns the view by 45°

// Shared, loaded once per visit: three.js, loaders, environment, and every model by URL.
let core = null
const models = new Map()

function loadCore() {
  core ??= (async () => {
    const [THREE, { GLTFLoader }, { HDRLoader }, { MeshoptDecoder }, { OrbitControls }, { GroundedSkybox }] = await Promise.all([
      import('three'),
      import('three/examples/jsm/loaders/GLTFLoader.js'),
      import('three/examples/jsm/loaders/HDRLoader.js'),
      import('three/examples/jsm/libs/meshopt_decoder.module.js'),
      import('three/examples/jsm/controls/OrbitControls.js'),
      import('three/examples/jsm/objects/GroundedSkybox.js'),
    ])
    const gltfLoader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
    const [hdr, backdrop] = await Promise.all([new HDRLoader().loadAsync(HDRI), new THREE.TextureLoader().loadAsync(BACKDROP)])
    hdr.mapping = THREE.EquirectangularReflectionMapping
    backdrop.mapping = THREE.EquirectangularReflectionMapping
    backdrop.colorSpace = THREE.SRGBColorSpace
    return { THREE, gltfLoader, OrbitControls, GroundedSkybox, hdr, backdrop }
  })()
  core.catch(() => (core = null))
  return core
}

function loadModel(url, onProgress) {
  if (!models.has(url)) {
    const promise = loadCore().then(({ gltfLoader }) => gltfLoader.loadAsync(url, (e) => e.total && onProgress?.(e.loaded / e.total)))
    promise.catch(() => models.delete(url))
    models.set(url, promise)
  }
  return models.get(url)
}

// One renderer and one lighting environment for every car, made once per visit.
let stage = null
function getStage({ THREE, hdr }) {
  if (!stage) {
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.95
    const pmrem = new THREE.PMREMGenerator(renderer)
    const envMap = pmrem.fromEquirectangular(hdr).texture
    pmrem.dispose()
    stage = { renderer, envMap }
  }
  return stage
}

// Each car's scene is built, its shaders compiled and its textures uploaded ahead of time,
// so opening 3D only has to show it. The last few are kept; the one on screen is never thrown away.
const prepared = new Map()
let shown = null
function prepare(car, onProgress) {
  if (!prepared.has(car.id)) {
    const promise = Promise.all([loadCore(), loadModel(car.model_3d, onProgress)]).then(async ([assets, gltf]) => {
      const { renderer, envMap } = getStage(assets)
      const built = buildScene(assets.THREE, assets, gltf, car)
      built.scene.environment = envMap
      const camera = new assets.THREE.PerspectiveCamera(40, 16 / 9, 0.05, 400)
      camera.position.set(built.long, built.size.y, built.long)
      camera.lookAt(0, built.size.y * 0.4, 0)
      await renderer.compileAsync(built.scene, camera)
      renderer.setSize(64, 36, false)
      renderer.render(built.scene, camera) // uploads the textures
      return built
    })
    promise.catch(() => prepared.delete(car.id))
    prepared.set(car.id, promise)
    for (const [id, old] of prepared) {
      if (prepared.size <= 5) break
      if (id === shown) continue
      prepared.delete(id)
      old.then((built) => built.dispose(), () => {})
    }
  }
  return prepared.get(car.id)
}

// Called by the cars page for the car in view and its neighbours: prepared one by one while the
// browser is idle, so pressing 3D (or moving the hand up) opens it at once.
export function preload3D(cars = []) {
  const idle = (fn) => (window.requestIdleCallback ?? ((f) => setTimeout(f, 300)))(fn, { timeout: 3000 })
  const queue = cars.filter((c) => c?.model_3d && !prepared.has(c.id))
  const next = () => {
    const car = queue.shift()
    if (car) idle(() => prepare(car).then(next, next))
  }
  next()
}

// Real length in metres, so the car stands in the scene at its true size.
const lengthOf = (car) => (/лимузин|limo/i.test(`${car.name} ${car.model}`) ? 7 : 4.9)

// The models are made from one photo of the car, so nothing says where its front is.
// The front is the end with the long low part (the hood); the cabin and the boot rise sooner.
function findForward(THREE, model) {
  // Height of the body along its middle, from rays cast straight down (stray bits beside the car,
  // left over from the photo's background, are not in their way).
  const box = new THREE.Box3().setFromObject(model)
  const centre = box.getCenter(new THREE.Vector3())
  const width = box.max.x - box.min.x
  const meshes = []
  model.traverse((o) => o.isMesh && meshes.push(o))
  const ray = new THREE.Raycaster()
  const down = new THREE.Vector3(0, -1, 0)
  const BINS = 24
  const top = []
  for (let i = 0; i < BINS; i++) {
    const z = box.min.z + ((i + 0.5) / BINS) * (box.max.z - box.min.z)
    const heights = [-0.12, 0, 0.12].map((dx) => {
      ray.set(new THREE.Vector3(centre.x + dx * width, box.max.y + 1, z), down)
      return ray.intersectObjects(meshes, false)[0]?.point.y ?? box.min.y
    })
    top.push(heights.sort((p, q) => p - q)[1]) // the middle one of three
  }
  const roof = Math.max(...top)
  const high = box.min.y + (roof - box.min.y) * 0.8
  const lowRun = (bins) => bins.findIndex((h) => h >= high)
  const back = lowRun(top) // low bins at -z
  const front = lowRun([...top].reverse()) // low bins at +z
  return new THREE.Vector3(0, 0, back > front ? -1 : 1)
}

function buildScene(THREE, assets, gltf, car) {
  const { backdrop, GroundedSkybox } = assets
  const scene = new THREE.Scene()
  const sky = new GroundedSkybox(backdrop, 12, 90)
  sky.material.toneMapped = false // the backdrop is already tone-mapped
  sky.position.y = 12 - 0.01
  scene.add(sky)

  // Lay the car along z, scale it to its real size and stand it on the ground.
  const model = gltf.scene.clone(true)
  let box = new THREE.Box3().setFromObject(model)
  let size = box.getSize(new THREE.Vector3())
  if (size.x > size.z) model.rotation.y = Math.PI / 2
  model.scale.multiplyScalar(lengthOf(car) / Math.max(size.x, size.z))
  model.updateMatrixWorld(true)
  box = new THREE.Box3().setFromObject(model)
  const centre = box.getCenter(new THREE.Vector3())
  model.position.sub(new THREE.Vector3(centre.x, box.min.y, centre.z))
  scene.add(model)
  model.updateMatrixWorld(true)

  const carBox = new THREE.Box3().setFromObject(model)
  size = carBox.getSize(new THREE.Vector3())
  const long = size.z
  const forward = findForward(THREE, model)

  // Tajik plates, front and back, pressed onto the bumper found by casting rays at the body.
  const meshes = []
  model.traverse((o) => o.isMesh && meshes.push(o))
  const plateTexture = new THREE.CanvasTexture(drawPlate(car))
  plateTexture.colorSpace = THREE.SRGBColorSpace
  plateTexture.anisotropy = 4
  const plateMaterial = new THREE.MeshStandardMaterial({ map: plateTexture, roughness: 0.45, polygonOffset: true, polygonOffsetFactor: -2 })
  const plateGeometry = new THREE.PlaneGeometry(0.52, 0.13)
  const ray = new THREE.Raycaster()
  for (const dir of [forward, forward.clone().negate()]) {
    let best = null
    for (const h of [0.2, 0.25, 0.3, 0.35]) {
      ray.set(dir.clone().multiplyScalar(long).setY(size.y * h), dir.clone().negate())
      const hit = ray.intersectObjects(meshes, false)[0]
      if (hit && (!best || hit.point.dot(dir) > best.dot(dir))) best = hit.point
    }
    if (!best) continue
    const plate = new THREE.Mesh(plateGeometry, plateMaterial)
    plate.position.copy(best).add(dir.clone().multiplyScalar(0.02))
    plate.lookAt(plate.position.clone().add(dir))
    scene.add(plate)
  }

  scene.add(addWeddingDecor(THREE, model, forward))

  // Soft contact shadow.
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  const ctx = canvas.getContext('2d')
  const g = ctx.createRadialGradient(64, 64, 8, 64, 64, 64)
  g.addColorStop(0, 'rgba(0,0,0,0.9)')
  g.addColorStop(0.55, 'rgba(0,0,0,0.5)')
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false, toneMapped: false }),
  )
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = 0.005
  shadow.scale.set(size.x * 1.25, long * 1.1, 1)
  scene.add(shadow)

  const dispose = () => {
    scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose()
      if (o.material) [].concat(o.material).forEach((mat) => mat.dispose())
    })
    plateTexture.dispose()
    shadow.material.map.dispose()
  }
  return { THREE, OrbitControls: assets.OrbitControls, scene, forward, size, long, dispose }
}

// Full-screen 3D view of this very car (its own model, made from its photo), decorated for a wedding
// on a seaside promenade at sunset. Drag to turn it, scroll/pinch to zoom. `ref.turn(±1)` turns the
// view by 45° — used by the hand-gesture control.
export default function Car3DViewer({ car, onClose, ref }) {
  const mount = useRef(null)
  const api = useRef({})
  const [progress, setProgress] = useState(0)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(false)
  const [inside, setInside] = useState(false)
  const interior = useRef(null)
  const hasModel = Boolean(car.model_3d)

  // Hand swipes and arrow keys turn the car outside, or look around the cabin inside.
  useImperativeHandle(ref, () => ({ turn: (dir) => (inside ? interior.current : api.current)?.turn?.(dir) }), [inside])

  useEffect(() => {
    api.current.pause?.(inside)
  }, [inside, ready])

  useEffect(() => {
    if (!hasModel) return
    let disposed = false
    let cleanup = () => {}

    shown = car.id
    prepare(car, setProgress)
      .then((built) => {
        if (disposed) return
        const { THREE, OrbitControls } = built
        const { renderer } = stage
        const { scene, forward, size, long } = built
        const el = mount.current
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25))
        renderer.setSize(el.clientWidth, el.clientHeight)

        const camera = new THREE.PerspectiveCamera(40, el.clientWidth / el.clientHeight, 0.05, 400)
        const controls = new OrbitControls(camera, renderer.domElement)
        controls.enableDamping = true
        controls.dampingFactor = 0.08
        controls.enablePan = false
        controls.minDistance = long * 0.55
        controls.maxDistance = long * 2.2
        controls.maxPolarAngle = Math.PI * 0.47
        controls.autoRotate = true
        controls.autoRotateSpeed = 0.5
        const side = new THREE.Vector3(-forward.z, 0, forward.x)
        camera.position.copy(forward.clone().multiplyScalar(long * 0.95).add(side.multiplyScalar(long * 0.85)).setY(size.y * 1.05))
        controls.target.set(0, size.y * 0.42, 0)
        el.appendChild(renderer.domElement)

        let dirty = true
        let spin = 0 // angle still to turn after a gesture
        const up = new THREE.Vector3(0, 1, 0)
        const offset = new THREE.Vector3()
        let paused = false // while the interior is on screen
        api.current.pause = (value) => {
          paused = value
          dirty = true
        }
        api.current.turn = (dir) => {
          controls.autoRotate = false
          spin += dir * TURN
        }
        controls.addEventListener('start', () => {
          controls.autoRotate = false
          spin = 0
        })
        controls.addEventListener('change', () => (dirty = true))

        // Draw only when something moves (auto-rotation, dragging, a gesture turn, resize).
        let frame = 0
        let before = performance.now()
        const tick = () => {
          const now = performance.now()
          const dt = Math.min((now - before) / 1000, 0.05)
          before = now
          if (paused) {
            frame = requestAnimationFrame(tick)
            return
          }
          if (spin) {
            const step = Math.abs(spin) < 0.002 ? spin : spin * (1 - Math.exp(-dt * 7))
            offset.copy(camera.position).sub(controls.target).applyAxisAngle(up, step)
            camera.position.copy(controls.target).add(offset)
            spin -= step
            dirty = true
          }
          controls.update(dt)
          if (dirty) {
            renderer.render(scene, camera)
            dirty = false
          }
          frame = requestAnimationFrame(tick)
        }
        const onResize = () => {
          camera.aspect = el.clientWidth / el.clientHeight
          camera.updateProjectionMatrix()
          renderer.setSize(el.clientWidth, el.clientHeight)
          dirty = true
        }
        const onVisibility = () => {
          cancelAnimationFrame(frame)
          if (!document.hidden) {
            before = performance.now()
            tick()
          }
        }
        window.addEventListener('resize', onResize)
        document.addEventListener('visibilitychange', onVisibility)
        tick()
        setReady(true)

        cleanup = () => {
          api.current.turn = null
          cancelAnimationFrame(frame)
          window.removeEventListener('resize', onResize)
          document.removeEventListener('visibilitychange', onVisibility)
          controls.dispose()
          renderer.domElement.remove()
        }
      })
      .catch((e) => {
        console.warn('3D viewer:', e)
        if (!disposed) setError(true)
      })

    return () => {
      disposed = true
      if (shown === car.id) shown = null
      cleanup()
    }
  }, [car, hasModel])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[90] bg-[#1a1612] text-white" role="dialog" aria-modal="true" aria-label={`${car.brand} ${car.model} — 3D`}>
      <div ref={mount} className={`absolute inset-0 touch-none transition-opacity duration-500 ${ready ? 'opacity-100' : 'opacity-0'}`} />

      {!hasModel && (
        // No model of this car yet: show the car itself, never a stand-in.
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6">
          <img src={car.image} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-30 blur-2xl" />
          <img src={car.image} alt={car.name} className="relative max-h-[55vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl" />
          <p className="relative flex items-center gap-2 rounded-full bg-black/45 px-5 py-2.5 text-center text-sm backdrop-blur">
            <Icon name="view_in_ar" className="animate-pulse text-secondary-bright" />
            3D-модели ҳамин мошин сохта шуда истодааст — ба зудӣ дар ин ҷо пайдо мешавад.
          </p>
        </div>
      )}

      {hasModel && !ready && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <Icon name="view_in_ar" className="animate-pulse text-5xl text-secondary-bright" />
          <p className="text-sm text-white/80">Модели 3D бор шуда истодааст… {Math.round(progress * 100)}%</p>
          <div className="h-1 w-64 overflow-hidden rounded-full bg-white/15">
            <div className="h-full bg-secondary-bright transition-[width]" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
      )}
      {error && <p className="absolute inset-0 flex items-center justify-center text-sm text-red-300">3D кушода нашуд. Браузери шумо WebGL-ро дастгирӣ намекунад.</p>}

      {inside && (
        <div className="absolute inset-0 bg-black">
          <InteriorView ref={interior} src={car.interior} depth={car.interior_depth} />
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-5 sm:p-8">
        <div data-no-translate>
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/70">3D</p>
          <h2 className="font-sans text-3xl font-extrabold uppercase italic leading-none drop-shadow sm:text-5xl">
            {car.brand} <span className="text-white/70">{car.model}</span>
          </h2>
          <p className="mt-2 inline-block rounded bg-white px-2 py-0.5 font-mono text-sm font-bold text-gray-900">{plateText(car)}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Пӯшидан" className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-black/35 ring-1 ring-white/30 backdrop-blur hover:bg-black/55">
          <Icon name="close" />
        </button>
      </div>

      <div className={`pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 p-5 sm:p-8 ${inside ? "bg-gradient-to-t from-black/75 via-black/35 to-transparent pt-16" : ""}`}>
        {car.interior && (
          <div className="pointer-events-auto flex gap-2">
            {[[false, 'directions_car', 'Берун'], [true, 'airline_seat_recline_normal', 'Дарун']].map(([value, icon, label]) => (
              <button
                key={label}
                type="button"
                onClick={() => setInside(value)}
                className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold backdrop-blur-md transition ${
                  inside === value ? 'bg-white text-gray-900' : 'bg-black/35 text-white ring-1 ring-white/30 hover:bg-black/50'
                }`}
              >
                <Icon name={icon} className="text-[18px]" /> {label}
              </button>
            ))}
          </div>
        )}
        {inside ? (
          <>
            <p className="text-center text-[11px] text-white/70">Кашед ё даст ба чап/рост — ба атроф нигаред</p>
            <p className="text-center text-[10px] text-white/45" data-no-translate>
              Салони {car.brand} {car.model} · {car.interior_credit || 'сурати фурӯшанда'}
            </p>
          </>
        ) : (
          ready && (
            <>
              <p className="text-center text-[11px] text-white/70">Кашед — давр занонед · чархак — наздик/дур · даст ба чап/рост — гардонед</p>
              <p className="text-center text-[10px] text-white/45">Модели 3D аз сурати ҳамин мошин бо AI сохта шудааст · Муҳит: Poly Haven, CC0</p>
            </>
          )
        )}
      </div>
    </div>
  )
}
