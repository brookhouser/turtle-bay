import { DOJO_ACE_POSES, poseSrc } from '../fighter/sheet'
import { useBay } from '../context/useBay'

export function DojoPage() {
  const { kid } = useBay()
  if (!kid?.fighter) return null
  return (
    <div className="stack-page">
      <header className="page-head">
        <h1>Dojo Ace</h1>
        <p>White gi, orange trim, orange belt. This is the locked reference. Credits change skins later. They do not make him stronger.</p>
      </header>
      <img className="sheet-hero" src={poseSrc('ready')} alt="Dojo Ace reference sheet" />
      <p className="fine">{kid.credits} cosmetic credits.</p>
      <ul className="pose-list">
        {DOJO_ACE_POSES.map((pose) => (
          <li key={pose.id}>
            {pose.file ? <img src={`${import.meta.env.BASE_URL}${pose.file}`} alt="" /> : <span className="pose-missing">Needs art</span>}
            <strong>{pose.label}</strong>
            <span>{pose.status === 'reference' ? 'Reference sheet' : pose.status === 'from-sheet' ? 'Drawn from the sheet' : 'Still needs art'}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
