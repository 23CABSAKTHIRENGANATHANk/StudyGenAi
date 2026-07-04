import React, { useState } from 'react'
import { apiFetch } from '../lib/api'

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [subject, setSubject] = useState('')

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    const form = new FormData()
    form.append('file', file)
    form.append('subject', subject)

    const res = await apiFetch('/api/documents/upload', {
      method: 'POST',
      body: form,
      // auth header will be attached by apiFetch
    })
    const data = await res.json()
    alert(JSON.stringify(data))
  }

  return (
    <form onSubmit={handleUpload} className="grid gap-3">
      <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject or tag" className="rounded p-2 bg-slate-800" />
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      <button className="rounded bg-violet-500 px-4 py-2">Upload</button>
    </form>
  )
}
