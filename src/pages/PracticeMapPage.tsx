import { useEffect } from 'react'
import { WaveStage } from '../components/WaveStage'
import { MIDDLE_EAST_UNIT } from '../study/mapUnit'
import { useMapPractice } from '../study/practiceStore'

export function PracticeMapPage() {
  const practice = useMapPractice()

  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    const previous = document.title
    document.title = 'Map practice'
    return () => {
      meta.remove()
      document.title = previous
    }
  }, [])

  return (
    <div className="stack-page practice-map">
      <header className="page-head">
        <p className="eyebrow">Practice for Sam</p>
        <h1>{MIDDLE_EAST_UNIT.title}</h1>
        <p>No sign-in. Your score stays on this phone. It is not connected to the family bay.</p>
      </header>
      <WaveStage unit={MIDDLE_EAST_UNIT} practice={practice} />
    </div>
  )
}
