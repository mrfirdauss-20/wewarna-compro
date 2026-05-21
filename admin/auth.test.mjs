import { describe, it } from 'node:test'
import assert from 'node:assert'
import { checkPassword, issueToken, validateToken, revokeToken, recordFailure, isLocked } from './auth.mjs'

describe('checkPassword', () => {
  it('matches same password', () => {
    assert.ok(checkPassword('correct-horse-battery', 'correct-horse-battery'))
  })
  it('rejects wrong password', () => {
    assert.ok(!checkPassword('wrong', 'correct-horse-battery'))
  })
})

describe('token lifecycle', () => {
  it('issues, validates, revokes', () => {
    const { token } = issueToken()
    assert.ok(validateToken(token))
    revokeToken(token)
    assert.ok(!validateToken(token))
  })
  it('rejects unknown token', () => {
    assert.ok(!validateToken('not-a-token'))
  })
})

describe('rate limiting', () => {
  it('locks after 10 failures', () => {
    const ip = '1.2.3.4'
    for (let i = 0; i < 10; i++) recordFailure(ip)
    assert.ok(isLocked(ip))
  })
})
