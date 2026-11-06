import { useEffect, useRef, useState } from 'react'
import { useBay } from '../context/useBay'
import type { RunnerHandle } from '../runner/createGame'
import { abilitiesUnlocked, nextAbility, pickRunnerWord, runnerUnits, runnerZoneOpen } from '../runner/abilities'
import { samRunnerConfig } from '../runner/samRunner'
import { makeQuestion, type Question, type ZoneId } from '../study/engine'
import { hubUnits } from '../study/hub'

const ZONES: ZoneId[] = ['field', 'ridge', 'core', 'hard', 'legend']

export function RunnerPage() {
  const { kid, world, answerStudy } = useBay()
  const host = useRef<HTMLDivElement | null>(null)
  const handle = useRef<RunnerHandle | null>(null)
  const [zone, setZone] = useState<ZoneId>('field')
  const [status, setStatus] = useState('Tap or hold to jump.')
  const [gate, setGate] = useState<Question | null>(null)
  const [gateUnit, setGateUnit] = useState('vocab')
  const [unlock, setUnlock] = useState<string | null>(null)
  const recent = useRef<string[]>([])
  const seed = useRef(4)
  const studyRef = useRef(kid?.study)
  if (kid) studyRef.current = kid.study
  if (!kid) return null
  const units = runnerUnits(hubUnits())
  const thresholds = world.families.find((family) => family.id === kid.familyId)?.studyThresholds
  const mastered = units.reduce((count, unit) => {
    const progress = kid.study.units[unit.id]
    return count + unit.words.filter((word) => progress?.words[word.id]?.mastered).length
  }, 0)
  const unlocked = abilitiesUnlocked(mastered)
  const config = samRunnerConfig()
  const level = config.levels.find((item) => item.zone === zone) ?? config.levels[0]

  useEffect(() => {
    const seen = Number(sessionStorage.getItem('runner-seen-abilities') ?? '0')
    if (mastered > seen) {
      const ability = abilitiesUnlocked(mastered).at(-1)
      if (ability) setUnlock(ability.name)
    }
  }, [mastered])

  useEffect(() => {
    const parent = host.current
    if (!parent) return
    let dead = false
    let local: RunnerHandle | null = null
    const abilities = abilitiesUnlocked(mastered).map((item) => item.id)
    void import('../runner/createGame').then(({ mountRunner }) => {
      if (dead) return
      local = mountRunner({
        parent,
        config,
        level,
        abilities,
        hooks: {
          onStatus: setStatus,
          onGate: () => {
            const currentUnits = runnerUnits(hubUnits())
            const picked = pickRunnerWord(currentUnits, studyRef.current ?? { units: {} }, recent.current, seed.current)
            seed.current += 1
            recent.current = [...recent.current, picked.word.id].slice(-3)
            setGateUnit(picked.unitId)
            const source = currentUnits.find((unit) => unit.id === picked.unitId) ?? currentUnits[0]
            setGate(makeQuestion(source, picked.word, seed.current))
          },
        },
      })
      handle.current = local
    })
    return () => {
      dead = true
      local?.destroy()
      handle.current?.destroy()
      handle.current = null
    }
    // Restart only when the zone changes. Mastery updates must not reload the run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zone])

  function answer(correct: boolean) {
    if (!gate) return
    answerStudy(gateUnit, gate.wordId, correct)
    handle.current?.resolveGate(correct)
    setGate(null)
  }

  const upcoming = nextAbility(mastered)

  return (
    <div className="stack-page">
      <header className="page-head">
        <h1>Runner</h1>
        <p>Dojo Ace runs. Tap or hold to jump. Mastery from vocab and the map quiz opens the tricks.</p>
      </header>
      <div className="zone-row" role="tablist" aria-label="Runner zones">
        {ZONES.map((item) => {
          const open = runnerZoneOpen(units, kid.study, item, thresholds)
          return (
            <button key={item} type="button" className={zone === item ? 'on' : ''} disabled={!open} onClick={() => setZone(item)}>
              {item === 'legend' ? 'Boss' : item[0].toUpperCase() + item.slice(1)}
            </button>
          )
        })}
      </div>
      <div className="runner-play">
        <div className="runner-stage" ref={host} />
        {gate ? (
          <div className="question-card gate-card" role="dialog" aria-label="Question gate">
            <h2>{gate.prompt}</h2>
            <div className="choice-grid">
              {gate.choices.map((choice) => (
                <button key={choice.id} type="button" className="btn" onClick={() => answer(choice.id === gate.answerId)}>{choice.label}</button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      <p className="banner" role="status">{status}</p>
      <p className="fine">{unlocked.length === 0 ? 'Master one item to unlock double jump.' : unlocked.map((item) => item.name).join(' · ')}{upcoming ? ` Next: ${upcoming.name}.` : ''}</p>
      {unlock ? (
        <div className="unlock-screen" role="dialog" aria-label="Ability unlock">
          <div className="panel">
            <p className="eyebrow">Ability unlocked</p>
            <h2>{unlock}</h2>
            <p>It came from mastery, not credits. Hidden paths in this run open with it.</p>
            <button className="btn btn-primary" type="button" onClick={() => { sessionStorage.setItem('runner-seen-abilities', String(mastered)); setUnlock(null) }}>Run</button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
