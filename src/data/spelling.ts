import { SPELLING_FEED_COINS } from '../config'

/**
 * Weekly spelling list for Word bay.
 *
 * Parents: replace the words in WEEKLY_SPELLING for next week.
 * Keep the spelling and a short sentence. The game says the word,
 * then the sentence, then the word again.
 *
 * A future parent "add a challenge" flow can save the same shape.
 * One word per line, with the sentence after a bar:
 *   bacon | Dad cooked bacon for breakfast.
 * parseSpellingPrompt() turns that note into a playable list.
 * A short note with no word list stays a locked placeholder.
 */
export type SpellingWord = {
  word: string
  sentence: string
}

export type SpellingList = {
  id: string
  title: string
  sortLabel: string
  words: SpellingWord[]
  coinReward: number
}

const WORD_PATTERN = /^[a-zA-Z]{2,20}$/

export const WEEKLY_SPELLING: SpellingList = {
  id: 'sort-35',
  title: 'Sort 35',
  sortLabel: 'Sort 35',
  coinReward: SPELLING_FEED_COINS,
  words: [
    { word: 'credit', sentence: 'Mom paid with a credit card.' },
    { word: 'habit', sentence: 'Brushing your teeth is a good habit.' },
    { word: 'magnet', sentence: 'The magnet stuck to the fridge.' },
    { word: 'secret', sentence: 'The birthday plan is a secret.' },
    { word: 'pirate', sentence: 'The pirate sailed across the bay.' },
    { word: 'ballet', sentence: 'Mia has ballet class after school.' },
    { word: 'private', sentence: 'That note is private.' },
    { word: 'quiet', sentence: 'Please stay quiet at nap time.' },
    { word: 'senate', sentence: 'The senate voted on a new law.' },
    { word: 'buffet', sentence: 'We filled our plates at the buffet.' },
  ],
}

export function defaultSpellingSentence(word: string): string {
  return `The word is ${word}.`
}

export function parseSpellingPrompt(prompt: string): SpellingWord[] {
  const words: SpellingWord[] = []
  for (const rawLine of prompt.split(/\n+/)) {
    const line = rawLine.trim()
    if (!line || words.length >= 20) continue
    const pipe = line.indexOf('|')
    if (pipe === -1) {
      if (!WORD_PATTERN.test(line)) continue
      const word = line.toLowerCase()
      words.push({ word, sentence: defaultSpellingSentence(word) })
      continue
    }
    const word = line.slice(0, pipe).trim()
    const sentence = line.slice(pipe + 1).trim().replace(/\s+/g, ' ')
    if (!WORD_PATTERN.test(word)) continue
    if (sentence.length < 3 || sentence.length > 140) continue
    words.push({ word: word.toLowerCase(), sentence })
  }
  return words
}

export function spellingListFromChallenge(challenge: {
  id: string
  title: string
  prompt: string
  coinReward: number
}): SpellingList | null {
  const words = parseSpellingPrompt(challenge.prompt)
  if (words.length === 0) return null
  const title = challenge.title.trim() || 'Spelling list'
  return {
    id: challenge.id,
    title,
    sortLabel: title,
    words,
    coinReward: challenge.coinReward,
  }
}
