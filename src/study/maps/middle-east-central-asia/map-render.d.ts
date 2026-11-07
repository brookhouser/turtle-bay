export interface MecaFeature {
  properties: {
    id: string
    name: string
    quiz?: boolean
    small?: boolean
    suggestedView?: string
  }
  geometry: { type: string; coordinates: unknown }
}

export interface MecaCollection {
  type: string
  features: MecaFeature[]
  meta?: {
    views?: Record<string, { west: number; south: number; east: number; north: number }>
  }
}

export interface MecaDraw {
  svg: SVGSVGElement
  wrap: HTMLElement
  scale: number
  hit: (clientX: number, clientY: number, slopPx?: number) => MecaFeature | null
}

declare const api: {
  project: (lon: number, lat: number) => [number, number]
  hitTest: (fc: MecaCollection, lon: number, lat: number, opt?: { quizOnly?: boolean }) => MecaFeature | null
  pathFromGeometry: (geometry: MecaFeature['geometry'], originX: number, originY: number, scale: number) => string
  render: (container: HTMLElement, fc: MecaCollection, options?: { labels?: boolean; width?: number; quizOnly?: boolean; sea?: string }) => MecaDraw
  attachPanZoom: (wrap: HTMLElement) => { destroy: () => void; reset: () => void }
}

export default api
