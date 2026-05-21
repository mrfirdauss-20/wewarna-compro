import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const pexec = promisify(execFile)
const FAST_TIMEOUT = 15_000
const NET_TIMEOUT = 60_000

function git(rootDir, args, timeout = FAST_TIMEOUT) {
  return pexec('git', args, { cwd: rootDir, timeout, maxBuffer: 8 * 1024 * 1024 })
}

function partition(porcelain) {
  const dataChanges = []
  const uploadChanges = []
  const otherChanges = []
  for (const line of porcelain.split('\n')) {
    if (!line) continue
    const filePath = line.slice(3).split(' -> ').pop()
    if (filePath.startsWith('src/data/')) dataChanges.push(filePath)
    else if (filePath.startsWith('public/uploads/')) uploadChanges.push(filePath)
    else otherChanges.push(filePath)
  }
  return { dataChanges, uploadChanges, otherChanges }
}

function classifyPushError(stderr) {
  const s = stderr || ''
  if (/Authentication failed|could not read Username|Permission denied|denied to|access rights|403/i.test(s)) {
    return 'Auth failed — check git credentials'
  }
  if (/Could not resolve host|Network is unreachable|timed out|Couldn.?t connect|unable to access/i.test(s)) {
    return 'Network error'
  }
  if (/non-fast-forward|rejected|fetch first|behind/i.test(s)) {
    return 'Push rejected — pull and retry'
  }
  return s.trim().split('\n').slice(-3).join(' ') || 'Push failed'
}

export async function status(rootDir, branch = 'main', remote = 'origin') {
  const log = []
  try {
    const r1 = await git(rootDir, ['status', '--porcelain'])
    log.push('$ git status --porcelain\n' + r1.stdout.trimEnd())
    const { dataChanges, uploadChanges, otherChanges } = partition(r1.stdout)

    let lastPublished = null
    try {
      const r2 = await git(rootDir, ['log', '-1', '--format=%H|%ct|%s', `${remote}/${branch}`])
      const parts = r2.stdout.trim().split('|')
      const sha = parts[0] || ''
      const ts = parts[1] || ''
      const subject = parts.slice(2).join('|')
      lastPublished = {
        sha: sha.slice(0, 7),
        time: ts ? Number(ts) * 1000 : null,
        message: subject,
      }
    } catch { /* no remote ref yet */ }

    let ahead = 0
    let behind = 0
    try {
      const r3 = await git(rootDir, ['rev-list', '--left-right', '--count', `${branch}...${remote}/${branch}`])
      const [a, b] = r3.stdout.trim().split(/\s+/).map(Number)
      ahead = Number.isFinite(a) ? a : 0
      behind = Number.isFinite(b) ? b : 0
    } catch { /* no upstream */ }

    return { ok: true, dataChanges, uploadChanges, otherChanges, lastPublished, ahead, behind, log: log.join('\n') }
  } catch (e) {
    return {
      ok: false,
      error: e.stderr ? e.stderr.trim() : e.message,
      log: log.join('\n'),
    }
  }
}

export async function publish(rootDir, { message, branch = 'main', remote = 'origin', sign = false } = {}) {
  const log = []
  const append = (cmd, out) => { log.push(`$ git ${cmd}${out ? '\n' + String(out).trimEnd() : ''}`) }

  let porcelain
  try {
    const r = await git(rootDir, ['status', '--porcelain'])
    porcelain = r.stdout
    append('status --porcelain', porcelain)
  } catch (e) {
    return { ok: false, stage: 'preflight', error: e.stderr || e.message, log: log.join('\n') }
  }
  const { dataChanges, uploadChanges, otherChanges } = partition(porcelain)
  if (otherChanges.length) {
    return {
      ok: false,
      stage: 'preflight',
      error: 'Working tree has unrelated changes',
      unexpected: otherChanges,
      log: log.join('\n'),
    }
  }
  if (!dataChanges.length && !uploadChanges.length) {
    return { ok: false, stage: 'preflight', error: 'No content changes to publish', log: log.join('\n') }
  }

  const toStage = ['src/data/content.en.json', 'src/data/content.id.json', ...uploadChanges]
  try {
    const r = await git(rootDir, ['add', '--', ...toStage])
    append('add -- ' + toStage.join(' '), r.stdout)
  } catch (e) {
    return { ok: false, stage: 'stage', error: e.stderr || e.message, log: log.join('\n') }
  }

  try {
    const r = await git(rootDir, ['diff', '--cached', '--name-only'])
    append('diff --cached --name-only', r.stdout)
    if (!r.stdout.trim()) {
      return { ok: false, stage: 'stage', error: 'No staged changes', log: log.join('\n') }
    }
  } catch (e) {
    return { ok: false, stage: 'stage', error: e.stderr || e.message, log: log.join('\n') }
  }

  const commitArgs = sign
    ? ['commit', '-m', message]
    : ['-c', 'commit.gpgsign=false', 'commit', '-m', message]
  try {
    const r = await git(rootDir, commitArgs)
    append(commitArgs.join(' '), r.stdout)
  } catch (e) {
    return { ok: false, stage: 'commit', error: e.stderr || e.message, log: log.join('\n') }
  }

  try {
    const r = await git(rootDir, ['pull', '--rebase', '--autostash', remote, branch], NET_TIMEOUT)
    append(`pull --rebase --autostash ${remote} ${branch}`, (r.stdout || '') + (r.stderr ? '\n' + r.stderr : ''))
  } catch (e) {
    try { await git(rootDir, ['rebase', '--abort']) } catch { /* ignore */ }
    return {
      ok: false,
      stage: 'rebase',
      error: 'Rebase conflict — resolve manually. Local commit kept.',
      log: log.join('\n') + '\n' + (e.stderr || e.message),
    }
  }

  try {
    const r = await git(rootDir, ['push', remote, branch], NET_TIMEOUT)
    append(`push ${remote} ${branch}`, (r.stdout || '') + (r.stderr ? '\n' + r.stderr : ''))
  } catch (e) {
    return {
      ok: false,
      stage: 'push',
      error: classifyPushError(e.stderr),
      log: log.join('\n') + '\n' + (e.stderr || e.message),
    }
  }

  let sha = null
  let time = null
  try {
    const r1 = await git(rootDir, ['rev-parse', 'HEAD'])
    sha = r1.stdout.trim().slice(0, 7)
    const r2 = await git(rootDir, ['log', '-1', '--format=%ct'])
    time = Number(r2.stdout.trim()) * 1000
  } catch { /* ignore */ }

  return { ok: true, sha, time, log: log.join('\n') }
}
