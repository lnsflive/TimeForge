import { cp, mkdir, lstat, realpath, access, readdir, rm, rename, readFile } from 'node:fs/promises'
import { resolve, dirname, sep } from 'node:path'
import { randomUUID } from 'node:crypto'
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
console.log(JSON.stringify({ source, target, backup, apply: process.argv.includes('--apply'), policy: 'Back up the existing app, stage a fresh build, then replace the published directory' }, null, 2))
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
  const parent = dirname(target)
  const suffix = randomUUID()
  const stage = resolve(parent, '.timeforge-stage-' + suffix)
  const previous = resolve(parent, '.timeforge-previous-' + suffix)
  const lock = resolve(parent, '.timeforge-deploy.lock')
  await mkdir(parent, {recursive:true})
  await mkdir(lock) // Fail if another deployment owns the publish directory.
  let movedPrevious = false
  try {
    await rejectSymlinks(source)
    await cp(source, stage, {recursive:true, dereference:false, errorOnExist:true, force:false})
    if (await readFile(resolve(stage, 'index.html'), 'utf8') !== await readFile(resolve(source, 'index.html'), 'utf8')) throw new Error('Staged entry does not match the build')
    let exists = true
    try { await lstat(target) } catch (error) { if (error.code === 'ENOENT') exists = false; else throw error }
    if (exists) {
      await rejectSymlinks(target)
      await mkdir(backupRoot, {recursive:true})
      await cp(target, backup, {recursive:true, dereference:false, errorOnExist:true, force:false})
      await rename(target, previous)
      movedPrevious = true
    }
    try { await rename(stage, target) }
    catch (error) {
      if (movedPrevious) { await rename(previous, target); movedPrevious = false }
      throw error
    }
    if (movedPrevious) await rm(previous, {recursive:true})
    console.log('Published a fresh SPA directory. Previous deployment retained at ' + backup)
  } finally {
    await rm(stage, {recursive:true, force:true})
    await rm(lock, {recursive:true, force:true})
  }
}
