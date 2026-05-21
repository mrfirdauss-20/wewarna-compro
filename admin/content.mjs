import fs from 'node:fs/promises'
import path from 'node:path'
import { sections, sectionOrder } from './schema.js'

function fileFor(rootDir, lang) {
  return path.join(rootDir, 'src', 'data', `content.${lang}.json`)
}

export async function readContent(rootDir, lang) {
  const file = fileFor(rootDir, lang)
  const stat = await fs.stat(file)
  const raw = await fs.readFile(file, 'utf8')
  return { content: JSON.parse(raw), mtime: stat.mtimeMs }
}

export async function writeContent(rootDir, lang, content, baseMtime) {
  const file = fileFor(rootDir, lang)
  const stat = await fs.stat(file)
  if (baseMtime != null && Math.abs(stat.mtimeMs - Number(baseMtime)) > 1) {
    const e = new Error('file changed on disk since last load')
    e.code = 'MTIME_CONFLICT'
    e.currentMtime = stat.mtimeMs
    throw e
  }
  if (typeof content !== 'object' || content === null || Array.isArray(content)) {
    const e = new Error('content must be a plain object')
    e.code = 'BAD_CONTENT'
    throw e
  }
  const json = JSON.stringify(content, null, 2) + '\n'
  const tmp = file + '.tmp'
  await fs.writeFile(tmp, json, 'utf8')
  await fs.rename(tmp, file)
  const newStat = await fs.stat(file)

  const otherLang = lang === 'en' ? 'id' : 'en'
  let synced = null
  try {
    const otherFile = fileFor(rootDir, otherLang)
    const otherRaw = await fs.readFile(otherFile, 'utf8')
    const otherContent = JSON.parse(otherRaw)
    syncSharedContent(content, otherContent)
    const otherJson = JSON.stringify(otherContent, null, 2) + '\n'
    const otherTmp = otherFile + '.tmp'
    await fs.writeFile(otherTmp, otherJson, 'utf8')
    await fs.rename(otherTmp, otherFile)
    const otherStat = await fs.stat(otherFile)
    synced = { lang: otherLang, mtime: otherStat.mtimeMs, content: otherContent }
  } catch (e) {
    console.warn(`[admin] shared-field sync to ${otherLang} skipped:`, e.message)
  }

  return { mtime: newStat.mtimeMs, synced }
}

function isListKind(kind) {
  return kind === 'list-string' || kind === 'list-object' || kind === 'list-image'
}

function blankRow(shape) {
  const blank = {}
  for (const f of shape || []) blank[f.key] = isListKind(f.kind) ? [] : ''
  return blank
}

function shapeHasShared(shape) {
  if (!Array.isArray(shape)) return false
  for (const f of shape) {
    if (f.shared) return true
    if (f.kind === 'list-object' && shapeHasShared(f.shape)) return true
  }
  return false
}

function clone(v) {
  if (v === undefined || v === null) return v
  if (typeof v !== 'object') return v
  return JSON.parse(JSON.stringify(v))
}

function syncListObjectByIndex(srcArr, dstArr, shape) {
  while (dstArr.length < srcArr.length) dstArr.push(blankRow(shape))
  if (dstArr.length > srcArr.length) dstArr.length = srcArr.length

  for (let i = 0; i < srcArr.length; i++) {
    const srcRow = (srcArr[i] && typeof srcArr[i] === 'object') ? srcArr[i] : {}
    let dstRow = dstArr[i]
    if (!dstRow || typeof dstRow !== 'object' || Array.isArray(dstRow)) {
      dstRow = blankRow(shape)
      dstArr[i] = dstRow
    }

    const dstFresh = Object.keys(dstRow).length === 0
      || shape.every(f => dstRow[f.key] === undefined
        || dstRow[f.key] === ''
        || (Array.isArray(dstRow[f.key]) && dstRow[f.key].length === 0))

    for (const f of shape) {
      const srcVal = srcRow[f.key]
      if (f.shared) {
        dstRow[f.key] = srcVal !== undefined ? clone(srcVal) : (isListKind(f.kind) ? [] : '')
      } else if (dstFresh && srcVal !== undefined) {
        dstRow[f.key] = clone(srcVal)
      }
      if (f.kind === 'list-object' && Array.isArray(srcVal)) {
        if (!Array.isArray(dstRow[f.key])) dstRow[f.key] = []
        syncListObjectByIndex(srcVal, dstRow[f.key], f.shape || [])
      }
    }
  }
}

function syncSectionContent(srcSection, dstSection, schema) {
  if (!schema || typeof srcSection !== 'object' || typeof dstSection !== 'object') return
  if (schema.rootKind) return

  for (const f of schema.fields || []) {
    const srcVal = srcSection[f.key]
    if (f.shared) {
      dstSection[f.key] = srcVal !== undefined ? clone(srcVal) : (isListKind(f.kind) ? [] : '')
    }
    if (f.kind === 'list-object' && Array.isArray(srcVal) && shapeHasShared(f.shape)) {
      if (!Array.isArray(dstSection[f.key])) dstSection[f.key] = []
      syncListObjectByIndex(srcVal, dstSection[f.key], f.shape || [])
    }
  }
}

export function syncSharedContent(srcContent, dstContent) {
  if (!srcContent || !dstContent) return dstContent
  for (const key of sectionOrder) {
    const schema = sections[key]
    if (!schema) continue
    if (!srcContent[key] || typeof srcContent[key] !== 'object') continue
    if (!dstContent[key] || typeof dstContent[key] !== 'object') {
      dstContent[key] = Array.isArray(srcContent[key]) ? [] : {}
    }
    syncSectionContent(srcContent[key], dstContent[key], schema)
  }
  return dstContent
}
