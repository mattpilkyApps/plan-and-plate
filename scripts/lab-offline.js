import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export function labOfflineShell() {
  let directory
  return {
    name: 'isolated-lab-offline-shell',
    apply: 'build',
    configResolved(config) {
      directory = join(config.root, config.build.outDir)
    },
    closeBundle() {
      const list = (path = '') =>
        readdirSync(join(directory, path), { withFileTypes: true }).flatMap(
          (entry) =>
            entry.isDirectory()
              ? list(join(path, entry.name))
              : [join(path, entry.name)],
        )
      const files = list()
        .filter((file) => file !== 'sw.js')
        .map((file) => '/' + file)
      const hash = createHash('sha256')
      files.forEach((file) => hash.update(readFileSync(join(directory, file))))
      const cache = `plan-and-plate-lab-${hash.digest('hex').slice(0, 12)}`
      writeFileSync(
        join(directory, 'sw.js'),
        `const CACHE=${JSON.stringify(cache)};const ASSETS=${JSON.stringify(files)};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('plan-and-plate-lab-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin)return;if(event.request.mode==='navigate'){event.respondWith(fetch(event.request).catch(()=>caches.match('/index.html')));return;}if(ASSETS.includes(url.pathname))event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));});`,
      )
    },
  }
}
