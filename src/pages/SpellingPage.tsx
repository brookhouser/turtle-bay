import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { SPELLING_REVEAL_MS } from '../config'
import { Hands } from '../components/Hands'
import { Keyboard } from '../components/Keyboard'
import { CrabbyPatty } from '../components/CrabbyPatty'
import { Turtle } from '../components/Turtle'
import { useBay } from '../context/useBay'
import { coachLine, fingerFor } from '../data/keyboard'
import { spellingListFromChallenge, WEEKLY_SPELLING, type SpellingList } from '../data/spelling'
import { keysMatch } from '../game/logic'
import { judgeSpelling, nextLetter, PATTY_LAYERS, pointsForCorrect, requeueWord } from '../game/spelling'
import { cancelSpeech, hiddenSentence, prepareVoices, speakSpelling, speechAvailable } from '../lib/speech'

type Phase = 'round1' | 'bridge' | 'round2' | 'reveal' | 'done'

export function SpellingPage() {
  const { challengeId } = useParams()
  const { kid } = useBay()
  const [run, setRun] = useState(0)
  const list = useMemo(() => {
    if (!challengeId) return WEEKLY_SPELLING
    const challenge = kid?.customChallenges.find((entry) => entry.id === challengeId && entry.type === 'spelling')
    if (!challenge) return null
    return spellingListFromChallenge(challenge)
  }, [challengeId, kid])

  if (!kid) return null
  if (!list) {
    return (
      <div className="lesson-shell">
        <p>That spelling list is not ready yet.</p>
        <Link className="btn" to="/challenges">Back to challenges</Link>
      </div>
    )
  }

  return <Speller key={`${list.id}-${run}`} list={list} onReplay={() => setRun((value) => value + 1)} />
}

function Speller({ list, onReplay }: { list: SpellingList; onReplay: () => void }) {
  const { kid, recordSpelling, feedPatty, pushToast } = useBay()
  const words = useMemo(() => list.words.map((entry) => entry.word), [list])
  const sentences = useMemo(() => new Map(list.words.map((entry) => [entry.word, entry.sentence])), [list])
  const goal = Math.min(words.length, PATTY_LAYERS.length)

  const phaseRef = useRef<Phase>('round1')
  const queueRef = useRef<string[]>(words)
  const indexRef = useRef(0)
  const typedRef = useRef('')
  const streakRef = useRef(0)
  const bestRef = useRef(0)
  const pointsRef = useRef(0)
  const correctRef = useRef<string[]>([])
  const missedRef = useRef<string[]>([])
  const layersRef = useRef(0)
  const dirtyRef = useRef(false)
  const lockRef = useRef(false)
  const savedRef = useRef(false)
  const wordsRef = useRef(words)
  const sentencesRef = useRef(sentences)
  const recordRef = useRef(recordSpelling)
  const persistRef = useRef<(finished: boolean, publish: boolean) => string | null>(() => null)
  const stageRef = useRef<HTMLDivElement>(null)

  const [phase, setPhase] = useState<Phase>('round1')
  const [queue, setQueue] = useState<string[]>(words)
  const [index, setIndex] = useState(0)
  const [typed, setTyped] = useState('')
  const [wrong, setWrong] = useState(false)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [points, setPoints] = useState(0)
  const [layers, setLayers] = useState(0)
  const [missed, setMissed] = useState<string[]>([])
  const [revealWord, setRevealWord] = useState<string | null>(null)
  const [pop, setPop] = useState(0)
  const [cheer, setCheer] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [fed, setFed] = useState(false)
  const [eating, setEating] = useState(false)
  const [feedNote, setFeedNote] = useState<string | null>(null)
  const [soundOn] = useState(speechAvailable)

  wordsRef.current = words
  sentencesRef.current = sentences
  recordRef.current = recordSpelling

  function syncPhase(next: Phase) {
    phaseRef.current = next
    setPhase(next)
  }

  function bumpStreak() {
    const nextStreak = streakRef.current + 1
    streakRef.current = nextStreak
    if (nextStreak > bestRef.current) bestRef.current = nextStreak
    setStreak(nextStreak)
    setBestStreak(bestRef.current)
    return nextStreak
  }

  function sentenceFor(word: string): string {
    return sentencesRef.current.get(word) ?? `The word is ${word}.`
  }

  function say(word: string) {
    speakSpelling(word, sentenceFor(word))
  }

  function persist(finished: boolean, publish: boolean) {
    if (savedRef.current) return null
    if (correctRef.current.length === 0 && missedRef.current.length === 0) return null
    savedRef.current = true
    const id = recordRef.current({
      listId: list.id,
      listTitle: list.title,
      correctWords: correctRef.current,
      missedWords: missedRef.current,
      points: pointsRef.current,
      bestStreak: bestRef.current,
      reward: list.coinReward,
      finished,
    })
    if (publish && id) setSessionId(id)
    return id
  }

  persistRef.current = persist

  useEffect(() => {
    prepareVoices()
    stageRef.current?.focus()
    return () => {
      cancelSpeech()
      if (phaseRef.current === 'done') return
      persistRef.current(false, false)
    }
  }, [])

  useEffect(() => {
    if (phase !== 'reveal' || !revealWord) return
    lockRef.current = true
    const id = window.setTimeout(() => {
      lockRef.current = false
      setCheer('')
      setWrong(false)
      syncPhase('round2')
      const next = queueRef.current[0]
      if (next) say(next)
      stageRef.current?.focus()
    }, SPELLING_REVEAL_MS)
    return () => window.clearTimeout(id)
    // say() reads the latest sentence map through a ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, revealWord])

  useEffect(() => {
    if (!cheer || phase === 'reveal' || phase === 'done') return
    const id = window.setTimeout(() => setCheer(''), 1400)
    return () => window.clearTimeout(id)
  }, [cheer, phase])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (lockRef.current) return
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, select, button, a')) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (['Shift', 'CapsLock', 'Tab', 'Escape', 'Control', 'Alt', 'Meta'].includes(event.key)) return
      if (phaseRef.current === 'bridge' || phaseRef.current === 'done' || phaseRef.current === 'reveal') return
      if (event.key === ' ') event.preventDefault()

      if (phaseRef.current === 'round1') {
        const word = queueRef.current[0]
        const expected = word ? nextLetter(word, indexRef.current) : null
        if (!word || !expected) return
        if (event.key === 'Backspace') {
          event.preventDefault()
          return
        }
        if (event.key.length !== 1) return
        event.preventDefault()
        if (keysMatch(expected, event.key)) {
          const next = indexRef.current + 1
          indexRef.current = next
          setIndex(next)
          setWrong(false)
          if (next < word.length) return
          if (!dirtyRef.current) bumpStreak()
          const rest = queueRef.current.slice(1)
          indexRef.current = 0
          setIndex(0)
          dirtyRef.current = false
          if (rest.length === 0) {
            const fresh = [...wordsRef.current]
            queueRef.current = fresh
            setQueue(fresh)
            syncPhase('bridge')
            return
          }
          queueRef.current = rest
          setQueue(rest)
          return
        }
        dirtyRef.current = true
        streakRef.current = 0
        setStreak(0)
        setWrong(true)
        return
      }

      if (phaseRef.current !== 'round2') return
      const word = queueRef.current[0]
      if (!word) return
      if (event.key === 'Backspace') {
        event.preventDefault()
        typedRef.current = typedRef.current.slice(0, -1)
        setTyped(typedRef.current)
        setWrong(false)
        return
      }
      if (event.key === 'Enter') {
        event.preventDefault()
        grade(word, typedRef.current)
        return
      }
      if (event.key.length !== 1 || !/^[a-zA-Z]$/.test(event.key)) return
      event.preventDefault()
      if (typedRef.current.length >= word.length) return
      typedRef.current += event.key.toLowerCase()
      setTyped(typedRef.current)
      if (typedRef.current.length === word.length) grade(word, typedRef.current)
    }

    function grade(word: string, attempt: string) {
      if (judgeSpelling(word, attempt)) {
        const nextStreak = bumpStreak()
        const gained = pointsForCorrect(nextStreak)
        pointsRef.current += gained
        correctRef.current = [...correctRef.current, word]
        layersRef.current += 1
        const rest = queueRef.current.slice(1)
        queueRef.current = rest
        typedRef.current = ''
        setPoints(pointsRef.current)
        setLayers(layersRef.current)
        setTyped('')
        setQueue(rest)
        setPop((value) => value + 1)
        setWrong(false)
        const layer = PATTY_LAYERS[Math.min(layersRef.current, PATTY_LAYERS.length) - 1]
        if (rest.length === 0) {
          setCheer('The crabby patty is ready!')
          syncPhase('done')
          lockRef.current = true
          cancelSpeech()
          persistRef.current(true, true)
          return
        }
        setCheer(`${layer?.label ?? 'A layer'} stacked! +${gained} points.`)
        const upcoming = rest[0]
        if (upcoming) say(upcoming)
        return
      }
      streakRef.current = 0
      setStreak(0)
      if (!missedRef.current.includes(word)) {
        missedRef.current = [...missedRef.current, word]
        setMissed(missedRef.current)
      }
      queueRef.current = requeueWord(queueRef.current)
      setQueue([...queueRef.current])
      typedRef.current = ''
      setTyped('')
      setWrong(true)
      setRevealWord(word)
      setCheer(`Almost. This one is ${word}. We will try it again.`)
      cancelSpeech()
      syncPhase('reveal')
      lockRef.current = true
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [list.id])

  const word = queue[0] ?? ''
  const round1Number = Math.min(words.length, words.length - queue.length + 1)
  const next = phase === 'round1' ? nextLetter(word, index) : null
  const knownKeys = [...'abcdefghijklmnopqrstuvwxyz']
  const coach =
    phase === 'round1' && next
      ? coachLine(next)
      : phase === 'round2'
        ? 'Spell the word you heard. Backspace fixes a letter.'
        : phase === 'reveal'
          ? cheer
          : ''

  function startRound2() {
    const fresh = [...wordsRef.current]
    queueRef.current = fresh
    typedRef.current = ''
    indexRef.current = 0
    setQueue(fresh)
    setTyped('')
    setIndex(0)
    setWrong(false)
    syncPhase('round2')
    const first = fresh[0]
    if (first) say(first)
    stageRef.current?.focus()
  }

  function hearAgain() {
    const current = queueRef.current[0]
    if (current) say(current)
    stageRef.current?.focus()
  }

  function onFeed() {
    if (!sessionId) return
    const error = feedPatty(sessionId)
    setFeedNote(error)
    if (error) return
    setFed(true)
    setEating(true)
    pushToast(`Pebble munched the crabby patty. +${list.coinReward} coins.`)
  }

  const roundLabel =
    phase === 'round1'
      ? `Round 1, Find the letters · Word ${round1Number} of ${words.length}`
      : phase === 'round2' || phase === 'reveal'
        ? `Round 2, Spell it · ${queue.length} to go`
        : phase === 'bridge'
          ? 'Round 2, Spell it'
          : 'Crabby patty'

  return (
    <div className="spelling-shell" data-round={phase}>
      <div className="lesson-bar">
        <Link className="btn btn-small" to="/challenges">Back</Link>
        <h1>{list.sortLabel}</h1>
        <div className="live-stats">
          <span>Streak {streak}</span>
          <span>Points {points}</span>
          <span>Patty {Math.min(layers, goal)}/{goal}</span>
        </div>
      </div>
      <p className="round-label">{roundLabel}</p>
      {cheer && phase !== 'reveal' && phase !== 'done' ? <p className="spell-banner" role="status">{cheer}</p> : null}

      {phase === 'bridge' ? (
        <section className="spell-bridge">
          <div>
            <h2>You found every letter.</h2>
            <p>Now the words hide. I will say the word, a sentence, and the word again. Spell it from memory to stack a crabby patty.</p>
            <p>Your streak comes with you. A miss waits and comes back later.</p>
            <button type="button" className="btn btn-primary" onClick={startRound2}>Start spelling</button>
          </div>
          <CrabbyPatty count={0} goal={goal} />
        </section>
      ) : null}

      {phase === 'done' ? (
        <section className="spell-done" aria-live="polite">
          <div className="spell-banner big">
            <p className="celebrate-stars" aria-hidden="true">★ ★ ★</p>
            <h2>The crabby patty is ready!</h2>
            <p>{points} points. Best streak {bestStreak}.</p>
          </div>
          <div className="spell-done-grid">
            <CrabbyPatty count={layers} goal={goal} popKey={pop} ready />
            <div className="spell-feed">
              <Turtle
                hat={kid?.turtle.equipped.hat}
                scarf={kid?.turtle.equipped.scarf}
                mood={eating ? 'eat' : 'idle'}
                title={eating ? 'Pebble eating the crabby patty' : 'Pebble waiting for the crabby patty'}
              />
              {fed ? (
                <p>Pebble is eating. +{list.coinReward} coins, and a little hunger and happy.</p>
              ) : (
                <button type="button" className="btn btn-primary" onClick={onFeed}>Feed Pebble</button>
              )}
              {feedNote ? <p className="form-error" role="alert">{feedNote}</p> : null}
            </div>
          </div>
          {missed.length > 0 ? (
            <p className="key-list">
              Tricky words:
              {missed.map((item) => (
                <span className="keycap" key={item}>{item}</span>
              ))}
            </p>
          ) : (
            <p>No tricky words this time.</p>
          )}
          <div className="button-row">
            <button type="button" className="btn" onClick={onReplay}>Play it again</button>
            <Link className="btn" to="/challenges">Back to challenges</Link>
          </div>
        </section>
      ) : null}

      {phase === 'round1' || phase === 'round2' || phase === 'reveal' ? (
        <div className="spelling-layout">
          <div
            className="type-stage"
            ref={stageRef}
            tabIndex={0}
            role="application"
            aria-label={phase === 'round1' ? 'Find the letters. Type the glowing letter.' : 'Spell the word you heard.'}
          >
            {phase === 'round1' ? <WordLetters word={word} index={index} wrong={wrong} /> : null}
            {phase === 'round2' ? <SpellSlots length={word.length} typed={typed} /> : null}
            {phase === 'reveal' && revealWord ? <WordLetters word={revealWord} index={revealWord.length} wrong={false} /> : null}
            <p className="coach">{coach}</p>
            {phase === 'round2' && !soundOn && word ? (
              <p className="fine">{hiddenSentence(word, sentenceFor(word))}</p>
            ) : null}
            {phase === 'round2' ? (
              <div className="button-row">
                <button
                  type="button"
                  className="btn"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={hearAgain}
                >
                  Hear again
                </button>
              </div>
            ) : null}
            {phase === 'reveal' ? null : (
              <>
                <Hands active={next ? fingerFor(next) : null} />
                <Keyboard nextKey={next} wrong={wrong} knownKeys={knownKeys} newKeys={[]} />
              </>
            )}
          </div>
          <CrabbyPatty count={layers} goal={goal} popKey={pop} />
        </div>
      ) : null}
      <div className="sr-only" aria-live="polite">{coach || cheer}</div>
    </div>
  )
}

function WordLetters({ word, index, wrong }: { word: string; index: number; wrong: boolean }) {
  return (
    <p className="prompt spelling-word" aria-hidden="true">
      {[...word].map((char, charIndex) => {
        const state = charIndex < index ? 'done' : charIndex === index ? 'current' : 'upcoming'
        const finger = state === 'current' ? fingerFor(char) : null
        return (
          <span
            key={`${charIndex}-${char}`}
            className={`ch ${state} ${state === 'current' && wrong ? 'bad' : ''} ${finger ? `finger-${finger}` : ''}`}
          >
            {char}
          </span>
        )
      })}
    </p>
  )
}

function SpellSlots({ length, typed }: { length: number; typed: string }) {
  return (
    <p className="prompt spelling-word" aria-hidden="true">
      {Array.from({ length }, (_, slot) => {
        const char = typed[slot] ?? ''
        const current = slot === typed.length
        return (
          <span key={slot} className={`ch spell-slot ${char ? 'done' : ''} ${current ? 'current' : ''}`}>
            {char || '\u00a0'}
          </span>
        )
      })}
    </p>
  )
}
