export const SAM_FIGHTER_ID = 'dojo-ace' as const

export type PoseId = 'ready' | 'run' | 'jump' | 'dash' | 'spin-kick' | 'retreat'

export type PoseStatus = 'reference' | 'from-sheet' | 'needed'

export type PoseArt = {
  id: PoseId | string
  label: string
  file: string | null
  status: PoseStatus
  usedBy: string
}

// Kevin locked this sheet on Nov 6: white gi, orange trim, orange belt.
// New poses are generated from public/fighters/dojo-ace/reference.jpg.
export const DOJO_ACE_POSES: PoseArt[] = [
  {
    id: 'ready',
    label: 'Ready stance',
    file: 'fighters/dojo-ace/reference.jpg',
    status: 'reference',
    usedBy: 'Dojo, tower defense idle, and the locked reference for every later pose',
  },
  {
    id: 'run',
    label: 'Run',
    file: 'fighters/dojo-ace/run.jpg',
    status: 'from-sheet',
    usedBy: 'Platform runner, on the ground',
  },
  {
    id: 'jump',
    label: 'Jump',
    file: 'fighters/dojo-ace/jump.jpg',
    status: 'from-sheet',
    usedBy: 'Platform runner, in the air',
  },
  {
    id: 'dash',
    label: 'Dash',
    file: 'fighters/dojo-ace/dash.jpg',
    status: 'from-sheet',
    usedBy: 'Platform runner, slipping through spikes',
  },
  {
    id: 'spin-kick',
    label: 'Spin kick',
    file: 'fighters/dojo-ace/spin-kick.jpg',
    status: 'from-sheet',
    usedBy: 'Tower defense special',
  },
  {
    id: 'retreat',
    label: 'Catch breath',
    file: 'fighters/dojo-ace/retreat.jpg',
    status: 'from-sheet',
    usedBy: 'Tower defense, the few seconds back at the dojo',
  },
  { id: 'palm-burst', label: 'Palm burst', file: null, status: 'needed', usedBy: 'Second skill slot' },
  { id: 'team-up', label: 'Tower team-up', file: null, status: 'needed', usedBy: 'Team-up combo' },
  { id: 'super', label: 'Super', file: null, status: 'needed', usedBy: 'Hard-mode super' },
  { id: 'duel', label: 'Duel guard', file: null, status: 'needed', usedBy: 'Boss duel' },
  { id: 'slide', label: 'Runner slide', file: null, status: 'needed', usedBy: 'Platform runner' },
  { id: 'dance', label: 'Victory dances', file: null, status: 'needed', usedBy: 'Cosmetic emotes' },
  { id: 'skins', label: 'Skins and belt colors', file: null, status: 'needed', usedBy: 'Cosmetic credit shop, each one against this sheet' },
]

export function poseArt(id: PoseId): PoseArt {
  return DOJO_ACE_POSES.find((pose) => pose.id === id) ?? DOJO_ACE_POSES[0]
}

export function poseSrc(id: PoseId): string {
  const file = poseArt(id).file ?? poseArt('ready').file
  return `${import.meta.env.BASE_URL}${file}`
}
