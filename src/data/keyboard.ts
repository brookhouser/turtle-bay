export type FingerId =
  | 'l-pinky'
  | 'l-ring'
  | 'l-middle'
  | 'l-index'
  | 'r-index'
  | 'r-middle'
  | 'r-ring'
  | 'r-pinky'
  | 'thumb'

export type KeyCap = {
  code: string
  label: string
  grow?: number
  finger?: FingerId
  home?: boolean
  bump?: boolean
}

type FingerInfo = {
  id: FingerId
  hand: string
  finger: string
  home: string
}

export const FINGER_INFO: Record<FingerId, FingerInfo> = {
  'l-pinky': { id: 'l-pinky', hand: 'Left', finger: 'pinky', home: 'A' },
  'l-ring': { id: 'l-ring', hand: 'Left', finger: 'ring', home: 'S' },
  'l-middle': { id: 'l-middle', hand: 'Left', finger: 'middle', home: 'D' },
  'l-index': { id: 'l-index', hand: 'Left', finger: 'index', home: 'F' },
  'r-index': { id: 'r-index', hand: 'Right', finger: 'index', home: 'J' },
  'r-middle': { id: 'r-middle', hand: 'Right', finger: 'middle', home: 'K' },
  'r-ring': { id: 'r-ring', hand: 'Right', finger: 'ring', home: 'L' },
  'r-pinky': { id: 'r-pinky', hand: 'Right', finger: 'pinky', home: ';' },
  thumb: { id: 'thumb', hand: 'Either', finger: 'thumb', home: 'space' },
}

const fingerByKey: Record<string, FingerId> = {
  '`': 'l-pinky',
  '1': 'l-pinky',
  q: 'l-pinky',
  a: 'l-pinky',
  z: 'l-pinky',
  tab: 'l-pinky',
  capslock: 'l-pinky',
  '2': 'l-ring',
  w: 'l-ring',
  s: 'l-ring',
  x: 'l-ring',
  '3': 'l-middle',
  e: 'l-middle',
  d: 'l-middle',
  c: 'l-middle',
  '4': 'l-index',
  '5': 'l-index',
  r: 'l-index',
  t: 'l-index',
  f: 'l-index',
  g: 'l-index',
  v: 'l-index',
  b: 'l-index',
  '6': 'r-index',
  '7': 'r-index',
  y: 'r-index',
  u: 'r-index',
  h: 'r-index',
  j: 'r-index',
  n: 'r-index',
  m: 'r-index',
  '8': 'r-middle',
  i: 'r-middle',
  k: 'r-middle',
  ',': 'r-middle',
  '9': 'r-ring',
  o: 'r-ring',
  l: 'r-ring',
  '.': 'r-ring',
  '0': 'r-pinky',
  '-': 'r-pinky',
  '=': 'r-pinky',
  p: 'r-pinky',
  '[': 'r-pinky',
  ']': 'r-pinky',
  ';': 'r-pinky',
  "'": 'r-pinky',
  '/': 'r-pinky',
  ' ': 'thumb',
}

export function fingerFor(key: string): FingerId | null {
  return fingerByKey[key.toLowerCase()] ?? null
}

export function prettyKey(key: string): string {
  if (key === ' ') return 'Space'
  if (key === ';') return ';'
  if (key.length === 1) return key.toUpperCase()
  return key
}

export function coachLine(key: string): string {
  if (key === ' ') {
    return 'Either thumb presses the space bar. Other fingers stay on the home row.'
  }
  if (key === ';') {
    return 'Right pinky finger. It rests on the semicolon key. Press ;.'
  }
  const fingerId = fingerFor(key)
  if (!fingerId) return `Press ${prettyKey(key)}.`
  const info = FINGER_INFO[fingerId]
  const pretty = prettyKey(key)
  const who = `${info.hand} ${info.finger}`
  if (pretty.toLowerCase() === info.home.toLowerCase()) {
    return `${who} finger. It rests on ${info.home}. Press ${info.home}.`
  }
  return `${who} finger. Reach from ${info.home} to ${pretty}.`
}

export const KEYBOARD_ROWS: KeyCap[][] = [
  [
    { code: '`', label: '`', finger: 'l-pinky' },
    { code: '1', label: '1', finger: 'l-pinky' },
    { code: '2', label: '2', finger: 'l-ring' },
    { code: '3', label: '3', finger: 'l-middle' },
    { code: '4', label: '4', finger: 'l-index' },
    { code: '5', label: '5', finger: 'l-index' },
    { code: '6', label: '6', finger: 'r-index' },
    { code: '7', label: '7', finger: 'r-index' },
    { code: '8', label: '8', finger: 'r-middle' },
    { code: '9', label: '9', finger: 'r-ring' },
    { code: '0', label: '0', finger: 'r-pinky' },
    { code: '-', label: '-', finger: 'r-pinky' },
    { code: '=', label: '=', finger: 'r-pinky' },
  ],
  [
    { code: 'Tab', label: 'tab', grow: 1.6, finger: 'l-pinky' },
    { code: 'q', label: 'Q', finger: 'l-pinky' },
    { code: 'w', label: 'W', finger: 'l-ring' },
    { code: 'e', label: 'E', finger: 'l-middle' },
    { code: 'r', label: 'R', finger: 'l-index' },
    { code: 't', label: 'T', finger: 'l-index' },
    { code: 'y', label: 'Y', finger: 'r-index' },
    { code: 'u', label: 'U', finger: 'r-index' },
    { code: 'i', label: 'I', finger: 'r-middle' },
    { code: 'o', label: 'O', finger: 'r-ring' },
    { code: 'p', label: 'P', finger: 'r-pinky' },
    { code: '[', label: '[', finger: 'r-pinky' },
    { code: ']', label: ']', finger: 'r-pinky' },
  ],
  [
    { code: 'CapsLock', label: 'caps', grow: 1.8, finger: 'l-pinky' },
    { code: 'a', label: 'A', finger: 'l-pinky', home: true },
    { code: 's', label: 'S', finger: 'l-ring', home: true },
    { code: 'd', label: 'D', finger: 'l-middle', home: true },
    { code: 'f', label: 'F', finger: 'l-index', home: true, bump: true },
    { code: 'g', label: 'G', finger: 'l-index' },
    { code: 'h', label: 'H', finger: 'r-index' },
    { code: 'j', label: 'J', finger: 'r-index', home: true, bump: true },
    { code: 'k', label: 'K', finger: 'r-middle', home: true },
    { code: 'l', label: 'L', finger: 'r-ring', home: true },
    { code: ';', label: ';', finger: 'r-pinky', home: true },
    { code: "'", label: "'", finger: 'r-pinky' },
    { code: 'Enter', label: 'enter', grow: 1.7, finger: 'r-pinky' },
  ],
  [
    { code: 'Shift', label: 'shift', grow: 2.3, finger: 'l-pinky' },
    { code: 'z', label: 'Z', finger: 'l-pinky' },
    { code: 'x', label: 'X', finger: 'l-ring' },
    { code: 'c', label: 'C', finger: 'l-middle' },
    { code: 'v', label: 'V', finger: 'l-index' },
    { code: 'b', label: 'B', finger: 'l-index' },
    { code: 'n', label: 'N', finger: 'r-index' },
    { code: 'm', label: 'M', finger: 'r-index' },
    { code: ',', label: ',', finger: 'r-middle' },
    { code: '.', label: '.', finger: 'r-ring' },
    { code: '/', label: '/', finger: 'r-pinky' },
    { code: 'ShiftRight', label: 'shift', grow: 2.3, finger: 'r-pinky' },
  ],
  [{ code: ' ', label: 'space', grow: 8, finger: 'thumb' }],
]

export const FINGER_LEGEND: { id: FingerId; label: string }[] = [
  { id: 'l-pinky', label: 'Pinky' },
  { id: 'l-ring', label: 'Ring' },
  { id: 'l-middle', label: 'Middle' },
  { id: 'l-index', label: 'Index' },
  { id: 'thumb', label: 'Thumb' },
]
