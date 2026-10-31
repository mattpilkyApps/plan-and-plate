import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// Vite plugin: cache the exact built shell and lazy chunks, with no runtime library.
export function offlineShell() {
  return {
    name: 'plan-and-plate-offline-shell',
    apply: 'build',
    closeBundle() {
      const directory = 'dist'
      function list(path = '') {
        return readdirSync(join(directory, path), {
          withFileTypes: true,
        }).flatMap((entry) => {
          const relative = [path, entry.name].filter(Boolean).join('/')
          return entry.isDirectory() ? list(relative) : [relative]
        })
      }
      const files = list().filter(
        (file) =>
          /\.(?:html|css|js|svg|png|jpg|webp|webmanifest)$/.test(file) &&
          !file.startsWith('__'),
      )
      const digest = createHash('sha256')
      files.forEach((file) =>
        digest.update(file).update(readFileSync(join(directory, file))),
      )
      const name = `plan-and-plate-${digest.digest('hex').slice(0, 12)}`
      const source = `const CACHE = ${JSON.stringify(name)};
const ASSETS = ${JSON.stringify(files.map((file) => '/' + file))};
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('plan-and-plate-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (event.request.mode === 'navigate' && (/^\\/(planner|recipes|shopping)(\\/|$)/.test(url.pathname) || url.pathname === '/')) {
    event.respondWith(fetch(event.request).catch(() => caches.match('/index.html')));
    return;
  }
  if (ASSETS.includes(url.pathname)) event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
`
      writeFileSync(join(directory, 'sw.js'), source)
    },
  }
}
