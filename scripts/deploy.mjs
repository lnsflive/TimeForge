import { cp, mkdir, lstat, realpath, access, readdir, rm } from 'node:fs/promises'
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
  try {
    await rejectSymlinks(target)
    await mkdir(backupRoot, { recursive: true })
    await cp(target, backup, { recursive: true, dereference: false })
  } catch (error) { if (error.code !== 'ENOENT') throw error }
  await mkdir(target, { recursive: true })
  await cp(source, target, { recursive: true, force: true })
  for (const retired of ['sw-custom.js', 'sw.js', 'registerSW.js']) await rm(resolve(target, retired), {force:true})
  console.log('Deployment copied. Existing files not in the build were retained.')
}
