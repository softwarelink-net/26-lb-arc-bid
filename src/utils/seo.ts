export type SeoConfig = {
  title: string
  keywords: string
  description: string
  og: {
    type: string
    title: string
    description: string
  }
  jsonld: Record<string, unknown>
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export async function applySeoFromConfig() {
  try {
    const res = await fetch('/seo-config.json')
    if (!res.ok) return
    const seo = (await res.json()) as SeoConfig

    document.title = seo.title
    upsertMeta('name', 'keywords', seo.keywords)
    upsertMeta('name', 'description', seo.description)
    upsertMeta('property', 'og:type', seo.og.type)
    upsertMeta('property', 'og:title', seo.og.title)
    upsertMeta('property', 'og:description', seo.og.description)

    const existing = document.getElementById('seo-jsonld')
    if (existing) existing.remove()
    const script = document.createElement('script')
    script.id = 'seo-jsonld'
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(seo.jsonld)
    document.head.appendChild(script)
  } catch {
    // SEO injection is best-effort for local demos
  }
}
