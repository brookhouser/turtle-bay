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
  id: 'sort-34',
  title: 'Sort 34',
  sortLabel: 'Sort 34',
  coinReward: SPELLING_FEED_COINS,
  words: [
    { word: 'bargain', sentence: 'The hat was a bargain at the shop.' },
    { word: 'pardon', sentence: 'Pardon me, I bumped your chair.' },
    { word: 'bacon', sentence: 'Crispy bacon smells like breakfast.' },
    { word: 'chosen', sentence: 'She was chosen to be line leader.' },
    { word: 'heaven', sentence: 'The clouds looked like heaven.' },
    { word: 'slogan', sentence: 'The class made a slogan for the book fair.' },
    { word: 'organ', sentence: 'Your heart is an organ.' },
    { word: 'mission', sentence: 'Our mission is to keep the bay clean.' },
    { word: 'children', sentence: 'The children played tag at recess.' },
    { word: 'fountain', sentence: 'Water jumped from the fountain.' },
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
