declare const api: {
  gradeTyped: (
    countries: Array<{
      id: string
      name: string
      quiz?: boolean
      aliases?: string[]
      shortName?: string
      rejectAlone?: string[]
      partialHint?: string
      partsNote?: string
      confusableWith?: string[]
      confusableHint?: string
    }>,
    correctId: string,
    input: string,
  ) => { ok: boolean; reason?: string; hint?: string; match?: string }
}

export default api
