import { gearId } from '../data/accessories'
import { useBay } from '../context/useBay'
import { PEBBLE_ABILITIES, pebbleRunnerConfig, startingHearts } from '../runner/pebbleRunner'
import { pebbleUnits } from '../study/pebbleUnits'
import { RunnerScreen } from './RunnerScreen'

export function PebbleRunPage() {
  const { kid, session, bankShells } = useBay()
  if (!kid || kid.motivation !== 'turtle') return null
  const school = session?.role === 'kid' && session.scope === 'school'
  const hat = kid.turtle.equipped.hat ? gearId(kid.turtle.equipped.hat) : null
  const scarf = kid.turtle.equipped.scarf ? gearId(kid.turtle.equipped.scarf) : null
  return (
    <RunnerScreen
      title="Pebble Run"
      lede={school
        ? 'Academic run for spelling, math, and typing. Tap or hold to jump. Family chores stay off this sign-in.'
        : 'Pebble runs the beach, the reef, and the volcano. Shells you grab become snacks at home. Tap or hold to jump.'}
      config={pebbleRunnerConfig({
        hearts: startingHearts(kid.turtle.hunger, kid.turtle.happy),
        hat,
        scarf,
      })}
      units={pebbleUnits()}
      abilities={PEBBLE_ABILITIES}
      seenKey="pebble-seen-abilities"
      onShell={() => bankShells(1)}
    />
  )
}
