import mapRender from './maps/middle-east-central-asia/map-render.js'
import questions from './maps/middle-east-central-asia/questions.js'
import geometryText from './maps/middle-east-central-asia/geometry.geojson?raw'
import type { MecaCollection } from './maps/middle-east-central-asia/map-render.js'
import { COUNTRY_PACK, viewBoxFor } from './mapUnit'

export const MECA_GEOMETRY = JSON.parse(geometryText) as MecaCollection
export const MECA_MAP = mapRender
export const gradeTyped = questions.gradeTyped

export function gradeCountry(countryId: string, input: string): { ok: boolean; hint: string } {
  const result = gradeTyped(COUNTRY_PACK.countries, countryId, input)
  return { ok: result.ok, hint: result.hint || '' }
}

export function focusMap(svg: SVGSVGElement, viewName: string) {
  const view = viewBoxFor(viewName)
  const originX = Number(svg.getAttribute('data-origin-x'))
  const originY = Number(svg.getAttribute('data-origin-y'))
  const scale = Number(svg.getAttribute('data-scale'))
  const corner = (lon: number, lat: number) => {
    const [x, y] = mapRender.project(lon, lat)
    return [(x - originX) * scale, (originY - y) * scale]
  }
  const nw = corner(view.west, view.north)
  const se = corner(view.east, view.south)
  const x = Math.min(nw[0], se[0])
  const y = Math.min(nw[1], se[1])
  svg.setAttribute('viewBox', `${x.toFixed(1)} ${y.toFixed(1)} ${Math.abs(se[0] - nw[0]).toFixed(1)} ${Math.abs(se[1] - nw[1]).toFixed(1)}`)
}
