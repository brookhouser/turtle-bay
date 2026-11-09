import { memo, useEffect, useRef, useState } from 'react'
import { useBay } from '../context/useBay'
import type { RunnerHandle } from '../runner/createGame'
import { abilitiesUnlocked, nextAbility, pickRunnerWord, runnerZoneOpen } from '../runner/abilities'
import { makeQuestion, type Question, type ZoneId } from '../study/engine'
import type { StudyUnit } from '../study/content'
import type { RunnerAbility, RunnerConfig } from '../runner/types'

const ZONES: ZoneId[] = ['field', 'ridge', 'core', 'hard', 'legend']

const RunnerStage = memo(function RunnerStage({ host }: { host: { current: HTMLDivElement | null } }) {
  return <div className="runner-stage" ref={host} />
})

export function RunnerScreen({
  title,
  lede,
  config,
  units,
  abilities,
  seenKey,
  onShell,
}: {
  title: string
  lede: string
  config: RunnerConfig
  units: StudyUnit[]
  abilities: RunnerAbility[]
  seenKey: string
  onShell?: () => void
}) {
  const { kid, world, answerStudy } = useBay()
  const host = useRef<HTMLDivElement | null>(null)
  const handle = useRef<RunnerHandle | null>(null)
  const [zone, setZone] = useState<ZoneId>('field')
  const [status, setStatus] = useState('Tap or hold to jump.')
  const [gate, setGate] = useState<Question | null>(null)
  const [gateUnit, setGateUnit] = useState(units[0]?.id ?? '')
  const [unlock, setUnlock] = useState<string | null>(null)
  const [hearts, setHearts] = useState(config.hearts)
  const [runProgress, setRunProgress] = useState(0)
  const [flash, setFlash] = useState<string | null>(null)
  const recent = useRef<string[]>([])
  const seed = useRef(4)
  const studyRef = useRef(kid?.study)
  const unitsRef = useRef(units)
  unitsRef.current = units
  if (kid) studyRef.current = kid.study
  if (!kid) return null
  const thresholds = world.families.find((family) => family.id === kid.familyId)?.studyThresholds
  const mastered = units.reduce((count, unit) => {
    const progress = kid.study.units[unit.id]
    return count + unit.words.filter((word) => progress?.words[word.id]?.mastered).length
  }, 0)
  const unlocked = abilitiesUnlocked(mastered, abilities)
  const level = config.levels.find((item) => item.zone === zone) ?? config.levels[0]

  useEffect(() => {
    const seen = Number(sessionStorage.getItem(seenKey) ?? '0')
    if (mastered > seen) {
      const ability = abilitiesUnlocked(mastered, abilities).at(-1)
      if (ability) setUnlock(ability.name)
    }
  }, [abilities, mastered, seenKey])

  useEffect(() => {
    const parent = host.current
    if (!parent) return
    let dead = false
    let local: RunnerHandle | null = null
    const open = unlocked.map((item) => item.id)
    void import('../runner/createGame').then(({ mountRunner }) => {
      if (dead) return
      local = mountRunner({
        parent,
        config,
        level,
        abilities: open,
        hooks: {
          onStatus: setStatus,
          onShell,
          onHearts: setHearts,
          onProgress: setRunProgress,
          onGate: () => {
            const currentUnits = unitsRef.current
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

  function answer(id: string) {
    if (!gate || flash) return
    const correct = id === gate.answerId
    setFlash(id)
    window.setTimeout(() => {
      answerStudy(gateUnit, gate.wordId, correct)
      handle.current?.resolveGate(correct)
      setGate(null)
      setFlash(null)
    }, 380)
  }

  const upcoming = nextAbility(mastered, abilities)

  return (
    <div className="stack-page">
      <header className="page-head">
        <h1>{title}</h1>
        <p>{lede}</p>
      </header>
      <div className="zone-row" role="tablist" aria-label="Runner zones">
        {ZONES.map((item) => {
          const open = runnerZoneOpen(units, kid.study, item, thresholds)
          const label = config.levels.find((levelItem) => levelItem.zone === item)?.name ?? item
          return (
            <button key={item} type="button" className={zone === item ? 'on' : ''} disabled={!open} onClick={() => setZone(item)}>
              {label}
            </button>
          )
        })}
      </div>
      <div className="runner-play">
        <RunnerStage host={host} />
        <div className="run-hud">
          <div className="run-hearts" aria-label={`${hearts} hearts`}>
            {Array.from({ length: Math.max(hearts, 1) }, (_, index) => (
              <img key={index} src={`${import.meta.env.BASE_URL}runner/hud/heart.png`} alt="" />
            ))}
          </div>
          <div className="run-bar" aria-label="Course progress"><span style={{ width: `${Math.round(runProgress * 100)}%` }} /></div>
          <div className="run-coins">{kid.motivation === 'fighter' ? `${kid.credits} cr` : `${Math.round(kid.turtle.coins)}`}</div>
        </div>
        {gate ? (
          <div className="question-card gate-card quiz-card" role="dialog" aria-label="Question gate">
            <h2>{gate.prompt}</h2>
            <div className="choice-grid">
              {gate.choices.map((choice) => (
                <button key={choice.id} type="button" className={`btn quiz-choice ${flash === choice.id ? (choice.id === gate.answerId ? 'is-right' : 'is-wrong') : ''}`} onClick={() => answer(choice.id)}>{choice.label}</button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      <p className="banner" role="status">{status}</p>
      <p className="fine">{unlocked.length === 0 ? `Master one item to unlock ${abilities[0]?.name ?? 'the first trick'}.` : unlocked.map((item) => item.name).join(' · ')}{upcoming ? ` Next: ${upcoming.name}.` : ''}</p>
      {unlock ? (
        <div className="unlock-screen" role="dialog" aria-label="Ability unlock">
          <div className="panel">
            <p className="eyebrow">Ability unlocked</p>
            <h2>{unlock}</h2>
            <p>It came from mastery, not coins. Hidden paths in this run open with it.</p>
            <button className="btn btn-primary" type="button" onClick={() => { sessionStorage.setItem(seenKey, String(mastered)); setUnlock(null) }}>Run</button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
