import { useBay } from '../context/useBay'
import { RUNNER_ABILITIES, runnerUnits } from '../runner/abilities'
import { samRunnerConfig } from '../runner/samRunner'
import { hubUnits } from '../study/hub'
import { RunnerScreen } from './RunnerScreen'

export function RunnerPage() {
  const { kid } = useBay()
  if (!kid || kid.motivation !== 'fighter') return null
  return (
    <RunnerScreen
      title="Runner"
      lede="Dojo Ace runs. Tap or hold to jump. Mastery from vocab and the map quiz opens the tricks."
      config={samRunnerConfig()}
      units={runnerUnits(hubUnits())}
      abilities={RUNNER_ABILITIES}
      seenKey="runner-seen-abilities"
    />
  )
}
