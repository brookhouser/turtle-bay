export async function hashPin(nickname: string, pin: string): Promise<string> {
  const data = new TextEncoder().encode(`turtlebay.v1|${nickname.trim().toLowerCase()}|${pin}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}
