import fs from 'node:fs/promises'
import path from 'node:path'

const MIME_TO_EXT = {
  'image/png':  'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif':  'gif',
  'image/svg+xml': 'svg',
}

const MAX_BYTES = 3 * 1024 * 1024

export const PUBLIC_PREFIX = '/uploads/'
const REL_ROOT = path.join('public', 'uploads')

function uploadsDir(rootDir) {
  return path.join(rootDir, REL_ROOT)
}

function sanitizeSection(section) {
  const s = String(section || '').toLowerCase().replace(/[^a-z0-9_-]+/g, '')
  if (!s) return null
  if (s.length > 32) return null
  return s
}

function sanitizeBaseName(name) {
  const base = path.basename(String(name || 'image')).toLowerCase()
  const stem = base.replace(/\.[^.]+$/, '')
  const cleaned = stem.replace(/[^a-z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  return cleaned.slice(0, 60) || 'image'
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true })
}

async function exists(file) {
  try { await fs.stat(file); return true } catch { return false }
}

async function pickFreeName(dir, baseStem, ext) {
  let candidate = `${baseStem}.${ext}`
  if (!(await exists(path.join(dir, candidate)))) return candidate
  for (let i = 2; i < 1000; i++) {
    candidate = `${baseStem}-${i}.${ext}`
    if (!(await exists(path.join(dir, candidate)))) return candidate
  }
  throw Object.assign(new Error('cannot pick unique filename'), { code: 'COLLISION' })
}

function ensureUnderRoot(rootDir, absFile) {
  const root = uploadsDir(rootDir) + path.sep
  if (!absFile.startsWith(root)) {
    throw Object.assign(new Error('path escapes uploads dir'), { code: 'BAD_PATH' })
  }
}

export async function saveUpload(rootDir, { section, suggestedName, dataBase64, mimeType }) {
  const sec = sanitizeSection(section)
  if (!sec) {
    throw Object.assign(new Error('bad section'), { code: 'BAD_INPUT' })
  }
  const ext = MIME_TO_EXT[String(mimeType || '').toLowerCase()]
  if (!ext) {
    throw Object.assign(new Error('unsupported mime type'), { code: 'BAD_INPUT' })
  }
  const buf = Buffer.from(String(dataBase64 || ''), 'base64')
  if (!buf.length) {
    throw Object.assign(new Error('empty payload'), { code: 'BAD_INPUT' })
  }
  if (buf.length > MAX_BYTES) {
    throw Object.assign(new Error('file too large'), { code: 'TOO_LARGE' })
  }
  const stem = sanitizeBaseName(suggestedName)
  const dir = path.join(uploadsDir(rootDir), sec)
  await ensureDir(dir)
  const finalName = await pickFreeName(dir, stem, ext)
  const finalPath = path.join(dir, finalName)
  ensureUnderRoot(rootDir, finalPath)
  const tmp = finalPath + '.tmp'
  await fs.writeFile(tmp, buf)
  await fs.rename(tmp, finalPath)
  return {
    path: `${PUBLIC_PREFIX}${sec}/${finalName}`,
    bytes: buf.length,
  }
}

export async function listUploads(rootDir, section) {
  const sec = sanitizeSection(section)
  if (!sec) {
    throw Object.assign(new Error('bad section'), { code: 'BAD_INPUT' })
  }
  const dir = path.join(uploadsDir(rootDir), sec)
  let entries = []
  try { entries = await fs.readdir(dir, { withFileTypes: true }) } catch { return { items: [] } }
  const items = []
  for (const ent of entries) {
    if (!ent.isFile()) continue
    if (ent.name.startsWith('.') || ent.name.endsWith('.tmp')) continue
    const file = path.join(dir, ent.name)
    try {
      const stat = await fs.stat(file)
      items.push({
        path: `${PUBLIC_PREFIX}${sec}/${ent.name}`,
        bytes: stat.size,
        mtime: stat.mtimeMs,
      })
    } catch { /* skip */ }
  }
  items.sort((a, b) => b.mtime - a.mtime)
  return { items }
}

export async function deleteUpload(rootDir, publicPath) {
  const p = String(publicPath || '')
  if (!p.startsWith(PUBLIC_PREFIX)) {
    throw Object.assign(new Error('path must start with /uploads/'), { code: 'BAD_PATH' })
  }
  const rel = p.slice(PUBLIC_PREFIX.length)
  if (!rel || rel.includes('..') || rel.includes('\0')) {
    throw Object.assign(new Error('bad path'), { code: 'BAD_PATH' })
  }
  const abs = path.join(uploadsDir(rootDir), rel)
  ensureUnderRoot(rootDir, abs)
  try {
    await fs.unlink(abs)
  } catch (e) {
    if (e.code === 'ENOENT') return { ok: true, missing: true }
    throw e
  }
  return { ok: true }
}
