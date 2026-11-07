const REJECTED = ['fill_in', 'placeholder', 'changeme', 'example.com', 'example.org', 'your-email', 'email@']

export function emailKey(email: string): string {
  return email.trim().toLowerCase().replaceAll('@', '_at_').replaceAll('.', '_')
}

// A blank or placeholder address never becomes a login. Real invites only.
export function cleanEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase()
  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email)) return null
  if (REJECTED.some((bit) => email.includes(bit))) return null
  return email
}

export function slugPart(raw: string): string {
  const slug = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24)
  return slug || 'family'
}
