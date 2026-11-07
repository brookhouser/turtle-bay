import { useEffect, useRef } from 'react'
import { focusMap, MECA_GEOMETRY, MECA_MAP } from './meca'

export function MecaMapBoard({
  view,
  highlightId,
  labels,
  onTap,
}: {
  view: string
  highlightId: string | null
  labels: boolean
  onTap: (id: string, quiz: boolean) => void
}) {
  const host = useRef<HTMLDivElement | null>(null)
  const onTapRef = useRef(onTap)
  onTapRef.current = onTap

  useEffect(() => {
    const parent = host.current
    if (!parent) return
    parent.replaceChildren()
    const sea = `${import.meta.env.BASE_URL}runner/atlas/sea.jpg`
    const drawn = MECA_MAP.render(parent, MECA_GEOMETRY, { labels, width: 1100, sea })
    focusMap(drawn.svg, view)
    const zoom = MECA_MAP.attachPanZoom(drawn.wrap)
    const onClick = (event: Event) => {
      const mouse = event as MouseEvent
      const hit = drawn.hit(mouse.clientX, mouse.clientY)
      if (!hit?.properties?.id) return
      onTapRef.current(hit.properties.id, Boolean(hit.properties.quiz))
    }
    drawn.svg.addEventListener('click', onClick)
    return () => {
      drawn.svg.removeEventListener('click', onClick)
      zoom.destroy()
      parent.replaceChildren()
    }
  }, [view, labels])

  useEffect(() => {
    const svg = host.current?.querySelector('svg')
    if (!svg) return
    svg.querySelectorAll('.meca-selected').forEach((node) => node.classList.remove('meca-selected'))
    const wrap = svg.parentElement
    wrap?.classList.toggle('meca-asking', Boolean(highlightId))
    if (!highlightId) return
    svg.querySelectorAll(`[data-id="${highlightId}"]`).forEach((node) => node.classList.add('meca-selected'))
  }, [highlightId, view])

  return <div className="meca-host" ref={host} />
}
