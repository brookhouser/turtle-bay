import type { Lesson } from '../types'

export const LESSONS: Lesson[] = [
  {
    id: 'hr-1',
    order: 1,
    title: 'Left anchors',
    subtitle: 'Park the left hand on A S D F.',
    newKeys: ['a', 's', 'd', 'f'],
    prompt: 'asdf asdf fad sad dad asdf a sad fad',
    coinReward: 20,
  },
  {
    id: 'hr-2',
    order: 2,
    title: 'Right anchors',
    subtitle: 'Park the right hand on J K L and semicolon.',
    newKeys: ['j', 'k', 'l', ';'],
    prompt: 'jkl; jkl; jak lad all jak a fall;',
    coinReward: 22,
  },
  {
    id: 'hr-3',
    order: 3,
    title: 'Home row together',
    subtitle: 'Both hands stay on the home row.',
    newKeys: [],
    prompt: 'asdf jkl; a salad; a flask; ask dad all fall',
    coinReward: 25,
  },
  {
    id: 'hr-4',
    order: 4,
    title: 'Home row words',
    subtitle: 'Real words, still on the home row.',
    newKeys: [],
    prompt: 'a fall salad; a sad lad; dad asks all flasks; a lass asks',
    coinReward: 28,
  },
  {
    id: 'hr-5',
    order: 5,
    title: 'Home row flow',
    subtitle: 'Keep a steady rhythm. Accuracy matters more than speed.',
    newKeys: [],
    prompt: 'dad asks a lad; a salad falls; ask all a flask; a sad lass falls',
    coinReward: 32,
  },
  {
    id: 'hr-6',
    order: 6,
    title: 'Index buddies',
    subtitle: 'Index fingers reach in to G and H.',
    newKeys: ['g', 'h'],
    prompt: 'a glad lad had a flag; hash a hall; a glass flask; dad had salad',
    coinReward: 36,
  },
  {
    id: 'hr-7',
    order: 7,
    title: 'Reach for E and I',
    subtitle: 'Middle fingers reach up. Left from D, right from K.',
    newKeys: ['e', 'i'],
    prompt: 'she sees a leaf; i like a lake; a high hill; i feel glad; slide a desk',
    coinReward: 40,
  },
  {
    id: 'hr-8',
    order: 8,
    title: 'Reach for R and U',
    subtitle: 'Index fingers reach up. Left from F, right from J.',
    newKeys: ['r', 'u'],
    prompt: 'a real lake; she hears a lark; a sure rule; i feel full; sail a real sea',
    coinReward: 46,
  },
]

export function lessonById(id: string): Lesson | undefined {
  return LESSONS.find((lesson) => lesson.id === id)
}

export function keysThrough(order: number): string[] {
  const keys = new Set<string>([' '])
  for (const lesson of LESSONS) {
    if (lesson.order <= order) {
      for (const key of lesson.newKeys) keys.add(key)
    }
  }
  return [...keys]
}

export function nextLesson(id: string): Lesson | undefined {
  const index = LESSONS.findIndex((lesson) => lesson.id === id)
  if (index < 0) return undefined
  return LESSONS[index + 1]
}
