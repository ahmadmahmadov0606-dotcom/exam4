// Wedding decoration for a 3D car: a bouquet of cream roses and white lilies on the hood and two gold
// satin ribbons running from it to the side mirrors — like a decorated wedding car.
// Everything is placed by casting rays onto the car body, so it follows the shape of any model.

export function addWeddingDecor(THREE, model, forward) {
  const group = new THREE.Group()
  const up = new THREE.Vector3(0, 1, 0)
  const right = new THREE.Vector3().crossVectors(forward, up).normalize()
  const box = new THREE.Box3().setFromObject(model)
  const centre = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const length = Math.abs(size.x * forward.x) + Math.abs(size.z * forward.z)
  const width = Math.abs(size.x * right.x) + Math.abs(size.z * right.z)
  // Ribbons and flowers lie on the painted body, never on glass.
  const meshes = []
  model.traverse((o) => o.isMesh && meshes.push(o))
  const isWindscreen = (o) => /wind(shield|screen)|windows?(?!ill)/i.test(`${o.material.name} ${o.name}`)
  const ray = new THREE.Raycaster()

  // Highest point of the car under (x, z); null over the windscreen/windows or off the car.
  const surface = (point) => {
    ray.set(new THREE.Vector3(point.x, box.max.y + 1, point.z), new THREE.Vector3(0, -1, 0))
    const hit = ray.intersectObjects(meshes, false)[0]
    return hit && !isWindscreen(hit.object) ? hit.point : null
  }
  const along = (t, side = 0) => centre.clone().add(forward.clone().multiplyScalar(t * length)).add(right.clone().multiplyScalar(side * width))

  // The windscreen starts where the body turns steep (models made from a photo have no named glass).
  const steep = (from, to) => to.y - from.y > 0.7 * Math.hypot(to.x - from.x, to.z - from.z)
  // Find the hood: walking back from the nose, from the first body point to the windscreen edge.
  let hoodFront = null
  let hoodEnd = null
  let last = null
  for (let t = 0.5; t > -0.3; t -= 0.01) {
    const hit = surface(along(t))
    if (hit && hoodFront === null) hoodFront = t
    if (!hit && hoodFront !== null) break
    if (hit && last && steep(last, hit) && hoodFront - t > 0.08) break // (the bumper edge is steep too)
    if (hit) {
      hoodEnd = t
      last = hit
    }
  }
  hoodFront ??= 0.4
  hoodEnd ??= 0.15
  // Bouquet a little closer to the windscreen than to the nose, as decorators place it.
  const baseT = hoodEnd + (hoodFront - hoodEnd) * 0.4
  const base = surface(along(baseT)) ?? along(baseT).setY(box.min.y + size.y * 0.55)
  const bouquet = new THREE.Group()
  bouquet.position.copy(base)
  group.add(bouquet)
  const scale = THREE.MathUtils.clamp(width / 1.9, 0.75, 1.3) * 1.3

  const cream = new THREE.MeshStandardMaterial({ color: '#fbf6ea', roughness: 0.55 })
  const ivory = new THREE.MeshStandardMaterial({ color: '#f3e6c6', roughness: 0.55 })
  const gold = new THREE.MeshStandardMaterial({ color: '#d9b25a', roughness: 0.4, metalness: 0.2 })
  const leaf = new THREE.MeshStandardMaterial({ color: '#3f6b3a', roughness: 0.6, side: THREE.DoubleSide })
  const satin = new THREE.MeshStandardMaterial({ color: '#e7cc79', roughness: 0.32, metalness: 0.15, side: THREE.DoubleSide })

  // Roses: each head is 7 cupped petals around a bud; all petals of one colour share one InstancedMesh.
  const petalGeo = new THREE.SphereGeometry(0.03 * scale, 10, 8)
  petalGeo.scale(0.75, 0.42, 1)
  const roses = []
  const R = 0.17 * scale
  const ROSES = 26
  for (let i = 0; i < ROSES; i++) {
    const a = i * 2.39996 // golden angle -> even spread over the dome
    const r = R * Math.sqrt(i / ROSES)
    const p = new THREE.Vector3(Math.cos(a) * r, 0.045 + 0.06 * (1 - (r * r) / (R * R)), Math.sin(a) * r)
    roses.push({ p, material: i % 6 === 5 ? gold : i % 3 ? cream : ivory, size: 0.9 + ((i * 37) % 10) / 30 })
  }
  const byMaterial = new Map()
  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  roses.forEach(({ p, material, size: s }) => {
    const list = byMaterial.get(material) ?? []
    // two rings of cupped petals: 8 outer, 5 inner and higher
    for (const [count, ring, lift, tilt] of [[8, 0.024, 0, -1.0], [5, 0.012, 0.012, -0.6]]) {
      for (let k = 0; k < count; k++) {
        const a = (k / count) * Math.PI * 2 + ring * 40
        q.setFromEuler(new THREE.Euler(tilt, a, 0, 'YXZ'))
        const offset = new THREE.Vector3(Math.cos(a) * ring * s * scale, lift * scale, Math.sin(a) * ring * s * scale)
        m.compose(p.clone().add(offset), q, new THREE.Vector3(s, s, s))
        list.push(m.clone())
      }
    }
    m.compose(p.clone().setY(p.y + 0.02 * scale), new THREE.Quaternion(), new THREE.Vector3(0.45 * s, 0.8 * s, 0.45 * s))
    list.push(m.clone())
    byMaterial.set(material, list)
  })
  for (const [material, matrices] of byMaterial) {
    const mesh = new THREE.InstancedMesh(petalGeo, material, matrices.length)
    matrices.forEach((mx, i) => mesh.setMatrixAt(i, mx))
    bouquet.add(mesh)
  }

  // Lily sprays and leaves reaching out sideways along the car's width.
  const lilyGeo = new THREE.ConeGeometry(0.014 * scale, 0.1 * scale, 5)
  lilyGeo.rotateX(Math.PI / 2)
  const leafGeo = new THREE.PlaneGeometry(0.03 * scale, 0.13 * scale)
  const lilies = []
  const leaves = []
  const side = right.clone()
  const yaw = Math.atan2(side.x, side.z)
  for (const dir of [-1, 1]) {
    for (let k = 0; k < 7; k++) {
      const dist = (0.15 + k * 0.04) * scale
      const pos = side.clone().multiplyScalar(dir * dist).add(new THREE.Vector3(0, 0.03 + 0.01 * Math.sin(k), 0))
      const world = base.clone().add(pos)
      const ground = surface(world)
      if (ground) pos.y = ground.y - base.y + 0.02
      for (let p = 0; p < 5; p++) {
        q.setFromEuler(new THREE.Euler(-0.5, yaw + (p / 5) * Math.PI * 2, 0, 'YXZ'))
        m.compose(pos.clone().add(new THREE.Vector3(0, 0.02, 0)), q, new THREE.Vector3(0.8, 0.8, 0.8))
        if (k % 2 === 0) lilies.push(m.clone())
      }
      q.setFromEuler(new THREE.Euler(-Math.PI / 2 + 0.25, yaw + dir * (Math.PI / 2) + (k % 2 ? 0.5 : -0.5), 0, 'YXZ'))
      m.compose(pos, q, new THREE.Vector3(1, 1, 1))
      leaves.push(m.clone())
    }
  }
  const lilyMesh = new THREE.InstancedMesh(lilyGeo, cream, lilies.length)
  lilies.forEach((mx, i) => lilyMesh.setMatrixAt(i, mx))
  const leafMesh = new THREE.InstancedMesh(leafGeo, leaf, leaves.length)
  leaves.forEach((mx, i) => leafMesh.setMatrixAt(i, mx))
  bouquet.add(lilyMesh, leafMesh)

  // A satin bow in front of the bouquet.
  const loop = new THREE.TorusGeometry(0.045 * scale, 0.009, 8, 24)
  for (const dir of [-1, 1]) {
    const bow = new THREE.Mesh(loop, satin)
    bow.position.copy(forward.clone().multiplyScalar(0.19 * scale).add(side.clone().multiplyScalar(dir * 0.045 * scale))).setY(0.04)
    bow.lookAt(bow.position.clone().add(up))
    bow.rotateY(dir * 0.5)
    bow.scale.set(1, 0.55, 1)
    bouquet.add(bow)
  }

  // Ribbons: flat strips that hug the body from the bouquet to each mirror.
  // Ribbons run back to the hood's rear corners and stop at the windscreen's lower edge.
  const ends = [along(hoodEnd, -0.3), along(hoodEnd, 0.3)]
  for (const end of ends) {
    const points = []
    for (let i = 0; i <= 28; i++) {
      const t = i / 28
      const p = base.clone().lerp(end, t)
      const hit = surface(p)
      if (!hit || (points.length && steep(points.at(-1), hit))) break // reached the glass
      points.push(hit.setY(hit.y + 0.014))
    }
    if (points.length < 4) continue
    const curve = new THREE.CatmullRomCurve3(points)
    const samples = curve.getSpacedPoints(60)
    const half = 0.022 * scale
    const vertices = []
    const indices = []
    samples.forEach((p, i) => {
      const tangent = curve.getTangentAt(i / 60)
      const offset = new THREE.Vector3().crossVectors(tangent, up).normalize().multiplyScalar(half)
      vertices.push(...p.clone().add(offset).toArray(), ...p.clone().sub(offset).toArray())
      if (i) indices.push(2 * i - 2, 2 * i - 1, 2 * i, 2 * i - 1, 2 * i + 1, 2 * i)
    })
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geo.setIndex(indices)
    geo.computeVertexNormals()
    group.add(new THREE.Mesh(geo, satin))
  }

  return group // world-space: add it to the scene next to the car
}
