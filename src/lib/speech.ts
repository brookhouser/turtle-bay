import { SPELLING_SPEAK_RATE } from '../config'

let speakToken = 0

export function speechAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
}

export function prepareVoices(): void {
  if (!speechAvailable()) return
  window.speechSynthesis.getVoices()
}

function pickVoice(synth: SpeechSynthesis): SpeechSynthesisVoice | null {
  const voices = synth.getVoices()
  return (
    voices.find((voice) => voice.lang === 'en-US') ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith('en-us')) ??
    null
  )
}

export function cancelSpeech(): void {
  speakToken += 1
  if (!speechAvailable()) return
  window.speechSynthesis.cancel()
}

/**
 * Spellings an en-US voice reads as the wrong word.
 * buffet's first reading is "BUFF-it"; this meal is "buh-FAY" (bufay).
 * ballet is already "ba-LAY" and senate is already "SEN-it", so they stay as spelled.
 */
const SAY_AS: Record<string, string> = {
  buffet: 'bufay',
}

/** What round 2 should say for this spelling. The screen still shows the real word. */
export function spokenWord(word: string): string {
  return SAY_AS[word.trim().toLowerCase()] ?? word
}

/** Same sentence, with a swapped spelling said the way the word should sound. */
export function spokenSentence(word: string, sentence: string): string {
  const said = spokenWord(word)
  if (said.toLowerCase() === word.trim().toLowerCase()) return sentence
  const escaped = word.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return sentence.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), said)
}

/** Word, sentence, word. This is the round 2 script. */
export function spellingSpeechLines(word: string, sentence: string): [string, string, string] {
  const said = spokenWord(word)
  return [said, spokenSentence(word, sentence), said]
}

/** Say the word, a short sentence, then the word again. en-US, a little slow. */
export function speakSpelling(word: string, sentence: string): void {
  if (!speechAvailable()) return
  const synth = window.speechSynthesis
  const token = ++speakToken
  synth.cancel()
  const lines = spellingSpeechLines(word, sentence)
  window.setTimeout(() => {
    if (token !== speakToken) return
    if (synth.paused) synth.resume()
    const voice = pickVoice(synth)
    for (const text of lines) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      utterance.rate = SPELLING_SPEAK_RATE
      if (voice) utterance.voice = voice
      synth.speak(utterance)
    }
  }, 60)
}

/** Hide the target word if the sentence has to be shown because sound is off. */
export function hiddenSentence(word: string, sentence: string): string {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return sentence.replace(new RegExp(escaped, 'ig'), '_____')
}
