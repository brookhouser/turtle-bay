/* Turtle Bay service worker.

   The worker exists so Chrome can install the GitHub Pages site. It does not
   store the app. HTML and the manifest are fetched with cache: 'no-store', and
   scripts and styles use the browser's normal request, so a refresh shows the
   latest Pages build instead of an old copy.

   Cross-origin calls (Firebase, Google sign-in, fonts) are not intercepted.
   localStorage and IndexedDB are untouched.
*/

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  let url
  try {
    url = new URL(request.url)
  } catch {
    return
  }
  if (url.origin !== self.location.origin) return
  // Leave the worker script to the browser's update check.
  if (url.pathname.endsWith('/sw.js')) return

  if (isFresh(request, url)) {
    event.respondWith(fetchFresh(request))
    return
  }
  if (isCode(request, url)) {
    event.respondWith(fetch(request))
  }
})

function isFresh(request, url) {
  const path = url.pathname
  return (
    request.mode === 'navigate' ||
    request.destination === 'document' ||
    request.destination === 'manifest' ||
    path.endsWith('.html') ||
    path.endsWith('.json') ||
    path.endsWith('.webmanifest') ||
    path.endsWith('/')
  )
}

function isCode(request, url) {
  const path = url.pathname
  return (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'worker' ||
    path.endsWith('.js') ||
    path.endsWith('.mjs') ||
    path.endsWith('.css')
  )
}

async function fetchFresh(request) {
  const headers = new Headers()
  const accept = request.headers.get('Accept')
  if (accept) headers.set('Accept', accept)
  try {
    return await fetch(request.url, {
      cache: 'no-store',
      credentials: 'same-origin',
      redirect: 'follow',
      headers,
    })
  } catch {
    return fetch(request)
  }
}
