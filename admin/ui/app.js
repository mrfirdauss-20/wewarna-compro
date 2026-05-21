import { sections, sectionOrder } from '/schema.js'

const root = document.getElementById('app')

const state = {
  token: sessionStorage.getItem('admin-token') || null,
  expiresAt: Number(sessionStorage.getItem('admin-expires') || 0),
  loggedIn: false,
  loading: false,
  loadError: null,
  content: { en: null, id: null },
  mtime: { en: 0, id: 0 },
  dirty: { en: false, id: false },
  lang: 'en',
  section: sectionOrder[0],
  gitStatus: null,
  saving: false,
  publishing: false,
  publishLog: '',
  publishOpen: false,
}

// ---------- API helpers ----------

async function api(path, opts = {}) {
  const headers = {
    ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
    ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
    ...opts.headers,
  }
  const res = await fetch(path, { ...opts, headers })
  let data = null
  try { data = await res.json() } catch {}
  if (res.status === 401) {
    state.token = null
    state.loggedIn = false
    sessionStorage.removeItem('admin-token')
    sessionStorage.removeItem('admin-expires')
    render()
    const err = new Error(data?.error || 'unauthorized')
    err.status = 401
    throw err
  }
  if (!res.ok) {
    const err = new Error(data?.error || res.statusText)
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

async function login(password) {
  const r = await api('/api/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  })
  state.token = r.token
  state.expiresAt = r.expiresAt
  sessionStorage.setItem('admin-token', r.token)
  sessionStorage.setItem('admin-expires', String(r.expiresAt))
}

async function logout() {
  try { await api('/api/logout', { method: 'POST' }) } catch {}
  state.token = null
  state.loggedIn = false
  state.content = { en: null, id: null }
  state.mtime = { en: 0, id: 0 }
  state.dirty = { en: false, id: false }
  sessionStorage.removeItem('admin-token')
  sessionStorage.removeItem('admin-expires')
  render()
}

async function loadAll() {
  state.loading = true
  state.loadError = null
  render()
  try {
    const [en, id, gs] = await Promise.all([
      api('/api/content/en'),
      api('/api/content/id'),
      api('/api/git/status').catch((e) => ({ ok: false, error: e.message })),
    ])
    state.content.en = en.content
    state.content.id = id.content
    state.mtime.en = en.mtime
    state.mtime.id = id.mtime
    state.dirty.en = false
    state.dirty.id = false
    state.gitStatus = gs
    state.loggedIn = true
  } catch (e) {
    if (e.status !== 401) state.loadError = e.message
  } finally {
    state.loading = false
    render()
  }
}

async function refreshGitStatus() {
  try {
    state.gitStatus = await api('/api/git/status')
  } catch (e) {
    if (e.status !== 401) state.gitStatus = { ok: false, error: e.message }
  }
}

function applySyncedResponse(r) {
  const s = r && r.synced
  if (!s || !s.lang || !s.content) return
  if (state.dirty[s.lang]) return
  state.content[s.lang] = s.content
  state.mtime[s.lang] = s.mtime
  if (state.lang === s.lang) renderEditor()
}

async function save() {
  if (state.saving) return
  state.saving = true
  renderTopbar()
  let anyError = null
  try {
    for (const lang of ['en', 'id']) {
      if (!state.dirty[lang]) continue
      try {
        const r = await api(`/api/content/${lang}`, {
          method: 'PUT',
          body: JSON.stringify({ content: state.content[lang], baseMtime: state.mtime[lang] }),
        })
        state.mtime[lang] = r.mtime
        state.dirty[lang] = false
        applySyncedResponse(r)
      } catch (e) {
        if (e.status === 409) {
          const reload = confirm(
            `${lang.toUpperCase()} changed on disk since you loaded it.\n\n` +
            `OK = discard your edits and reload from disk.\n` +
            `Cancel = overwrite the disk version with your edits.`,
          )
          if (reload) {
            const fresh = await api(`/api/content/${lang}`)
            state.content[lang] = fresh.content
            state.mtime[lang] = fresh.mtime
            state.dirty[lang] = false
            renderEditor()
          } else {
            state.mtime[lang] = e.data?.currentMtime ?? state.mtime[lang]
            const r = await api(`/api/content/${lang}`, {
              method: 'PUT',
              body: JSON.stringify({ content: state.content[lang], baseMtime: state.mtime[lang] }),
            })
            state.mtime[lang] = r.mtime
            state.dirty[lang] = false
            applySyncedResponse(r)
          }
        } else {
          anyError = `${lang.toUpperCase()}: ${e.message}`
        }
      }
    }
    await refreshGitStatus()
  } finally {
    state.saving = false
    renderTopbar()
    if (anyError) alert(`Save failed:\n${anyError}`)
    if (!anyError) reloadPreviews()
  }
}

async function publish(message) {
  if (state.publishing) return null
  state.publishing = true
  state.publishLog = ''
  renderTopbar()
  try {
    const r = await api('/api/git/publish', {
      method: 'POST',
      body: JSON.stringify({ message }),
    })
    state.publishLog = r.log || ''
    await refreshGitStatus()
    return r
  } catch (e) {
    state.publishLog = `Request failed: ${e.message}`
    return { ok: false, error: e.message, log: state.publishLog }
  } finally {
    state.publishing = false
    renderTopbar()
  }
}

// ---------- DOM helpers ----------

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue
    if (k === 'class') node.className = v
    else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v)
    else if (k.startsWith('on') && typeof v === 'function') {
      node.addEventListener(k.slice(2).toLowerCase(), v)
    } else if (k === 'value') node.value = v
    else if (k === 'checked') node.checked = !!v
    else if (k === 'disabled') { if (v) node.disabled = true }
    else if (k === 'autofocus') { if (v) node.setAttribute('autofocus', '') }
    else node.setAttribute(k, v)
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue
    node.append(c instanceof Node ? c : document.createTextNode(String(c)))
  }
  return node
}

function clear(node) { while (node.firstChild) node.removeChild(node.firstChild) }

function setDirty(lang) {
  if (!state.dirty[lang]) {
    state.dirty[lang] = true
    renderTopbar()
  }
}

function fmtTime(ms) {
  if (!ms) return ''
  const d = new Date(ms)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ---------- Field renderers ----------

function fieldText({ value, label, multiline, onChange }) {
  const Input = multiline ? 'textarea' : 'input'
  const inp = el(Input, {
    type: multiline ? null : 'text',
    value: value ?? '',
    spellcheck: 'false',
  })
  inp.addEventListener('input', () => onChange(inp.value))
  return el('div', { class: 'field' },
    label && el('label', {}, label),
    inp,
  )
}

function fieldListString({ values, label, onChange }) {
  const wrap = el('div', { class: 'field wide' }, label && el('label', {}, label))
  const list = el('div')
  let arr = Array.isArray(values) ? values.slice() : []

  function commit() {
    onChange(arr.slice())
    redraw()
  }
  function redraw() {
    clear(list)
    arr.forEach((v, i) => {
      const inp = el('input', { type: 'text', value: v, spellcheck: 'false' })
      inp.addEventListener('input', () => { arr[i] = inp.value; onChange(arr.slice()) })
      list.append(el('div', { class: 'list-string-row' },
        inp,
        el('button', { type: 'button', class: 'ghost', onClick: () => { if (i > 0) { [arr[i-1], arr[i]] = [arr[i], arr[i-1]]; commit() } }, title: 'Move up' }, '↑'),
        el('button', { type: 'button', class: 'ghost', onClick: () => { if (i < arr.length - 1) { [arr[i], arr[i+1]] = [arr[i+1], arr[i]]; commit() } }, title: 'Move down' }, '↓'),
        el('button', { type: 'button', class: 'ghost danger', onClick: () => { arr.splice(i, 1); commit() }, title: 'Delete' }, '✕'),
      ))
    })
    list.append(el('div', { style: { marginTop: '8px' } },
      el('button', { type: 'button', onClick: () => { arr.push(''); commit() } }, '+ Add item'),
    ))
  }
  redraw()
  wrap.append(list)
  return wrap
}

// ---------- Image upload helpers ----------

const PREVIEW_BASE = `${location.protocol}//localhost:5173`

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error || new Error('read failed'))
    reader.onload = () => {
      const result = String(reader.result || '')
      const idx = result.indexOf(',')
      resolve(idx >= 0 ? result.slice(idx + 1) : result)
    }
    reader.readAsDataURL(file)
  })
}

async function uploadFile(file, section) {
  if (!file) throw new Error('no file')
  if (file.size > 3 * 1024 * 1024) throw new Error('file too large (max 3 MB)')
  const dataBase64 = await readFileAsBase64(file)
  return await api('/api/uploads', {
    method: 'POST',
    body: JSON.stringify({
      section,
      suggestedName: file.name,
      mimeType: file.type || 'application/octet-stream',
      dataBase64,
    }),
  })
}

function thumbBox(src) {
  const box = el('div', { class: 'img-thumb' })
  if (src) {
    box.append(el('img', { src: src + (src.includes('?') ? '&' : '?') + 'v=' + Date.now(), alt: '' }))
  } else {
    box.append(el('span', { class: 'muted mono' }, 'no image'))
  }
  return box
}

async function openPickerModal(section) {
  let items = []
  let loadError = null
  try {
    const r = await api(`/api/uploads?section=${encodeURIComponent(section)}`)
    items = r?.items || []
  } catch (e) {
    loadError = e.message || 'list failed'
  }

  return new Promise((resolve) => {
    function close(value) {
      if (modalRoot) clear(modalRoot)
      // restore base modal (e.g., publish) if it was open
      renderModal()
      resolve(value)
    }

    const listEl = el('div', { class: 'picker-grid' })
    if (!items.length) {
      listEl.append(el('div', { class: 'muted' }, `No images uploaded for "${section}" yet.`))
    } else {
      for (const it of items) {
        const tile = el('button', {
          class: 'picker-tile', type: 'button',
          title: it.path, onClick: () => close(it.path),
        }, el('img', { src: it.path, alt: '' }), el('span', { class: 'mono' }, it.path.split('/').pop()))
        listEl.append(tile)
      }
    }

    const dialog = el('div', { class: 'modal-backdrop', onClick: (e) => { if (e.target === dialog) close(null) } },
      el('div', { class: 'modal' },
        el('header', {}, el('h3', {}, `Pick image — ${section}`)),
        el('div', { class: 'body' },
          loadError ? el('div', { class: 'error' }, `List failed: ${loadError}`) : null,
          listEl,
        ),
        el('footer', {},
          el('button', { class: 'ghost', onClick: () => close(null) }, 'Cancel'),
        ),
      ),
    )
    if (modalRoot) {
      clear(modalRoot)
      modalRoot.append(dialog)
    } else {
      resolve(null)
    }
  })
}

function fieldImage({ value, label, section, onChange }) {
  const wrap = el('div', { class: 'field image-field' })
  if (label) wrap.append(el('label', {}, label))
  const row = el('div', { class: 'image-row' })

  let current = typeof value === 'string' ? value : ''

  const pathLabel = el('span', { class: 'mono muted', style: { wordBreak: 'break-all' } }, current || '—')
  const fileInput = el('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml', style: { display: 'none' } })

  const uploadBtn = el('button', { type: 'button' }, 'Upload…')
  const pickBtn = el('button', { type: 'button', class: 'ghost' }, 'Pick existing')
  const clearBtn = el('button', { type: 'button', class: 'ghost danger' }, 'Clear')

  uploadBtn.addEventListener('click', () => fileInput.click())
  pickBtn.addEventListener('click', async () => {
    const picked = await openPickerModal(section || 'misc')
    if (picked) {
      current = picked
      onChange(current)
      redraw()
    }
  })
  clearBtn.addEventListener('click', () => {
    if (!current) return
    current = ''
    onChange('')
    redraw()
  })
  fileInput.addEventListener('change', async () => {
    const f = fileInput.files && fileInput.files[0]
    if (!f) return
    try {
      uploadBtn.disabled = true
      uploadBtn.textContent = 'Uploading…'
      const r = await uploadFile(f, section || 'misc')
      current = r.path
      onChange(current)
      redraw()
    } catch (e) {
      alert(`Upload failed: ${e.message}`)
    } finally {
      uploadBtn.disabled = false
      uploadBtn.textContent = 'Upload…'
      fileInput.value = ''
    }
  })

  function redraw() {
    clear(row)
    pathLabel.textContent = current || '—'
    row.append(
      thumbBox(current),
      el('div', { class: 'image-actions' },
        el('div', {}, uploadBtn, pickBtn, clearBtn),
        pathLabel,
      ),
      fileInput,
    )
  }

  redraw()
  wrap.append(row)
  return wrap
}

function fieldListImage({ values, label, section, onChange }) {
  const wrap = el('div', { class: 'field wide' })
  if (label) wrap.append(el('label', {}, label))
  const list = el('div')
  let arr = Array.isArray(values) ? values.slice() : []

  function commit() { onChange(arr.slice()) }

  function redraw() {
    clear(list)
    arr.forEach((src, i) => {
      const row = el('div', { class: 'list-image-row' })
      row.append(thumbBox(src))
      const ctrl = el('div', { class: 'image-actions' })
      const fileInput = el('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml', style: { display: 'none' } })
      fileInput.addEventListener('change', async () => {
        const f = fileInput.files && fileInput.files[0]
        if (!f) return
        try {
          const r = await uploadFile(f, section || 'misc')
          arr[i] = r.path
          commit(); redraw()
        } catch (e) {
          alert(`Upload failed: ${e.message}`)
        } finally {
          fileInput.value = ''
        }
      })
      ctrl.append(
        el('div', {},
          el('button', { type: 'button', onClick: () => fileInput.click() }, 'Replace…'),
          el('button', {
            type: 'button', class: 'ghost',
            onClick: async () => {
              const picked = await openPickerModal(section || 'misc')
              if (picked) { arr[i] = picked; commit(); redraw() }
            },
          }, 'Pick'),
          el('button', { type: 'button', class: 'ghost', onClick: () => { if (i > 0) { [arr[i-1], arr[i]] = [arr[i], arr[i-1]]; commit(); redraw() } }, title: 'Move up' }, '↑'),
          el('button', { type: 'button', class: 'ghost', onClick: () => { if (i < arr.length - 1) { [arr[i], arr[i+1]] = [arr[i+1], arr[i]]; commit(); redraw() } }, title: 'Move down' }, '↓'),
          el('button', { type: 'button', class: 'ghost danger', onClick: () => { arr.splice(i, 1); commit(); redraw() }, title: 'Remove' }, '✕'),
        ),
        el('span', { class: 'mono muted' }, src || '—'),
      )
      row.append(ctrl, fileInput)
      list.append(row)
    })

    const adderInput = el('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml', style: { display: 'none' } })
    adderInput.addEventListener('change', async () => {
      const f = adderInput.files && adderInput.files[0]
      if (!f) return
      try {
        const r = await uploadFile(f, section || 'misc')
        arr.push(r.path); commit(); redraw()
      } catch (e) {
        alert(`Upload failed: ${e.message}`)
      } finally {
        adderInput.value = ''
      }
    })
    list.append(el('div', { class: 'list-image-actions' },
      el('button', { type: 'button', onClick: () => adderInput.click() }, '+ Upload image'),
      el('button', {
        type: 'button', class: 'ghost',
        onClick: async () => {
          const picked = await openPickerModal(section || 'misc')
          if (picked) { arr.push(picked); commit(); redraw() }
        },
      }, '+ Pick existing'),
      adderInput,
    ))
  }
  redraw()
  wrap.append(list)
  return wrap
}

// ---------- Preview iframe registry ----------

const previewIframes = new Set()

function reloadPreviews() {
  for (const f of [...previewIframes]) {
    if (!f.isConnected) {
      previewIframes.delete(f)
      continue
    }
    try {
      const url = new URL(f.dataset.previewBase, window.location.href)
      url.searchParams.set('v', String(Date.now()))
      f.src = url.toString()
    } catch { /* ignore */ }
  }
}

function buildPreviewPane(idValue, route) {
  if (!idValue) {
    return el('div', { class: 'preview-pane empty' },
      el('div', { class: 'muted' }, 'Set an ID to enable preview.'),
    )
  }
  const target = route.replace('{id}', encodeURIComponent(String(idValue)))
  const baseUrl = `${PREVIEW_BASE}${target}`
  const initialUrl = baseUrl + (baseUrl.includes('?') ? '&' : '?') + 'preview=1'
  const frame = el('iframe', {
    class: 'preview-frame',
    src: initialUrl,
    title: 'Preview',
    'data-preview-base': initialUrl,
  })
  previewIframes.add(frame)

  return el('div', { class: 'preview-pane' },
    el('div', { class: 'preview-header' },
      el('span', { class: 'mono muted' }, 'PREVIEW'),
      el('a', { href: baseUrl, target: '_blank', rel: 'noopener', class: 'mono' }, baseUrl + ' ↗'),
      el('button', {
        type: 'button', class: 'ghost',
        onClick: () => {
          const url = new URL(frame.dataset.previewBase, window.location.href)
          url.searchParams.set('v', String(Date.now()))
          frame.src = url.toString()
        },
      }, '↻ Reload'),
    ),
    frame,
    el('div', { class: 'preview-hint mono muted' },
      'Run ',
      el('code', {}, 'npm run dev'),
      ' in another terminal if the preview is blank.',
    ),
  )
}

function fieldListObject({ values, label, shape, summaryKey, preview, onChange }) {
  const wrap = el('div', { class: 'field wide' }, label && el('label', {}, label))
  const list = el('div', { class: 'list-object' })
  let arr = Array.isArray(values) ? values.slice() : []
  const open = new Set()

  function commit() { onChange(arr.slice()) }

  function summarize(row, idx) {
    const k = summaryKey || (shape[0] && shape[0].key)
    const raw = k ? row?.[k] : ''
    if (raw && typeof raw === 'string' && raw.trim()) return raw.trim()
    return el('em', {}, `(row ${idx + 1})`)
  }

  function redraw() {
    clear(list)
    arr.forEach((row, i) => {
      const isOpen = open.has(i)
      const head = el('div', { class: 'row-head' },
        el('span', { class: 'caret' }, isOpen ? '▾' : '▸'),
        el('span', { class: 'row-title' }, summarize(row, i)),
        el('span', { class: 'row-actions' },
          el('button', {
            type: 'button', class: 'ghost', title: 'Move up',
            onClick: (e) => { e.stopPropagation(); if (i > 0) { [arr[i-1], arr[i]] = [arr[i], arr[i-1]]; if (open.has(i)) { open.delete(i); open.add(i-1) } else if (open.has(i-1)) { open.delete(i-1); open.add(i) } commit(); redraw() } },
          }, '↑'),
          el('button', {
            type: 'button', class: 'ghost', title: 'Move down',
            onClick: (e) => { e.stopPropagation(); if (i < arr.length - 1) { [arr[i], arr[i+1]] = [arr[i+1], arr[i]]; if (open.has(i)) { open.delete(i); open.add(i+1) } else if (open.has(i+1)) { open.delete(i+1); open.add(i) } commit(); redraw() } },
          }, '↓'),
          el('button', {
            type: 'button', class: 'ghost danger', title: 'Delete',
            onClick: (e) => {
              e.stopPropagation()
              if (!confirm(`Delete row ${i + 1}?`)) return
              arr.splice(i, 1)
              const next = new Set()
              for (const k of open) {
                if (k < i) next.add(k)
                else if (k > i) next.add(k - 1)
              }
              open.clear()
              for (const k of next) open.add(k)
              commit(); redraw()
            },
          }, '✕'),
        ),
      )
      head.addEventListener('click', () => {
        if (open.has(i)) open.delete(i); else open.add(i)
        redraw()
      })

      const rowEl = el('div', { class: 'row' + (isOpen ? ' open' : '') }, head)
      if (isOpen) {
        const body = el('div', { class: 'row-body' + (preview ? ' with-preview' : '') })
        const formCol = el('div', { class: 'row-form' })
        for (const f of shape) {
          formCol.append(renderShapeField(f, row?.[f.key], (newVal) => {
            if (!arr[i] || typeof arr[i] !== 'object') arr[i] = {}
            arr[i] = { ...arr[i], [f.key]: newVal }
            commit()
            // re-render head title only if summaryKey field changed
            if (f.key === (summaryKey || shape[0]?.key)) {
              const titleEl = head.querySelector('.row-title')
              if (titleEl) {
                titleEl.textContent = ''
                const s = summarize(arr[i], i)
                titleEl.append(s instanceof Node ? s : document.createTextNode(String(s)))
              }
            }
          }))
        }
        body.append(formCol)
        if (preview) {
          const idVal = row?.[preview.idKey || 'id']
          body.append(buildPreviewPane(idVal, preview.route))
        }
        rowEl.append(body)
      }
      list.append(rowEl)
    })
    list.append(el('div', { class: 'list-object-actions' },
      el('button', {
        type: 'button',
        onClick: () => {
          const blank = {}
          for (const f of shape) {
            const isList = f.kind === 'list-string' || f.kind === 'list-object' || f.kind === 'list-image'
            blank[f.key] = isList ? [] : ''
          }
          arr.push(blank)
          open.add(arr.length - 1)
          commit(); redraw()
        },
      }, '+ Add row'),
    ))
  }
  redraw()
  wrap.append(list)
  return wrap
}

function renderShapeField(fieldDef, value, onChange) {
  const lbl = (fieldDef.label || fieldDef.key) + (fieldDef.shared ? ' · shared' : '')
  if (fieldDef.kind === 'text') return fieldText({ value, label: lbl, multiline: false, onChange })
  if (fieldDef.kind === 'textarea') return fieldText({ value, label: lbl, multiline: true, onChange })
  if (fieldDef.kind === 'list-string') return fieldListString({ values: value, label: lbl, onChange })
  if (fieldDef.kind === 'image') return fieldImage({ value, label: lbl, section: fieldDef.section, onChange })
  if (fieldDef.kind === 'list-image') return fieldListImage({ values: value, label: lbl, section: fieldDef.section, onChange })
  if (fieldDef.kind === 'list-object') {
    return fieldListObject({ values: value, label: lbl, shape: fieldDef.shape, summaryKey: fieldDef.summaryKey, preview: fieldDef.preview, onChange })
  }
  return el('div', { class: 'error' }, `Unknown kind: ${fieldDef.kind}`)
}

// ---------- Views ----------

function viewLogin(errMsg) {
  const wrap = el('div', { class: 'login' })
  let pw = ''
  let err = errMsg || null
  function doRender() {
    clear(wrap)
    const form = el('form', { class: 'login-form', autocomplete: 'off' },
      el('h1', {}, 'EverNode Admin'),
      el('p', { class: 'muted' }, 'Local-only · 127.0.0.1'),
      el('input', {
        type: 'password',
        placeholder: 'Password',
        autofocus: true,
      }),
      err ? el('div', { class: 'error' }, err) : null,
      el('button', { type: 'submit', class: 'primary' }, 'Sign in'),
    )
    const input = form.querySelector('input')
    input.addEventListener('input', () => { pw = input.value })
    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      err = null
      doRender()
      try {
        await login(pw)
        await loadAll()
      } catch (e) {
        err = e.status === 429
          ? 'Too many failed attempts — locked for 15 minutes.'
          : 'Invalid password.'
        doRender()
      }
    })
    wrap.append(form)
    setTimeout(() => input.focus(), 0)
  }
  doRender()
  return wrap
}

function viewApp() {
  const app = el('div', { class: 'app' })
  app.append(buildTopbar())
  const main = el('div', { class: 'main' })
  main.append(buildRail(), buildEditor())
  app.append(main)
  return app
}

function buildTopbar() {
  const dirty = state.dirty.en || state.dirty.id
  const last = state.gitStatus?.lastPublished
  const ahead = state.gitStatus?.ahead || 0
  const otherChanges = state.gitStatus?.otherChanges?.length || 0
  const dataChangesCount = state.gitStatus?.dataChanges?.length || 0
  const uploadChangesCount = state.gitStatus?.uploadChanges?.length || 0
  const hasPendingChanges = dataChangesCount + uploadChangesCount + ahead > 0

  const langToggle = el('div', { class: 'lang-toggle' },
    el('button', {
      class: state.lang === 'en' ? 'active' : '',
      onClick: () => { if (state.lang !== 'en') { state.lang = 'en'; renderEditor() ; renderTopbar() } },
    }, 'EN'),
    el('button', {
      class: state.lang === 'id' ? 'active' : '',
      onClick: () => { if (state.lang !== 'id') { state.lang = 'id'; renderEditor(); renderTopbar() } },
    }, 'ID'),
  )

  const dirtyLabel = state.saving
    ? el('span', { class: 'dirty' }, 'Saving…')
    : dirty
      ? el('span', { class: 'dirty' }, '● Unsaved')
      : el('span', { class: 'clean' }, 'Saved')

  const lastPubLabel = last && last.sha
    ? `Last published: ${fmtTime(last.time)} · ${last.sha}`
    : 'Last published: —'

  const publishDisabled =
    state.publishing || state.saving || dirty ||
    !hasPendingChanges || otherChanges > 0

  return el('header', { class: 'topbar' },
    el('div', { class: 'brand' }, 'EverNode Admin', el('small', {}, 'content editor')),
    langToggle,
    dirtyLabel,
    el('div', { class: 'spacer' }),
    el('span', { class: 'last-pub' }, lastPubLabel),
    el('button', { onClick: save, disabled: !dirty || state.saving || state.publishing }, state.saving ? 'Saving…' : 'Save'),
    el('button', {
      class: 'primary',
      onClick: openPublishDialog,
      disabled: publishDisabled,
      title: dirty ? 'Save first' : (otherChanges > 0 ? 'Working tree has unrelated changes' : (!hasPendingChanges ? 'Nothing to publish' : '')),
    }, state.publishing ? 'Publishing…' : 'Publish…'),
    el('button', { class: 'ghost', onClick: logout }, 'Sign out'),
  )
}

function buildRail() {
  const rail = el('aside', { class: 'rail' })
  for (const id of sectionOrder) {
    const def = sections[id]
    rail.append(el('button', {
      class: 'item' + (state.section === id ? ' active' : ''),
      onClick: () => { state.section = id; renderEditor(); renderRail() },
    }, def.title))
  }
  return rail
}

function buildEditor() {
  const editor = el('main', { class: 'editor' })
  const sectionId = state.section
  const def = sections[sectionId]
  const langContent = state.content[state.lang]
  if (!def || !langContent) return editor

  editor.append(el('h2', {}, def.title))
  editor.append(el('div', { class: 'section-meta' }, `${state.lang.toUpperCase()} · src/data/content.${state.lang}.json#${sectionId}`))

  if (def.rootKind === 'list-string') {
    const node = fieldListString({
      values: langContent[sectionId],
      label: def.rootLabel,
      onChange: (newArr) => { langContent[sectionId] = newArr; setDirty(state.lang) },
    })
    editor.append(node)
    return editor
  }

  if (typeof langContent[sectionId] !== 'object' || langContent[sectionId] === null) {
    langContent[sectionId] = {}
  }
  const obj = langContent[sectionId]

  for (const f of def.fields || []) {
    editor.append(renderShapeField(f, obj[f.key], (newVal) => {
      obj[f.key] = newVal
      setDirty(state.lang)
    }))
  }
  return editor
}

// ---------- Publish modal ----------

function openPublishDialog() {
  state.publishOpen = true
  state.publishLog = ''
  renderModal()
}
function closePublishDialog() {
  state.publishOpen = false
  renderModal()
}

function buildPublishModal() {
  if (!state.publishOpen) return null

  const dataChanges = state.gitStatus?.dataChanges || []
  const uploadChanges = state.gitStatus?.uploadChanges || []
  const otherChanges = state.gitStatus?.otherChanges || []
  const ahead = state.gitStatus?.ahead || 0
  const defaultMessage = `content: update ${fmtTime(Date.now())}`

  const messageInput = el('input', {
    type: 'text',
    value: defaultMessage,
    spellcheck: 'false',
  })

  const totalChanges = dataChanges.length + uploadChanges.length
  const fileList = el('div', { class: 'files' },
    totalChanges === 0
      ? el('div', { class: 'muted' }, ahead > 0 ? `${ahead} commit(s) ahead — ready to push.` : 'No content changes.')
      : [
          ...dataChanges.map((f) => el('div', { class: 'file' }, '✓ ' + f)),
          ...uploadChanges.map((f) => el('div', { class: 'file' }, '🖼  ' + f)),
        ],
    otherChanges.length > 0
      ? otherChanges.map((f) => el('div', { class: 'other' }, '⚠ unrelated: ' + f))
      : null,
  )

  const logBox = state.publishLog
    ? el('pre', { class: 'log' }, state.publishLog)
    : null

  const onConfirm = async () => {
    const msg = messageInput.value.trim() || defaultMessage
    const r = await publish(msg)
    renderModal()
    if (r && r.ok) {
      setTimeout(() => { closePublishDialog() }, 1200)
    }
  }

  const dialog = el('div', { class: 'modal-backdrop', onClick: (e) => { if (e.target === dialog) closePublishDialog() } },
    el('div', { class: 'modal' },
      el('header', {}, el('h3', {}, 'Publish to GitHub')),
      el('div', { class: 'body' },
        el('div', { class: 'field' },
          el('label', {}, 'Files to commit'),
          fileList,
        ),
        otherChanges.length > 0
          ? el('div', { class: 'error' }, 'Working tree has unrelated changes — publish will abort. Commit or stash them first.')
          : null,
        el('div', { class: 'field' },
          el('label', {}, 'Commit message'),
          messageInput,
        ),
        logBox,
      ),
      el('footer', {},
        el('button', { class: 'ghost', onClick: closePublishDialog, disabled: state.publishing }, 'Cancel'),
        el('button', {
          class: 'primary',
          onClick: onConfirm,
          disabled: state.publishing || otherChanges.length > 0 || (totalChanges === 0 && ahead === 0),
        }, state.publishing ? 'Publishing…' : 'Publish'),
      ),
    ),
  )
  return dialog
}

// ---------- Render driver ----------

let modalRoot = null

function render() {
  clear(root)
  if (!state.token) {
    root.append(viewLogin(state.loadError))
    return
  }
  if (!state.loggedIn) {
    if (state.loading) {
      root.append(el('div', { class: 'boot' }, 'Loading content…'))
      return
    }
    if (!state.loadError) {
      loadAll()
      root.append(el('div', { class: 'boot' }, 'Loading content…'))
      return
    }
    root.append(viewLogin(state.loadError))
    return
  }
  root.append(viewApp())
  modalRoot = el('div', { id: 'modal-root' })
  root.append(modalRoot)
  renderModal()
}

function renderTopbar() {
  if (!state.loggedIn) return
  const old = root.querySelector('.app > .topbar')
  if (!old) return render()
  old.replaceWith(buildTopbar())
}

function renderRail() {
  if (!state.loggedIn) return
  const old = root.querySelector('.app .rail')
  if (!old) return
  old.replaceWith(buildRail())
}

function renderEditor() {
  if (!state.loggedIn) return
  const old = root.querySelector('.app .editor')
  if (!old) return
  previewIframes.clear()
  old.replaceWith(buildEditor())
}

function renderModal() {
  if (!modalRoot) return
  clear(modalRoot)
  const m = buildPublishModal()
  if (m) modalRoot.append(m)
}

window.addEventListener('beforeunload', (e) => {
  if (state.dirty.en || state.dirty.id) {
    e.preventDefault()
    e.returnValue = ''
  }
})

render()
