// Hand tracking off the main thread, so the page and the 3D view keep 60 fps while the camera is on.
// Receives camera frames (ImageBitmap), answers with the 21 landmarks of one hand or null.
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'

// tasks-vision loads its wasm glue with importScripts, which module workers lack: load it as a classic script.
self.import = async (url) => {
  const code = await (await fetch(url)).text()
  ;(0, eval)(`${code}\nself.ModuleFactory = ModuleFactory`)
}

let landmarker

async function create({ wasm, model }) {
  const fileset = await FilesetResolver.forVisionTasks(wasm)
  const options = (delegate) => ({
    baseOptions: { modelAssetPath: model, delegate },
    runningMode: 'VIDEO',
    numHands: 1,
    minHandDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  })
  try {
    landmarker = await HandLandmarker.createFromOptions(fileset, options('GPU'))
  } catch {
    landmarker = await HandLandmarker.createFromOptions(fileset, options('CPU')) // no WebGL here: slower, still works
  }
  // First detection compiles the shaders; do it now rather than on the user's first wave.
  const blank = new OffscreenCanvas(64, 48)
  blank.getContext('2d').fillRect(0, 0, 64, 48)
  landmarker.detectForVideo(blank, performance.now())
}

self.onmessage = async ({ data }) => {
  if (data.init) {
    try {
      await create(data.init)
      postMessage({ ready: true })
    } catch (error) {
      postMessage({ error: String(error) })
    }
    return
  }
  const { frame, t } = data
  const hand = landmarker.detectForVideo(frame, t).landmarks?.[0] ?? null
  frame.close()
  postMessage({ hand, t })
}
