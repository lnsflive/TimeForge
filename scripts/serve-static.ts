import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize, resolve } from 'node:path'

const root = resolve('.output/public')
const port = Number(process.env.PORT || 4173)
const host = process.env.HOST || '127.0.0.1'
const contentTypes: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.eot': 'application/vnd.ms-fontobject',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.webmanifest': 'application/manifest+json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

async function fileFor(requestPath: string): Promise<string | null> {
  const cleanPath = normalize(decodeURIComponent(requestPath)).replace(/^(\.\.(\/|\\|$))+/, '')
  let filePath = join(root, cleanPath)
  if (!filePath.startsWith(root)) return null

  try {
    if ((await stat(filePath)).isDirectory()) filePath = join(filePath, 'index.html')
    return filePath
  } catch {
    return extname(filePath) ? null : join(root, 'index.html')
  }
}

createServer(async (request, response) => {
  try {
    const requestPath = new URL(request.url || '/', `http://${request.headers.host}`).pathname
    const filePath = await fileFor(requestPath)
    if (!filePath) {
      response.writeHead(404).end('Not found')
      return
    }
    const body = await readFile(filePath)
    response.writeHead(200, {
      'Content-Type': contentTypes[extname(filePath)] || 'application/octet-stream',
      'Content-Length': body.length,
    })
    response.end(body)
  } catch {
    response.writeHead(500).end('Server error')
  }
}).listen(port, host, () => {
  process.stdout.write(`Static preview listening on http://${host}:${port}\n`)
})
