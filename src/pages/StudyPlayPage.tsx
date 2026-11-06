import { Link, Navigate, useParams } from 'react-router-dom'
import { WaveStage } from '../components/WaveStage'
import { useBay } from '../context/useBay'
import { hubUnit } from '../study/hub'

export function StudyPlayPage() {
  const { unitId } = useParams()
  const { kid } = useBay()
  const unit = unitId ? hubUnit(unitId) : undefined
  if (!kid) return null
  if (kid.id !== 'sam') return <Navigate to="/home" replace />
  if (!unit) return <Navigate to="/study" replace />
  return (
    <div className="stack-page">
      <Link to="/study" className="text-button">Back to study</Link>
      <header className="page-head">
        <h1>{unit.title}</h1>
        <p>{unit.kind === 'map' ? 'Tap or name the country. Your fighter holds the lane.' : 'Answer in the wave. Your fighter holds the lane.'}</p>
      </header>
      <WaveStage unit={unit} />
    </div>
  )
}
