/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const manifest = JSON.parse(readFileSync('public/manifest.json', 'utf8'))
const worker = readFileSync('public/sw.js', 'utf8')
const sourceHtml = readFileSync('index.html', 'utf8')
const pagesHtml = readFileSync('docs/index.html', 'utf8')

function pngSize(path: string) {
  const bytes = readFileSync(path)
  expect(bytes.subarray(1, 4).toString('ascii')).toBe('PNG')
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
}

describe('installable web app', () => {
  it('names Turtle Bay and scopes the GitHub Pages subpath', () => {
    expect(manifest.name).toBe('Turtle Bay')
    expect(manifest.short_name).toBe('Turtle Bay')
    expect(manifest.start_url).toBe('/turtle-bay/')
    expect(manifest.scope).toBe('/turtle-bay/')
    expect(manifest.id).toBe('/turtle-bay/')
    expect(manifest.display).toBe('standalone')
    expect(manifest.display_override[0]).toBe('standalone')
    expect(manifest.display_override).toContain('fullscreen')
    expect(manifest.theme_color).toBe('#8fd0c6')
    expect(manifest.background_color).toBe('#e7f6f2')
  })

  it('ships square 192, 512, maskable, and apple touch icons', () => {
    const icons = manifest.icons as { src: string; sizes: string; purpose: string }[]
    expect(icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sizes: '192x192', purpose: 'any' }),
        expect.objectContaining({ sizes: '512x512', purpose: 'any' }),
        expect.objectContaining({ sizes: '192x192', purpose: 'maskable' }),
        expect.objectContaining({ sizes: '512x512', purpose: 'maskable' }),
      ]),
    )
    for (const icon of icons) {
      expect(icon.src.startsWith('/turtle-bay/icons/')).toBe(true)
      const file = icon.src.replace('/turtle-bay/', 'public/')
      const [width, height] = icon.sizes.split('x').map(Number)
      expect(pngSize(file)).toEqual({ width, height })
      expect(pngSize(`docs/${icon.src.replace('/turtle-bay/', '')}`)).toEqual({ width, height })
    }
    expect(pngSize('public/icons/apple-touch-icon.png')).toEqual({ width: 180, height: 180 })
    expect(pngSize('docs/icons/apple-touch-icon.png')).toEqual({ width: 180, height: 180 })
  })

  it('links the manifest from the source page and the Pages build', () => {
    for (const html of [sourceHtml, pagesHtml]) {
      expect(html).toContain('rel="manifest"')
      expect(html).toContain('rel="apple-touch-icon"')
      expect(html).toContain('apple-mobile-web-app-title')
      expect(html).toContain('navigator.serviceWorker')
      expect(html).toContain(".register(base + 'sw.js'")
    }
    expect(sourceHtml).toContain('%BASE_URL%manifest.json')
    expect(pagesHtml).toContain('href="/turtle-bay/manifest.json"')
    expect(pagesHtml).toContain("base + 'sw.js'")
    expect(readFileSync('docs/manifest.json', 'utf8')).toBe(readFileSync('public/manifest.json', 'utf8'))
    expect(readFileSync('docs/sw.js', 'utf8')).toBe(readFileSync('public/sw.js', 'utf8'))
  })

  it('does not cache-trap HTML or scripts and leaves other sites alone', () => {
    expect(worker).toContain("addEventListener('fetch'")
    expect(worker).toContain("url.origin !== self.location.origin")
    expect(worker).toContain("request.method !== 'GET'")
    expect(worker).toContain("cache: 'no-store'")
    expect(worker).not.toContain('caches.put')
    expect(worker).not.toContain('caches.add')
    expect(worker).not.toContain('caches.match')
    expect(worker).toContain('caches.delete')
  })
})
