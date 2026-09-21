import { cp, mkdir, lstat, realpath, access, readdir, rm, rmdir, readFile } from 'node:fs/promises'
import { resolve, dirname, sep } from 'node:path'
import 'dotenv/config'

const source = resolve('.output/public')
const target = resolve(process.env.DEPLOY_TARGET || '/volume1/web/Projects/TimeForge')
const allowedRoot = '/volume1/web'
const backupRoot = '/volume1/git-server/deploy-backups/timeforge'
if (!target.startsWith(allowedRoot + sep) || target === allowedRoot) throw new Error('DEPLOY_TARGET must be an application directory below /volume1/web')
await access(resolve(source, 'index.html'))
// Existing ancestors must stay beneath the Web Station root, including symlinks.
let ancestor = target
while (true) {
  try { await lstat(ancestor); break } catch (error) {
    if (error.code !== 'ENOENT') throw error
    ancestor = dirname(ancestor)
  }
}
const actual = await realpath(ancestor)
if (actual !== allowedRoot && !actual.startsWith(allowedRoot + sep)) throw new Error('Deployment ancestor escapes Web Station root')
const backup = resolve(backupRoot, new Date().toISOString().replace(/[:.]/g, '-'))
console.log(JSON.stringify({ source, target, backup, apply: process.argv.includes('--apply'), policy: 'Back up existing app, overwrite generated files, never delete unrelated files' }, null, 2))
async function rejectSymlinks(path) {
  const entry = await lstat(path)
  if (entry.isSymbolicLink()) throw new Error(`Refusing to deploy over symlink: ${path}`)
  if (entry.isDirectory()) {
    for (const name of await readdir(path)) await rejectSymlinks(resolve(path, name))
  }
}
if (process.argv.includes('--apply')) {
  const installed = await readFile('/usr/local/etc/nginx/conf.d/.webstation.error_page.default.resource.conf.timeforge', 'utf8')
  const expected = await readFile('ops/nginx/timeforge.conf', 'utf8')
  if (installed !== expected) throw new Error('Install the tracked Web Station SPA configuration before deploying.')
  try {
    await rejectSymlinks(target)
    await mkdir(backupRoot, { recursive: true })
    await cp(target, backup, { recursive: true, dereference: false })
  } catch (error) { if (error.code !== 'ENOENT') throw error }
  await mkdir(target, { recursive: true })
  await cp(source, target, { recursive: true, force: true })
  for (const retired of ['sw-custom.js', 'sw.js', 'registerSW.js']) await rm(resolve(target, retired), {force:true})
  // Retire only generated route entrypoints; Web Station now falls back to index.html.
  for (const route of ['login', 'dashboard', 'settings', 'profile', 'auth/google']) {
    await rm(resolve(target, route, 'index.html'), {force:true})
    await rm(resolve(target, route + '.html'), {force:true})
    try { await rmdir(resolve(target, route)) } catch (error) { if (!['ENOENT', 'ENOTEMPTY'].includes(error.code)) throw error }
  }
  for (const entry of ['200.html', '404.html']) await rm(resolve(target, entry), {force:true})
  console.log('SPA deployed; obsolete generated entrypoints retired. Unrelated files retained.')
}
