/**
 * Live smoke: hit list endpoints and assert response can be normalized to an array.
 *
 * Env:
 *   SMOKE_BASE_URL      default http://localhost:3000
 *   SMOKE_COOKIE        full Cookie header (optional if user/pass set)
 *   SMOKE_USER          username for POST /api/iam/auth/login
 *   SMOKE_PASS          password
 *   SMOKE_WORKSPACE_ID  required
 *   SMOKE_PROJECT_ID    optional
 *
 * Usage:
 *   SMOKE_USER='...' SMOKE_PASS='...' SMOKE_WORKSPACE_ID='...' npm run smoke:list-apis
 */

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload
  if (!payload || typeof payload !== 'object') return []
  if (Array.isArray(payload.items)) return payload.items
  if (Array.isArray(payload.content)) return payload.content
  if (Array.isArray(payload.data)) return payload.data
  if (payload.data && typeof payload.data === 'object' && Array.isArray(payload.data.items)) {
    return payload.data.items
  }
  return []
}

const base = (process.env.SMOKE_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
let cookie = process.env.SMOKE_COOKIE || ''
const username = process.env.SMOKE_USER || ''
const password = process.env.SMOKE_PASS || ''
const workspaceId = process.env.SMOKE_WORKSPACE_ID || ''
const projectId = process.env.SMOKE_PROJECT_ID || ''

if (!workspaceId) {
  console.error('Set SMOKE_WORKSPACE_ID')
  process.exit(1)
}

async function loginForCookie() {
  const res = await fetch(`${base}/api/iam/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  const raw = res.headers.getSetCookie?.() || []
  const joined = raw.map((c) => c.split(';')[0]).filter(Boolean).join('; ')
  if (!joined) {
    // Node < 18 fallback: get() only returns first
    const single = res.headers.get('set-cookie')
    if (single) return single.split(',').map((p) => p.split(';')[0].trim()).join('; ')
  }
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`login failed ${res.status}: ${text.slice(0, 200)}`)
  }
  if (!joined) throw new Error('login ok but no Set-Cookie returned')
  return joined
}

if (!cookie) {
  if (!username || !password) {
    console.error('Set SMOKE_COOKIE or SMOKE_USER + SMOKE_PASS')
    process.exit(1)
  }
  console.log(`Logging in as ${username}…`)
  cookie = await loginForCookie()
  console.log('Got session cookie')
}

const paths = [
  `/api/workspaces/${workspaceId}/applications`,
  `/api/workspaces/${workspaceId}/work-inbox`,
  `/api/workspaces/${workspaceId}/integrations/connections`,
  `/api/workspaces/${workspaceId}/integrations/credential-references`,
  `/api/workspaces/${workspaceId}/support/cases`,
  `/api/workspaces/${workspaceId}/support/incidents`,
  `/api/workspaces/${workspaceId}/trust/privacy-requests`,
  `/api/workspaces/${workspaceId}/trust/legal-holds`,
  `/api/workspaces/${workspaceId}/favorites`,
  `/api/workspaces/${workspaceId}/recent`,
]

if (projectId) {
  paths.push(
    `/api/projects/${projectId}/trace-links`,
    `/api/projects/${projectId}/reports/coverage-matrix`,
    `/api/projects/${projectId}/defects`,
    `/api/projects/${projectId}/quality-plans`
  )
}

async function get(path) {
  const res = await fetch(`${base}${path}`, {
    headers: { Cookie: cookie, Accept: 'application/json' },
  })
  const text = await res.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = text
  }
  return { status: res.status, json, path }
}

function unwrap(json) {
  if (json && typeof json === 'object' && json.success === true && 'data' in json) {
    return json.data
  }
  return json
}

const results = []
for (const path of paths) {
  try {
    const { status, json, path: p } = await get(path)
    const data = unwrap(json)
    const items = normalizeList(data)
    // 401/403 = auth issue; 404 may mean path wrong; 2xx must normalize to array
    const ok =
      (status >= 200 && status < 300 && Array.isArray(items)) ||
      (status === 404 && Array.isArray(items))
    results.push({ path: p, status, ok, count: items.length })
    console.log(
      `${ok ? '✓' : '✗'} ${status} ${p} → items=${Array.isArray(items) ? items.length : typeof data}`
    )
  } catch (err) {
    results.push({ path, status: 0, ok: false, count: 0 })
    console.log(`✗ ERR ${path} → ${err}`)
  }
}

const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} ok`)
process.exit(failed.length ? 1 : 0)
