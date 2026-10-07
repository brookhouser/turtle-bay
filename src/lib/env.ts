const DEFAULT_ALLOWLIST = ['brookhouser@gmail.com', 'bbrookhouser@gmail.com']

export function getAllowlist(): string[] {
  const raw = import.meta.env.VITE_PARENT_ALLOWLIST
  if (!raw?.trim()) return DEFAULT_ALLOWLIST
  const list = raw
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
  return list.length > 0 ? list : DEFAULT_ALLOWLIST
}

export function getFamilyId(): string {
  const raw = import.meta.env.VITE_FAMILY_ID?.trim()
  return raw || 'turtlebay'
}

export function firebaseMode(): boolean {
  if (import.meta.env.VITE_FORCE_DEMO === 'true') return false
  const values = [
    import.meta.env.VITE_FIREBASE_API_KEY,
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    import.meta.env.VITE_FIREBASE_PROJECT_ID,
    import.meta.env.VITE_FIREBASE_APP_ID,
  ]
  return values.every((value) => {
    if (!value) return false
    const text = value.trim().toLowerCase()
    if (!text) return false
    return !['your-', 'replace', 'changeme', 'xxx', 'placeholder'].some((bit) => text.includes(bit))
  })
}

export function getFirebaseConfig() {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
  }
}
