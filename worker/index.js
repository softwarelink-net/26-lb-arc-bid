/**
 * Shared Cloudflare Worker stub for allworld multi-site hosting.
 * Serves Vue build from R2 path allworld-sites/26-lb-arc-bid/
 * and handles sqlite download/upload for the demo.
 */
const SITE_PATH = 'allworld-sites/26-lb-arc-bid/'

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname === '/api/db' && request.method === 'GET') {
      const obj = await env.ASSETS.get(`${SITE_PATH}db.sqlite`)
      if (!obj) return new Response('DB not found', { status: 404 })
      return new Response(obj.body, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Cache-Control': 'no-store',
        },
      })
    }

    if (url.pathname === '/api/save-db' && request.method === 'POST') {
      const body = await request.arrayBuffer()
      await env.ASSETS.put(`${SITE_PATH}db.sqlite`, body)
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (url.pathname === '/sitemap.xml') {
      const obj = await env.ASSETS.get(`${SITE_PATH}sitemap.xml`)
      if (obj) {
        return new Response(obj.body, {
          headers: { 'Content-Type': 'application/xml' },
        })
      }
    }

    let key = url.pathname.replace(/^\//, '')
    if (!key || key.endsWith('/')) key += 'index.html'
    const assetKey = `${SITE_PATH}${key}`
    let obj = await env.ASSETS.get(assetKey)
    if (!obj) {
      obj = await env.ASSETS.get(`${SITE_PATH}index.html`)
    }
    if (!obj) return new Response('Not found', { status: 404 })

    const contentType = key.endsWith('.html')
      ? 'text/html; charset=utf-8'
      : key.endsWith('.js')
        ? 'application/javascript'
        : key.endsWith('.css')
          ? 'text/css'
          : key.endsWith('.json')
            ? 'application/json'
            : key.endsWith('.svg')
              ? 'image/svg+xml'
              : 'application/octet-stream'

    return new Response(obj.body, {
      headers: { 'Content-Type': contentType },
    })
  },
}
