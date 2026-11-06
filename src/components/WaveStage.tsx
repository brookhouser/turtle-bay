import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { useBay } from '../context/useBay'
import { poseSrc } from '../fighter/sheet'
import { ensureUnit } from '../study/engine'
import type { ZoneId } from '../study/engine'
import { chargeHero, freshHero, heroKit, inRange, knockback, noteMiss, strikePower, tickHero, duelStrike, type HeroRuntime, type SpecialId } from '../study/hero'
import type { PoseId } from '../fighter/sheet'
import { MecaMapBoard } from '../study/MecaMapBoard'
import { nextMapPrompt, typedMatch, type MapPrompt } from '../study/mapQuestions'
import { makeQuestion, pickWord, planWave, zoneOpen, type Question } from '../study/engine'
import type { StudyUnit } from '../study/content'
import { blankUnit } from '../study/engine'

type Enemy = { id: number; x: number; y: number; hp: number; boss?: boolean }

const LANE = [
  { x: 0.08, y: 0.72 },
  { x: 0.42, y: 0.72 },
  { x: 0.42, y: 0.28 },
  { x: 0.9, y: 0.28 },
]

function along(t: number): { x: number; y: number } {
  const spans: Array<{ a: { x: number; y: number }; b: { x: number; y: number }; len: number }> = []
  let total = 0
  for (let i = 1; i < LANE.length; i += 1) {
    const a = LANE[i - 1]
    const b = LANE[i]
    const len = Math.hypot(b.x - a.x, b.y - a.y)
    spans.push({ a, b, len })
    total += len
  }
  let left = Math.min(1, Math.max(0, t)) * total
  for (const span of spans) {
    if (left <= span.len) {
      const p = span.len === 0 ? 0 : left / span.len
      return { x: span.a.x + (span.b.x - span.a.x) * p, y: span.a.y + (span.b.y - span.a.y) * p }
    }
    left -= span.len
  }
  return LANE[LANE.length - 1]
}

export function WaveStage({ unit }: { unit: StudyUnit }) {
  const { kid, world, answerStudy } = useBay()
  const family = world.families.find((entry) => entry.id === kid?.familyId)
  const thresholds = family?.studyThresholds
  const progress = ensureUnit(kid?.study ?? { units: {} }, unit.id).unit
  const kit = heroKit(unit, progress, thresholds)
  const [zone, setZone] = useState<ZoneId>('field')
  const [hero, setHero] = useState<HeroRuntime>(freshHero())
  const [enemies, setEnemies] = useState<Enemy[]>([])
  const [banner, setBanner] = useState('Drag your fighter. Correct answers charge his combo.')
  const [typed, setTyped] = useState('')
  const [recent, setRecent] = useState<string[]>([])
  const [seed, setSeed] = useState(3)
  const [mapPrompt, setMapPrompt] = useState<MapPrompt | null>(unit.kind === 'map' ? nextMapPrompt(blankUnit(), [], 3, 'field') : null)
  const [wordQuestion, setWordQuestion] = useState<Question | null>(null)
  const [bossHp, setBossHp] = useState(8)
  const [pose, setPose] = useState<PoseId>('ready')
  const drag = useRef<{ dx: number; dy: number } | null>(null)
  const boardRef = useRef<HTMLDivElement | null>(null)
  const heroRef = useRef(hero)
  heroRef.current = hero
  const poseNow: PoseId = hero.retreated ? 'retreat' : pose
  const duel = zone === 'legend'
  const mapView = mapPrompt?.view ?? 'full'

  function askNext(nextSeed: number, nextRecent: string[]) {
    if (unit.kind === 'map') setMapPrompt(nextMapPrompt(progress, nextRecent, nextSeed, zone))
    else {
      const word = pickWord(unit, progress, nextRecent, nextSeed)
      setWordQuestion(makeQuestion(unit, word, nextSeed + 9))
    }
  }

  useEffect(() => {
    askNext(seed, [])
    const plan = planWave(zone, seed)
    if (duel) setEnemies([{ id: 1, ...along(0.2), hp: 8, boss: true }])
    else setEnemies(plan.questionSeeds.slice(0, 3).map((value, index) => ({ id: value, ...along(0.12 * index), hp: 3 })))
    // The wave is a live board; questions refresh when the zone changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zone, unit.id])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHero((current) => tickHero(current))
      setEnemies((current) => {
        const power = strikePower(progress)
        let retreated = heroRef.current
        const next = current.map((enemy) => {
          const step = enemy.boss ? 0.004 : 0.012
          const moved = along(Math.min(0.98, enemyPosition(enemy) + step))
          let hp = enemy.hp
          if (inRange(heroRef.current, moved)) hp -= power * 0.35
          return { ...enemy, ...moved, hp }
        }).filter((enemy) => enemy.hp > 0)
        const leaked = current.filter((enemy) => enemy.hp > 0 && enemyPosition(enemy) > 0.96)
        if (leaked.length > 0) {
          retreated = knockback(heroRef.current)
          setHero(retreated)
          setBanner('Knocked back. He steps out to the dojo, then returns.')
        }
        if (next.length === 0 && !duel) {
          next.push({ id: Date.now(), ...along(0), hp: 3 })
        }
        return next.filter((enemy) => enemyPosition(enemy) <= 0.97)
      })
    }, 450)
    return () => window.clearInterval(timer)
  }, [progress, duel])

  function enemyPosition(enemy: Enemy): number {
    let best = 0
    let bestDist = 99
    for (let step = 0; step <= 40; step += 1) {
      const t = step / 40
      const point = along(t)
      const dist = Math.hypot(point.x - enemy.x, point.y - enemy.y)
      if (dist < bestDist) {
        bestDist = dist
        best = t
      }
    }
    return best
  }

  function resolve(correct: boolean, shaky: boolean) {
    const wordId = unit.kind === 'map' ? mapPrompt?.countryId : wordQuestion?.wordId
    if (!wordId) return
    const result = answerStudy(unit.id, wordId, correct)
    const fired = correct ? chargeHero(hero, kit, shaky || Boolean(progress.words[wordId]?.weakened)) : { hero: noteMiss(hero), fired: null, weakenedHit: false, laneClear: false }
    setHero(fired.hero)
    if (fired.fired === 'spin-kick' || fired.fired === 'team-up' || fired.fired === 'super') {
      setPose('spin-kick')
      window.setTimeout(() => setPose('ready'), 700)
    }
    if (fired.laneClear) setEnemies((current) => current.filter((enemy) => enemy.boss))
    else if (fired.fired && fired.weakenedHit) setEnemies((current) => current.map((enemy, index) => index === 0 ? { ...enemy, hp: enemy.hp - 1 } : enemy))
    if (duel && correct) {
      const hit = duelStrike(bossHp, fired.weakenedHit || shaky)
      setBossHp(hit.bossHp)
      setBanner(hit.graze ? 'Graze. The next special is thin.' : 'Hit. The duel continues.')
    } else if (fired.fired) {
      setBanner(specialLine(fired.fired, fired.weakenedHit))
    } else if (!correct) setBanner('Miss. The next special comes out softer. The wave keeps going.')
    else if (result?.justMastered) setBanner(`Mastered. ${result.unlockName} is yours.`)
    else setBanner('Nice. The combo meter climbed.')
    const nextRecent = [...recent, wordId].slice(-3)
    setRecent(nextRecent)
    const nextSeed = seed + 1
    setSeed(nextSeed)
    askNext(nextSeed, nextRecent)
    setTyped('')
  }

  function onBoardPointer(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current || !boardRef.current) return
    const rect = boardRef.current.getBoundingClientRect()
    const x = Math.min(0.9, Math.max(0.08, (event.clientX - rect.left) / rect.width))
    const y = Math.min(0.88, Math.max(0.12, (event.clientY - rect.top) / rect.height))
    setHero((current) => current.retreated ? current : { ...current, x, y })
  }

  return (
    <div className="wave-wrap">
      <div className="zone-row" role="tablist" aria-label="Zones">
        {(['field', 'ridge', 'core', 'hard', 'legend'] as ZoneId[]).map((item) => {
          const open = zoneOpen(unit, progress, item, thresholds)
          return (
            <button key={item} type="button" className={zone === item ? 'on' : ''} disabled={!open} onClick={() => setZone(item)}>
              {zoneLabel(item)}
            </button>
          )
        })}
      </div>
      <div
        className={`wave-board ${hero.retreated ? 'is-retreat' : ''}`}
        ref={boardRef}
        onPointerMove={onBoardPointer}
        onPointerUp={() => { drag.current = null }}
      >
        {unit.kind === 'map' ? (
          <MecaMapBoard
            view={mapView}
            highlightId={mapPrompt && mapPrompt.mode !== 'tap' ? mapPrompt.countryId : null}
            onTap={(id, quiz) => {
              if (mapPrompt?.mode !== 'tap') return
              if (!quiz) {
                setBanner('That country is on the map for context. It is not one of the 22.')
                return
              }
              resolve(id === mapPrompt.countryId, false)
            }}
          />
        ) : null}
        <svg className="wave-lane" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <polyline points={LANE.map((point) => `${point.x * 100},${point.y * 100}`).join(' ')} />
        </svg>
        {enemies.map((enemy) => (
          <span key={enemy.id} className={enemy.boss ? 'enemy boss' : 'enemy'} style={{ left: `${enemy.x * 100}%`, top: `${enemy.y * 100}%` }} />
        ))}
        <button
          type="button"
          className="hero-token"
          style={{ left: `${hero.x * 100}%`, top: `${hero.y * 100}%` }}
          aria-label="Dojo Ace, drag to move"
          onPointerDown={(event) => {
            drag.current = { dx: event.clientX, dy: event.clientY }
            event.currentTarget.setPointerCapture(event.pointerId)
          }}
        >
          <img src={poseSrc(poseNow)} alt="" />
          <span>{hero.retreated ? 'Dojo' : 'Hero'}</span>
        </button>
        <div className="combo-meter" aria-label={`Combo ${hero.combo}`}>
          <span style={{ width: `${hero.combo}%` }} />
        </div>
      </div>
      <p className="banner">{banner}</p>
      <ul className="skill-row">
        <li className={kit.spinKick ? 'on' : ''}>Spin kick {kit.spinKick ? 'ready' : 'learn a cluster'}</li>
        <li className={kit.secondSlot ? 'on' : ''}>Second slot {kit.secondSlot ? 'open' : 'opens at 1/3'}</li>
        <li className={kit.teamUp ? 'on' : ''}>Tower team-up {kit.teamUp ? 'open' : 'opens at 2/3'}</li>
        <li className={kit.superMove ? 'on' : ''}>Super {kit.superMove ? 'open' : 'opens in Hard'}</li>
      </ul>
      <p className="fine">Power {strikePower(progress)}. Credits do not change this.</p>
      {duel ? <p className="fine">Duel. Boss stamina {bossHp}. Each right answer lands a hit.</p> : null}
      {unit.kind === 'map' && mapPrompt ? (
        <div className="question-card">
          {mapPrompt.mode === 'tap' ? <h2>Tap {mapPrompt.name}</h2> : null}
          {mapPrompt.mode === 'choice' ? (
            <>
              <h2>{mapPrompt.name} is highlighted. Which country is it?</h2>
              <div className="choice-grid">
                {mapPrompt.choices.map((choice) => (
                  <button key={choice.id} type="button" className="btn" onClick={() => resolve(choice.id === mapPrompt.countryId, false)}>{choice.label}</button>
                ))}
              </div>
            </>
          ) : null}
          {mapPrompt.mode === 'type' ? (
            <form onSubmit={(event) => {
              event.preventDefault()
              const graded = typedMatch(mapPrompt.countryId, typed)
              if (!graded.ok && graded.hint) setBanner(graded.hint)
              resolve(graded.ok, false)
            }}>
              <h2>Type the highlighted country</h2>
              <input className="bay-input" value={typed} onChange={(event) => setTyped(event.target.value)} aria-label="Country name" />
              <button className="btn btn-primary" type="submit">Check</button>
            </form>
          ) : null}
        </div>
      ) : null}
      {unit.kind !== 'map' && wordQuestion ? (
        <div className="question-card">
          <h2>{wordQuestion.prompt}</h2>
          <div className="choice-grid">
            {wordQuestion.choices.map((choice) => (
              <button key={choice.id} type="button" className="btn" onClick={() => resolve(choice.id === wordQuestion.answerId, false)}>{choice.label}</button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function specialLine(fired: SpecialId, weak: boolean): string {
  const name = fired === 'spin-kick' ? 'Spin kick' : fired === 'palm-burst' ? 'Palm burst' : fired === 'team-up' ? 'Tower team-up' : 'Super'
  return weak ? `${name} came out soft.` : `${name} clears the lane.`
}

function zoneLabel(zone: ZoneId): string {
  if (zone === 'field') return 'Field'
  if (zone === 'ridge') return 'Ridge'
  if (zone === 'core') return 'Core'
  if (zone === 'hard') return 'Hard'
  return 'Boss duel'
}
