import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as auth from './auth.mjs'
import * as content from './content.mjs'
import * as git from './git.mjs'
import * as uploads from './uploads.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const ENV_FILE = path.join(ROOT, '.env.admin')
const ENV_EXAMPLE = path.join(__dirname, '.env.example')
const UI_DIR = path.join(__dirname, 'ui')

const STATIC_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.mjs':  'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.png':  'image/png',
  '.json': 'application/json; charset=utf-8',
}

async function loadEnv() {
  let raw
  try { raw = await fs.readFile(ENV_FILE, 'utf8') } catch { return {} }
  const env = {}
  for (const line of raw.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    const key = t.slice(0, eq).trim()
    let value = t.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    env[key] = value
  }
  return env
}

function send(res, status, body, extraHeaders = {}) {
  const isBuffer = Buffer.isBuffer(body)
  const isString = typeof body === 'string'
  const payload = (isBuffer || isString) ? body : JSON.stringify(body)
  const headers = {
    'Content-Type': (isBuffer || isString) ? (extraHeaders['Content-Type'] || 'text/plain; charset=utf-8') : 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...extraHeaders,
  }
  res.writeHead(status, headers)
  res.end(payload)
}

function readJson(req, max = 4 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let total = 0
    const chunks = []
    req.on('data', c => {
      total += c.length
      if (total > max) {
        reject(new Error('payload too large'))
        req.destroy()
        return
      }
      chunks.push(c)
    })
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8')
        resolve(raw ? JSON.parse(raw) : {})
      } catch {
        reject(new Error('invalid json'))
      }
    })
    req.on('error', reject)
  })
}

function bearerToken(req) {
  const h = req.headers.authorization || ''
  const m = h.match(/^Bearer (.+)$/i)
  return m ? m[1] : null
}

function clientIp(req) {
  return req.socket.remoteAddress || ''
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function serveStatic(res, urlPath) {
  let rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '')
  if (rel.includes('..') || rel.includes('\0')) return send(res, 400, 'bad path')
  const file = path.join(UI_DIR, rel)
  if (!file.startsWith(UI_DIR + path.sep)) return send(res, 400, 'bad path')
  try {
    const data = await fs.readFile(file)
    const ext = path.extname(file).toLowerCase()
    return send(res, 200, data, { 'Content-Type': STATIC_TYPES[ext] || 'application/octet-stream' })
  } catch {
    return send(res, 404, 'not found')
  }
}

function promptPassword(prompt) {
  return new Promise((resolve) => {
    process.stdout.write(prompt)
    if (process.stdin.setRawMode) process.stdin.setRawMode(true)
    process.stdin.resume()
    process.stdin.setEncoding('utf8')
    let buf = ''
    const onData = (raw) => {
      const ch = raw.toString()
      if (ch === '') {
        process.stdout.write('\n')
        process.exit(1)
      }
      if (ch === '\r' || ch === '\n') {
        process.stdin.removeListener('data', onData)
        if (process.stdin.setRawMode) process.stdin.setRawMode(false)
        process.stdin.pause()
        process.stdout.write('\n')
        resolve(buf)
        return
      }
      if (ch === '' || ch === '\b') {
        if (buf.length > 0) {
          buf = buf.slice(0, -1)
          process.stdout.write('\b \b')
        }
        return
      }
      buf += ch
      process.stdout.write('*')
    }
    process.stdin.on('data', onData)
  })
}

async function runSetup() {
  try { await fs.access(ENV_FILE) }
  catch {
    try {
      const example = await fs.readFile(ENV_EXAMPLE, 'utf8')
      await fs.writeFile(ENV_FILE, example, 'utf8')
      console.log(`Created ${ENV_FILE} from template.`)
    } catch (e) {
      console.error('Failed to create .env.admin:', e.message)
      process.exit(1)
    }
  }

  const password = await promptPassword('Set admin password (min 12 chars, hidden): ')
  if (password.length < 12) {
    console.error('Password too short. Aborting.')
    process.exit(1)
  }
  const confirm = await promptPassword('Confirm password: ')
  if (password !== confirm) {
    console.error('Passwords do not match. Aborting.')
    process.exit(1)
  }

  const raw = await fs.readFile(ENV_FILE, 'utf8')
  const replaced = /^ADMIN_PASSWORD=.*$/m.test(raw)
    ? raw.replace(/^ADMIN_PASSWORD=.*$/m, `ADMIN_PASSWORD=${password}`)
    : raw + (raw.endsWith('\n') ? '' : '\n') + `ADMIN_PASSWORD=${password}\n`
  await fs.writeFile(ENV_FILE, replaced, 'utf8')
  console.log('Password saved to .env.admin')
  console.log('Run `npm run admin` to start the server.')
}

async function main() {
  if (process.argv.includes('--setup')) {
    await runSetup()
    return
  }

  const env = await loadEnv()
  const password = env.ADMIN_PASSWORD
  if (!password || password.length < 12) {
    console.error(`ADMIN_PASSWORD missing or too short in ${ENV_FILE} (min 12 chars).`)
    console.error('Run `npm run admin:setup` first.')
    process.exit(1)
  }
  const port = Number(env.ADMIN_PORT || 5174)
  const branch = env.ADMIN_GIT_BRANCH || 'main'
  const remote = env.ADMIN_GIT_REMOTE || 'origin'
  const sign = env.ADMIN_GIT_SIGN === '1'

  const expectedHosts = new Set([`127.0.0.1:${port}`, `localhost:${port}`])

  const server = http.createServer(async (req, res) => {
    try {
      const ip = clientIp(req)
      const isLocal = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1'
      if (!isLocal) {
        return send(res, 403, { error: 'forbidden' })
      }

      const host = (req.headers.host || '').toLowerCase()
      if (!expectedHosts.has(host)) {
        return send(res, 421, { error: 'misdirected request' })
      }

      const url = new URL(req.url, `http://${host}`)
      const pathname = url.pathname

      if (req.method === 'POST' && pathname === '/api/login') {
        if (auth.isLocked(ip)) {
          await sleep(500)
          return send(res, 429, { error: 'too many failed attempts — locked for 15 minutes' })
        }
        let body
        try { body = await readJson(req) }
        catch { return send(res, 400, { error: 'bad request' }) }
        const submitted = String(body?.password ?? '')
        if (!auth.checkPassword(submitted, password)) {
          auth.recordFailure(ip)
          await sleep(Math.max(500, auth.backoffMs(ip)))
          return send(res, 401, { error: 'invalid password' })
        }
        auth.clearFailures(ip)
        return send(res, 200, auth.issueToken())
      }

      if (req.method === 'POST' && pathname === '/api/logout') {
        const tok = bearerToken(req)
        if (tok) auth.revokeToken(tok)
        return send(res, 200, { ok: true })
      }

      if (pathname.startsWith('/api/')) {
        const tok = bearerToken(req)
        if (!tok || !auth.validateToken(tok)) {
          return send(res, 401, { error: 'unauthorized' })
        }

        if (req.method === 'GET') {
          const m = pathname.match(/^\/api\/content\/(en|id)$/)
          if (m) {
            try {
              return send(res, 200, await content.readContent(ROOT, m[1]))
            } catch (e) {
              return send(res, 500, { error: e.message })
            }
          }
          if (pathname === '/api/git/status') {
            return send(res, 200, await git.status(ROOT, branch, remote))
          }
          if (pathname === '/api/uploads') {
            const section = url.searchParams.get('section') || ''
            try {
              return send(res, 200, await uploads.listUploads(ROOT, section))
            } catch (e) {
              const status = e.code === 'BAD_INPUT' ? 400 : 500
              return send(res, status, { error: e.message })
            }
          }
        }

        if (req.method === 'PUT') {
          const m = pathname.match(/^\/api\/content\/(en|id)$/)
          if (m) {
            let body
            try { body = await readJson(req) }
            catch { return send(res, 400, { error: 'bad request' }) }
            try {
              return send(res, 200, await content.writeContent(ROOT, m[1], body.content, body.baseMtime))
            } catch (e) {
              if (e.code === 'MTIME_CONFLICT') {
                return send(res, 409, { error: 'file changed on disk', currentMtime: e.currentMtime })
              }
              if (e.code === 'BAD_CONTENT') {
                return send(res, 400, { error: e.message })
              }
              return send(res, 500, { error: e.message })
            }
          }
        }

        if (req.method === 'POST' && pathname === '/api/uploads') {
          let body
          try { body = await readJson(req, 6 * 1024 * 1024) }
          catch { return send(res, 400, { error: 'bad request' }) }
          try {
            const r = await uploads.saveUpload(ROOT, {
              section: body?.section,
              suggestedName: body?.suggestedName,
              dataBase64: body?.dataBase64,
              mimeType: body?.mimeType,
            })
            return send(res, 200, r)
          } catch (e) {
            const status = e.code === 'BAD_INPUT' ? 400
              : e.code === 'BAD_PATH' ? 400
              : e.code === 'TOO_LARGE' ? 413
              : 500
            return send(res, status, { error: e.message })
          }
        }

        if (req.method === 'DELETE' && pathname === '/api/uploads') {
          const target = url.searchParams.get('path') || ''
          try {
            return send(res, 200, await uploads.deleteUpload(ROOT, target))
          } catch (e) {
            const status = e.code === 'BAD_PATH' ? 400 : 500
            return send(res, status, { error: e.message })
          }
        }

        if (req.method === 'POST' && pathname === '/api/git/publish') {
          let body
          try { body = await readJson(req) }
          catch { return send(res, 400, { error: 'bad request' }) }
          const message = (body?.message && String(body.message).trim())
            || `content: update ${new Date().toISOString()}`
          return send(res, 200, await git.publish(ROOT, { message, branch, remote, sign }))
        }

        return send(res, 404, { error: 'not found' })
      }

      if (req.method === 'GET') {
        return await serveStatic(res, pathname)
      }

      return send(res, 405, { error: 'method not allowed' })
    } catch (e) {
      return send(res, 500, { error: e.message || 'server error' })
    }
  })

  server.listen(port, '127.0.0.1', () => {
    console.log(`EverNode admin listening on http://localhost:${port}`)
    console.log(`Branch: ${branch} · Remote: ${remote}`)
    console.log('Press Ctrl-C to stop.')
  })
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
