import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { PASS_ACCURACY } from '../config'
import { useBay } from '../context/useBay'
import { keysThrough, lessonById, nextLesson } from '../data/curriculum'
import { coachLine, fingerFor, prettyKey } from '../data/keyboard'
import { buildRematchPrompt, keysMatch, typingStats } from '../game/logic'
import { Hands } from '../components/Hands'
import { Keyboard } from '../components/Keyboard'
import { Turtle } from '../components/Turtle'
import type { LessonSummary, PlayableLesson } from '../types'

export function LessonPage() {
  const { lessonId, challengeId } = useParams()
  const [search] = useSearchParams()
  const location = useLocation()
  const { kid } = useBay()
  const isRematch = search.get('rematch') === '1'

  const playable = useMemo(() => {
    if (!kid) return null
    if (challengeId) {
      const challenge = kid.customChallenges.find((entry) => entry.id === challengeId)
      if (!challenge || challenge.type !== 'typing') return null
      const known = new Set<string>([' ', ...challenge.focusKeys, ...challenge.prompt.toLowerCase().split('')])
      return {
        id: `custom:${challenge.id}`,
        title: challenge.title,
        prompt: isRematch ? buildRematchPrompt(challenge.focusKeys, challenge.prompt) : challenge.prompt,
        coinReward: challenge.coinReward,
        newKeys: challenge.focusKeys,
        knownKeys: [...known],
        isRematch,
        isCustom: true,
      } satisfies PlayableLesson
    }
    if (!lessonId) return null
    const lesson = lessonById(lessonId)
    if (!lesson) return null
    const progress = kid.lessons[lesson.id]
    if (!progress?.unlocked) return null
    const missed = progress.lastMissedKeys
    return {
      id: lesson.id,
      title: lesson.title,
      prompt: isRematch ? buildRematchPrompt(missed, lesson.prompt) : lesson.prompt,
      coinReward: lesson.coinReward,
      newKeys: lesson.newKeys,
      knownKeys: keysThrough(lesson.order),
      isRematch,
      isCustom: false,
    } satisfies PlayableLesson
  }, [kid, lessonId, challengeId, isRematch])

  if (!kid) return null
  if (!playable) {
    return (
      <div className="lesson-shell">
        <p>That lesson is not open yet. Finish the earlier one at {PASS_ACCURACY}% accuracy.</p>
        <Link className="btn" to="/challenges">Back to challenges</Link>
      </div>
    )
  }

  return <Typer key={location.pathname + location.search} lesson={playable} />
}

function Typer({ lesson }: { lesson: PlayableLesson }) {
  const { recordLesson } = useBay()
  const [frozen] = useState(lesson)
  const prompt = frozen.prompt
  const stageRef = useRef<HTMLDivElement>(null)
  const recordRef = useRef(recordLesson)
  const indexRef = useRef(0)
  const correctRef = useRef(0)
  const errorRef = useRef(0)
  const streakRef = useRef(0)
  const bestRef = useRef(0)
  const missedRef = useRef<string[]>([])
  const startedRef = useRef<number | null>(null)
  const lockRef = useRef(false)

  const [index, setIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [errors, setErrors] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [missed, setMissed] = useState<string[]>([])
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [replayStamp] = useState(() => String(Date.now()))
  const [now, setNow] = useState(() => Date.now())
  const [wrong, setWrong] = useState(false)
  const [done, setDone] = useState(false)
  const [summary, setSummary] = useState<LessonSummary | null>(null)
  const [live, setLive] = useState(() => `Lesson ready. ${coachLine(prompt[0] ?? 'a')}`)

  useEffect(() => {
    recordRef.current = recordLesson
  })

  useEffect(() => {
    stageRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!startedAt || done) return
    const id = window.setInterval(() => setNow(Date.now()), 400)
    return () => window.clearInterval(id)
  }, [startedAt, done])

  useEffect(() => {
    const node = document.getElementById('current-ch')
    node?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [index])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (lockRef.current) return
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, select, button, a')) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (['Shift', 'CapsLock', 'Tab', 'Escape', 'Control', 'Alt', 'Meta'].includes(event.key)) return
      if (event.key === 'Backspace') {
        event.preventDefault()
        setLive('Keep going. Type the glowing key.')
        return
      }
      if (event.key.length !== 1) return
      event.preventDefault()
      const expected = prompt[indexRef.current]
      if (!expected) return
      const started = startedRef.current ?? Date.now()
      if (!startedRef.current) {
        startedRef.current = started
        setStartedAt(started)
      }
      if (keysMatch(expected, event.key)) {
        correctRef.current += 1
        setCorrect(correctRef.current)
        const nextStreak = streakRef.current + 1
        streakRef.current = nextStreak
        if (nextStreak > bestRef.current) bestRef.current = nextStreak
        const next = indexRef.current + 1
        indexRef.current = next
        setIndex(next)
        setStreak(nextStreak)
        setBestStreak(bestRef.current)
        setWrong(false)
        if (next >= prompt.length) {
          lockRef.current = true
          setDone(true)
          const stats = typingStats(correctRef.current, errorRef.current, started, Date.now())
          const result = recordRef.current({
            lessonId: frozen.id,
            title: frozen.title,
            wpm: stats.wpm,
            accuracy: stats.accuracy,
            streak: bestRef.current,
            missedKeys: missedRef.current,
            baseCoins: frozen.coinReward,
            isRematch: frozen.isRematch,
          })
          setSummary(result)
          setLive('Lesson complete.')
        }
      } else {
        errorRef.current += 1
        setErrors(errorRef.current)
        streakRef.current = 0
        setStreak(0)
        missedRef.current = [...missedRef.current, expected]
        setMissed(missedRef.current)
        setWrong(true)
        setLive(`Try again. ${coachLine(expected)}`)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [frozen, prompt])

  const stats = typingStats(correct, errors, startedAt ?? now, now)
  const nextChar = done ? null : prompt[index] ?? null
  const coach = nextChar ? coachLine(nextChar) : 'Lesson complete.'
  const upcoming = frozen.isCustom ? null : nextLesson(frozen.id)
  const again = (rematch: boolean) => {
    const base = frozen.isCustom ? `/custom/${frozen.id.replace('custom:', '')}` : `/lesson/${frozen.id}`
    const params = new URLSearchParams()
    if (rematch) params.set('rematch', '1')
    params.set('run', replayStamp)
    return `${base}?${params.toString()}`
  }

  return (
    <div className="lesson-shell">
      <div className="lesson-bar">
        <Link className="btn btn-small" to="/challenges">Back</Link>
        <h1>{frozen.isRematch ? `Practice: ${frozen.title}` : frozen.title}</h1>
        <div className="live-stats">
          <span>WPM {summary ? summary.wpm : startedAt ? stats.wpm : 0}</span>
          <span>Accuracy {summary ? summary.accuracy : errors + correct === 0 ? 100 : stats.accuracy}%</span>
          <span>Streak {streak}</span>
        </div>
      </div>
      <p className="laptop-note">Typing lessons fit best on a Chromebook or laptop.</p>
      {summary ? null : (
      <div
        className="type-stage"
        ref={stageRef}
        tabIndex={0}
        role="application"
        aria-label="Typing lesson. Use the keyboard."
      >
        <p className="prompt" aria-hidden="true">
          {prompt.split('').map((char, charIndex) => {
            const state = charIndex < index ? 'done' : charIndex === index ? 'current' : 'upcoming'
            return (
              <span
                key={`${charIndex}-${char}`}
                id={charIndex === index ? 'current-ch' : undefined}
                className={`ch ${state} ${state === 'current' && wrong ? 'bad' : ''}${state === 'current' ? ` finger-${fingerFor(char) || 'thumb'}` : ''}`}
              >
                {char}
              </span>
            )
          })}
        </p>
        <p className="coach">{coach}</p>
        <Hands active={nextChar ? fingerFor(nextChar) : null} />
        <Keyboard nextKey={nextChar} wrong={wrong} knownKeys={frozen.knownKeys} newKeys={frozen.newKeys} />
      </div>
      )}
      <div className="sr-only" aria-live="polite">{live}</div>
      {summary ? (
        <section className="results" aria-live="polite">
          <Turtle mood={summary.passed ? 'pet' : 'idle'} title="Turtle after the lesson" />
          <h2>{summary.passed ? 'Nice steady fins.' : 'Good practice. Try the tricky keys.'}</h2>
          <p>You earned {summary.coins} coins.</p>
          <p>{summary.wpm} WPM, {summary.accuracy}% accuracy, best streak {bestStreak}.</p>
          {!summary.passed ? (
            <p>Accuracy under {PASS_ACCURACY}%. The next lesson stays locked until a pass.</p>
          ) : null}
          {summary.passed && upcoming && !frozen.isRematch && !frozen.isCustom ? <p>Next up: {upcoming.title} is open.</p> : null}
          {missed.length > 0 ? (
            <p className="key-list">
              Tricky keys:
              {[...new Set(missed)].map((key) => (
                <span className="keycap" key={key}>{prettyKey(key)}</span>
              ))}
            </p>
          ) : null}
          <div className="button-row">
            {missed.length > 0 ? (
              <Link className="btn btn-primary" to={again(true)}>Practice tricky keys</Link>
            ) : null}
            <Link className="btn" to={again(false)}>Play it again</Link>
            <Link className="btn" to="/challenges">Back to challenges</Link>
          </div>
        </section>
      ) : null}
    </div>
  )
}

