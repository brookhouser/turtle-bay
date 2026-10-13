import { Link } from 'react-router-dom'
import { PASS_ACCURACY } from '../config'
import { useBay } from '../context/useBay'
import { LESSONS } from '../data/curriculum'
import { prettyKey } from '../data/keyboard'
import { spellingListFromChallenge, WEEKLY_SPELLING } from '../data/spelling'
import { LockIcon } from '../components/Icons'

export function ChallengesPage() {
  const { kid } = useBay()
  if (!kid) return null
  const typingCustom = kid.customChallenges.filter((challenge) => challenge.type === 'typing')
  const spellingCustom = kid.customChallenges.flatMap((challenge) => {
    if (challenge.type !== 'spelling') return []
    const list = spellingListFromChallenge(challenge)
    return list ? [{ challenge, list }] : []
  })
  const later = kid.customChallenges.filter((challenge) => {
    if (challenge.type === 'typing') return false
    if (challenge.type === 'spelling' && spellingListFromChallenge(challenge)) return false
    return true
  })

  return (
    <div className="stack-page">
      <header className="page-head">
        <h1>Challenges</h1>
        <p>Typing lessons fill the coin jar. Accuracy of {PASS_ACCURACY}% opens the next lesson.</p>
      </header>
      <div className="lesson-grid">
        {LESSONS.map((lesson, index) => {
          const progress = kid.lessons[lesson.id]
          const locked = !progress?.unlocked
          const previous = LESSONS[index - 1]
          return (
            <article key={lesson.id} className={`lesson-card ${locked ? 'is-locked' : ''}`}>
              <p className="eyebrow">Lesson {lesson.order}</p>
              <h2>{lesson.title}</h2>
              <p>{lesson.subtitle}</p>
              {lesson.newKeys.length > 0 ? (
                <p className="key-list">
                  {lesson.newKeys.map((key) => (
                    <span className="keycap" key={key}>{prettyKey(key)}</span>
                  ))}
                </p>
              ) : (
                <p className="fine">Practice the keys you already know.</p>
              )}
              {progress?.completions ? (
                <p className="fine">Best {progress.bestWpm} WPM, {progress.bestAccuracy}% accuracy</p>
              ) : null}
              {progress?.mastered ? <p className="badge">Mastered</p> : null}
              {locked ? (
                <p className="lock-line">
                  <LockIcon /> Finish {previous?.title ?? 'the earlier lesson'} at {PASS_ACCURACY}% accuracy.
                </p>
              ) : (
                <div className="button-row">
                  <Link className="btn btn-primary" to={`/lesson/${lesson.id}`}>{progress?.completions ? 'Practice again' : 'Play'}</Link>
                  {progress && progress.lastMissedKeys.length > 0 ? (
                    <Link className="btn" to={`/lesson/${lesson.id}?rematch=1`}>Tricky keys</Link>
                  ) : null}
                </div>
              )}
            </article>
          )
        })}
        <article className="lesson-card">
          <p className="eyebrow">Spelling</p>
          <h2>Word bay</h2>
          <p>{WEEKLY_SPELLING.sortLabel}. Find the letters, then spell them to stack a crabby patty.</p>
          <p className="fine">{WEEKLY_SPELLING.words.length} words</p>
          <Link className="btn btn-primary" to="/spelling">Play</Link>
        </article>
        <article className="lesson-card is-locked">
          <p className="eyebrow">Math</p>
          <h2>Number bay</h2>
          <p>Number drills will land here later.</p>
          <p className="lock-line"><LockIcon /> Locked</p>
        </article>
      </div>

      {typingCustom.length > 0 || spellingCustom.length > 0 ? (
        <section>
          <h2>From the parent dock</h2>
          <div className="lesson-grid">
            {typingCustom.map((challenge) => (
              <article key={challenge.id} className="lesson-card">
                <p className="eyebrow">Extra typing</p>
                <h2>{challenge.title}</h2>
                <p className="fine">{challenge.coinReward} coins</p>
                <Link className="btn btn-primary" to={`/custom/${challenge.id}`}>Play</Link>
              </article>
            ))}
            {spellingCustom.map(({ challenge, list }) => (
              <article key={challenge.id} className="lesson-card">
                <p className="eyebrow">Spelling</p>
                <h2>{challenge.title}</h2>
                <p className="fine">{list.words.length} words · {challenge.coinReward} coins</p>
                <Link className="btn btn-primary" to={`/spelling/${challenge.id}`}>Play</Link>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {later.length > 0 ? (
        <section>
          <h2>Saved for later</h2>
          <div className="lesson-grid">
            {later.map((challenge) => (
              <article key={challenge.id} className="lesson-card is-locked">
                <p className="eyebrow">{challenge.type === 'math' ? 'Math' : 'Spelling'}</p>
                <h2>{challenge.title}</h2>
                <p className="lock-line">
                  <LockIcon />{' '}
                  {challenge.type === 'spelling'
                    ? 'Add one word per line, with a sentence after a bar, to play it.'
                    : 'Stored. The player for this is not built yet.'}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
