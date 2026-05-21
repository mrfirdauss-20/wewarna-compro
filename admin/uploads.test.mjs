import { describe, it } from 'node:test'
import assert from 'node:assert'
import { saveUpload } from './uploads.mjs'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs/promises'

describe('saveUpload', () => {
  it('saves a valid webp and returns /uploads/ path', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'ww-test-'))
    const oneByOne = 'UklGRiQAAABXRUJQVlA4IBgAAABQAQCdASoBAAEAAkA4JYgCdAEO/gHOAAA='
    const result = await saveUpload(tmp, {
      section: 'products',
      suggestedName: 'test.webp',
      dataBase64: oneByOne,
      mimeType: 'image/webp',
    })
    assert.ok(result.path.startsWith('/uploads/products/'))
    assert.ok(result.bytes > 0)
    await fs.rm(tmp, { recursive: true })
  })

  it('rejects unknown mime type', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'ww-test-'))
    await assert.rejects(
      () => saveUpload(tmp, { section: 'products', suggestedName: 'x.bmp', dataBase64: 'abc', mimeType: 'image/bmp' }),
      /unsupported mime/
    )
    await fs.rm(tmp, { recursive: true })
  })
})
