import { useEffect, useImperativeHandle, useRef, useState } from 'react'

const HFOV = (100 * Math.PI) / 180 // interior photos are taken with a wide lens
const NEAR = 0.45 // metres to the nearest thing in the photo (seats)…
const FAR = 2.8 // …and the farthest (outside the windows; closer than real, so edges don't tear)
const PIVOT = 1.6 // the view turns around a point this far in front, so near things shift more: depth
const MAX_YAW = 0.2
const MAX_PITCH = 0.09
const STEP = 0.1 // one hand swipe / arrow key

const loadImage = (src) =>
  new Promise((resolve, reject) => Object.assign(new Image(), { crossOrigin: 'anonymous', onload() { resolve(this) }, onerror: reject, src }))

// Inside the car in 3D: the interior photo is rebuilt as a surface from its depth map (Depth Anything),
// so seats stand out in front of the dashboard and move against it as you look around — drag, arrow
// keys or a hand swipe. Without a depth map the photo is shown flat. `ref.turn(±1)` looks left/right.
export default function InteriorView({ src, depth, ref }) {
  const mount = useRef(null)
  const api = useRef({})
  const [ready, setReady] = useState(false)

  useImperativeHandle(ref, () => ({ turn: (dir) => api.current.turn?.(dir) }), [])

  useEffect(() => {
    let disposed = false
    let cleanup = () => {}
    Promise.all([import('three'), loadImage(src), depth ? loadImage(depth).catch(() => null) : null])
      .then(([THREE, image, depthImage]) => {
        if (disposed) return
        const el = mount.current
        const renderer = new THREE.WebGLRenderer({ antialias: true })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
        renderer.setSize(el.clientWidth, el.clientHeight)
        el.appendChild(renderer.domElement)

        const texture = new THREE.Texture(image)
        texture.colorSpace = THREE.SRGBColorSpace
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy()
        texture.needsUpdate = true
        const material = new THREE.MeshBasicMaterial({ map: texture })

        // Depth per grid point: 0 = far … 1 = near.
        const SX = 220
        const SY = Math.round(SX * (image.height / image.width))
        let sample = () => 0.5
        if (depthImage) {
          const canvas = document.createElement('canvas')
          canvas.width = SX + 1
          canvas.height = SY + 1
          const ctx = canvas.getContext('2d', { willReadFrequently: true })
          ctx.filter = 'blur(2px)' // soft depth edges: gentle stretch instead of torn outlines
          ctx.drawImage(depthImage, 0, 0, canvas.width, canvas.height)
          const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data
          sample = (ix, iy) => pixels[(iy * canvas.width + ix) * 4] / 255
        }
        const tx = Math.tan(HFOV / 2)
        const ty = tx * (image.height / image.width)
        const distance = (d) => 1 / (d * (1 / NEAR - 1 / FAR) + 1 / FAR)

        // Each pixel sits on its camera ray, as far away as its depth says.
        const geometry = new THREE.PlaneGeometry(1, 1, SX, SY)
        const position = geometry.attributes.position
        const z = new Float32Array(position.count)
        for (let iy = 0; iy <= SY; iy++) {
          for (let ix = 0; ix <= SX; ix++) {
            const i = iy * (SX + 1) + ix
            const u = ix / SX
            const v = 1 - iy / SY
            z[i] = distance(sample(ix, iy))
            position.setXYZ(i, (u - 0.5) * 2 * tx * z[i], (v - 0.5) * 2 * ty * z[i], -z[i])
          }
        }
        // Drop the triangles stretched across depth jumps (window edges, pillars); the backdrop fills them.
        const index = geometry.index.array
        const kept = []
        for (let t = 0; t < index.length; t += 3) {
          const [a, b, c] = [z[index[t]], z[index[t + 1]], z[index[t + 2]]]
          if (Math.max(a, b, c) / Math.min(a, b, c) < 2) kept.push(index[t], index[t + 1], index[t + 2])
        }
        geometry.setIndex(kept)
        position.needsUpdate = true

        const scene = new THREE.Scene()
        scene.background = new THREE.Color('#000')
        scene.add(new THREE.Mesh(geometry, material))
        const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(2 * tx * FAR * 1.3, 2 * ty * FAR * 1.3), material)
        backdrop.position.z = -FAR * 1.3
        scene.add(backdrop)

        const camera = new THREE.PerspectiveCamera(50, el.clientWidth / el.clientHeight, 0.05, 50)
        const fit = () => {
          camera.aspect = el.clientWidth / el.clientHeight
          // keep the photo's edges out of view, with room to look around
          const byHeight = 2 * Math.atan(ty * 0.72)
          const byWidth = 2 * Math.atan((tx * 0.72) / camera.aspect)
          camera.fov = THREE.MathUtils.radToDeg(Math.min(byHeight, byWidth))
          camera.updateProjectionMatrix()
          renderer.setSize(el.clientWidth, el.clientHeight)
        }
        fit()

        const pivot = new THREE.Vector3(0, 0, -PIVOT)
        let yaw = 0
        let pitch = 0
        let goalYaw = 0
        let goalPitch = 0
        let touched = false
        const clamp = () => {
          goalYaw = THREE.MathUtils.clamp(goalYaw, -MAX_YAW, MAX_YAW)
          goalPitch = THREE.MathUtils.clamp(goalPitch, -MAX_PITCH, MAX_PITCH)
        }
        api.current.turn = (dir) => {
          touched = true
          goalYaw += dir * STEP
          clamp()
        }

        let drag = null
        const onDown = (e) => {
          touched = true
          drag = { x: e.clientX, y: e.clientY, yaw: goalYaw, pitch: goalPitch }
          el.setPointerCapture(e.pointerId)
        }
        const onMove = (e) => {
          if (!drag) return
          goalYaw = drag.yaw - ((e.clientX - drag.x) / el.clientWidth) * 0.9
          goalPitch = drag.pitch + ((e.clientY - drag.y) / el.clientHeight) * 0.5
          clamp()
        }
        const onUp = () => (drag = null)
        el.addEventListener('pointerdown', onDown)
        el.addEventListener('pointermove', onMove)
        el.addEventListener('pointerup', onUp)
        el.addEventListener('pointercancel', onUp)
        window.addEventListener('resize', fit)

        let frame = 0
        let before = performance.now()
        const tick = () => {
          const now = performance.now()
          const k = 1 - Math.exp(-Math.min((now - before) / 1000, 0.05) * 6)
          before = now
          if (!touched) goalYaw = Math.sin(now / 2600) * MAX_YAW * 0.7 // a slow sway shows the depth
          yaw += (goalYaw - yaw) * k
          pitch += (goalPitch - pitch) * k
          camera.position.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)).multiplyScalar(PIVOT).add(pivot)
          camera.lookAt(pivot)
          renderer.render(scene, camera)
          frame = requestAnimationFrame(tick)
        }
        tick()
        setReady(true)

        cleanup = () => {
          api.current.turn = null
          cancelAnimationFrame(frame)
          el.removeEventListener('pointerdown', onDown)
          el.removeEventListener('pointermove', onMove)
          el.removeEventListener('pointerup', onUp)
          el.removeEventListener('pointercancel', onUp)
          window.removeEventListener('resize', fit)
          geometry.dispose()
          backdrop.geometry.dispose()
          material.dispose()
          texture.dispose()
          renderer.dispose()
          renderer.domElement.remove()
        }
      })
      .catch((error) => console.warn('Interior view:', error))
    return () => {
      disposed = true
      cleanup()
    }
  }, [src, depth])

  return <div ref={mount} className={`absolute inset-0 cursor-grab touch-none transition-opacity duration-500 active:cursor-grabbing ${ready ? 'opacity-100' : 'opacity-0'}`} />
}
