import { MIDDLE_EAST_MAP, countryById } from './mapUnit'

export type Bounds = { minLon: number; minLat: number; maxLon: number; maxLat: number }

export const FULL_BOUNDS: Bounds = { minLon: 25.2, minLat: 11.6, maxLon: 88.2, maxLat: 56.2 }

export function countryBounds(id: string): Bounds | null {
  const country = countryById(id)
  if (!country) return null
  let minLon = 180
  let minLat = 90
  let maxLon = -180
  let maxLat = -90
  for (const ring of country.rings) {
    if (ring.length < 8) continue
    for (const [lon, lat] of ring) {
      minLon = Math.min(minLon, lon)
      maxLon = Math.max(maxLon, lon)
      minLat = Math.min(minLat, lat)
      maxLat = Math.max(maxLat, lat)
    }
  }
  if (minLon > maxLon) return null
  const padLon = Math.max(1.4, (maxLon - minLon) * 0.8)
  const padLat = Math.max(1.1, (maxLat - minLat) * 0.8)
  return {
    minLon: minLon - padLon,
    maxLon: maxLon + padLon,
    minLat: minLat - padLat,
    maxLat: maxLat + padLat,
  }
}

export function project(lon: number, lat: number, bounds: Bounds, width = 1000, height = 640): [number, number] {
  const x = ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * width
  const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * height
  return [x, y]
}

export function ringPath(ring: number[][], bounds: Bounds): string {
  return ring
    .map((point, index) => {
      const [x, y] = project(point[0], point[1], bounds)
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ') + ' Z'
}

export function countryPaths(bounds: Bounds): Array<{ id: string; name: string; small: boolean; d: string; label: [number, number] }> {
  return MIDDLE_EAST_MAP.countries.map((country) => ({
    id: country.id,
    name: country.name,
    small: country.small,
    d: country.rings.filter((ring) => ring.length >= 8).map((ring) => ringPath(ring, bounds)).join(' '),
    label: project(country.label[0], country.label[1], bounds),
  }))
}

function pointInRing(x: number, y: number, ring: number[][], bounds: Bounds): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = project(ring[i][0], ring[i][1], bounds)
    const [xj, yj] = project(ring[j][0], ring[j][1], bounds)
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 0.00001) + xi
    if (intersect) inside = !inside
  }
  return inside
}

export function countryAt(x: number, y: number, bounds: Bounds): string | null {
  let found: string | null = null
  for (const country of MIDDLE_EAST_MAP.countries) {
    for (const ring of country.rings) {
      if (ring.length < 8) continue
      if (pointInRing(x, y, ring, bounds)) found = country.id
    }
    if (country.small) {
      const [lx, ly] = project(country.label[0], country.label[1], bounds)
      const dx = x - lx
      const dy = y - ly
      if (dx * dx + dy * dy < 26 * 26) found = country.id
    }
  }
  return found
}
