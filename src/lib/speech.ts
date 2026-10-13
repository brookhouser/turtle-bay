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

/** Say the word, a short sentence, then the word again. en-US, a little slow. */
export function speakSpelling(word: string, sentence: string): void {
  if (!speechAvailable()) return
  const synth = window.speechSynthesis
  const token = ++speakToken
  synth.cancel()
  window.setTimeout(() => {
    if (token !== speakToken) return
    if (synth.paused) synth.resume()
    const voice = pickVoice(synth)
    for (const text of [word, sentence, word]) {
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
