import crypto from 'node:crypto'

const TOKEN_TTL_MS = 8 * 60 * 60 * 1000
const FAILURE_LOCK_THRESHOLD = 10
const FAILURE_LOCK_MS = 15 * 60 * 1000

const tokens = new Map()
const failures = new Map()

export function checkPassword(submitted, expected) {
  const a = crypto.createHash('sha256').update(String(submitted ?? '')).digest()
  const b = crypto.createHash('sha256').update(String(expected ?? '')).digest()
  return crypto.timingSafeEqual(a, b)
}

export function issueToken() {
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = Date.now() + TOKEN_TTL_MS
  tokens.set(token, { expiresAt })
  return { token, expiresAt }
}

export function validateToken(token) {
  if (!token) return false
  const entry = tokens.get(token)
  if (!entry) return false
  if (entry.expiresAt < Date.now()) {
    tokens.delete(token)
    return false
  }
  entry.expiresAt = Date.now() + TOKEN_TTL_MS
  return true
}

export function revokeToken(token) {
  if (token) tokens.delete(token)
}

export function recordFailure(ip) {
  const entry = failures.get(ip) ?? { count: 0, lockUntil: 0 }
  entry.count += 1
  if (entry.count >= FAILURE_LOCK_THRESHOLD) {
    entry.lockUntil = Date.now() + FAILURE_LOCK_MS
  }
  failures.set(ip, entry)
}

export function clearFailures(ip) {
  failures.delete(ip)
}

export function isLocked(ip) {
  const entry = failures.get(ip)
  if (!entry) return false
  if (entry.lockUntil && entry.lockUntil > Date.now()) return true
  if (entry.lockUntil && entry.lockUntil <= Date.now()) {
    failures.delete(ip)
  }
  return false
}

export function backoffMs(ip) {
  const entry = failures.get(ip)
  if (!entry || !entry.count) return 0
  return Math.min(100 * Math.pow(2, entry.count - 1), 10_000)
}
