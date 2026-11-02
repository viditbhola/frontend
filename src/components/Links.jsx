import { Button, inputClass } from './ui'

export const MAX_LINKS = 10
const isHttp = (url) => /^https?:\/\/\S+$/i.test(url)

// Drops blank rows so the form can hold an empty "add a link" row without sending it.
export const cleanLinks = (links) =>
  links
    .map((l) => ({ label: l.label.trim(), url: l.url.trim() }))
    .filter((l) => l.url !== '')

export const linksValid = (links) => cleanLinks(links).every((l) => isHttp(l.url))

export function LinksEditor({ links, onChange }) {
  const update = (index, key, value) =>
    onChange(links.map((l, i) => (i === index ? { ...l, [key]: value } : l)))
  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-slate-700">Links (optional)</span>
      {links.map((l, i) => (
        <div key={i} className="flex gap-2">
          <input
            className={`${inputClass} w-1/3`}
            placeholder="Label"
            maxLength={100}
            value={l.label}
            onChange={(e) => update(i, 'label', e.target.value)}
          />
          <input
            className={`${inputClass} flex-1 ${l.url && !isHttp(l.url.trim()) ? 'border-red-400' : ''}`}
            placeholder="https://…"
            maxLength={2000}
            value={l.url}
            onChange={(e) => update(i, 'url', e.target.value)}
          />
          <Button type="button" variant="ghost" onClick={() => onChange(links.filter((_, j) => j !== i))}>
            ✕
          </Button>
        </div>
      ))}
      {links.length < MAX_LINKS && (
        <Button type="button" variant="ghost" onClick={() => onChange([...links, { label: '', url: '' }])}>
          + Add link
        </Button>
      )}
      {!linksValid(links) && <p className="text-xs text-red-600">Links must start with http:// or https://</p>}
    </div>
  )
}

export function LinkList({ links }) {
  const safe = (links ?? []).filter((l) => isHttp(l.url))
  if (!safe.length) return null
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
      {safe.map((l, i) => (
        <li key={i}>
          <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">
            {l.label || l.url}
          </a>
        </li>
      ))}
    </ul>
  )
}
