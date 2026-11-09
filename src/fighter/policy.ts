export type Quote = {
  credits: number
  label: string
}

export type SafetyResult = {
  ok: boolean
  reason: string
}

const BLOCKS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\b(nude|naked|sex|sexy|porn|erotic|boob|breast|lingerie)\b/i, reason: 'That request is not for this site.' },
  { pattern: /\b(blood|gore|gory|kill|murder|stab|gun|rifle|pistol|shoot)\b/i, reason: 'Keep it free of blood, weapons, and hurting people.' },
  { pattern: /\b(drug|cocaine|weed|alcohol|drunk|beer)\b/i, reason: 'Skip drugs and alcohol.' },
  { pattern: /\b(scary|horror|demon|zombie|corpse)\b/i, reason: 'Keep the character friendly, not scary.' },
  { pattern: /\b(fortnite|epic games|peely|renegade raider|travis scott|icon series)\b/i, reason: 'No Fortnite names, skins, or emotes. Describe the change in your own words.' },
  { pattern: /\b(nazi|slur|hate)\b/i, reason: 'That request is not allowed.' },
]

export function quoteEdit(prompt: string): Quote {
  const text = prompt.toLowerCase()
  if (/(outfit|costume|suit|jacket|uniform|restyle|hair|face|whole look)/.test(text)) {
    return { credits: 40, label: 'Outfit change' }
  }
  if (/(color|belt|hood|wrap|shoe|glove|stripe|visor)/.test(text)) {
    return { credits: 25, label: 'Gear change' }
  }
  return { credits: 20, label: 'Small change' }
}

export function reviewPrompt(prompt: string): SafetyResult {
  const text = prompt.trim()
  if (text.length < 3) return { ok: false, reason: 'Say what should change.' }
  if (text.length > 400) return { ok: false, reason: 'Keep the request under 400 characters.' }
  for (const block of BLOCKS) {
    if (block.pattern.test(text)) return { ok: false, reason: block.reason }
  }
  return { ok: true, reason: '' }
}

export const GEMINI_NOT_READY = 'Character editing is not set up yet. A parent still needs to add the Gemini key and deploy the cloud function.'

export const ESTIMATED_USD_PER_EDIT = 0.04
