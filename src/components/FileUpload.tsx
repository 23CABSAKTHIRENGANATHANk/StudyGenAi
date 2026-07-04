import React, { useRef, useState } from 'react'
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react'
import { apiFetch } from '../lib/api'

interface FileUploadProps {
  onSuccess?: () => void;
}

export default function FileUpload({ onSuccess }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [subject, setSubject] = useState('')
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const chosen = e.target.files?.[0] ?? null
    setFile(chosen)
    setStatus('idle')
    setMessage('')
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const dropped = e.dataTransfer.files?.[0]
    if (dropped) {
      setFile(dropped)
      setStatus('idle')
      setMessage('')
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return

    setStatus('uploading')
    setMessage('')
    try {
      const form = new FormData()
      form.append('file', file)
      if (subject.trim()) form.append('subject', subject.trim())

      const res = await apiFetch('/api/documents/upload', { method: 'POST', body: form })
      const data = await res.json()

      if (!res.ok) {
        setStatus('error')
        setMessage(data.detail || 'Upload failed. Please try again.')
      } else {
        setStatus('success')
        setMessage(`"${file.name}" uploaded and processed successfully.`)
        setFile(null)
        setSubject('')
        if (inputRef.current) inputRef.current.value = ''
        onSuccess?.()
      }
    } catch {
      setStatus('error')
      setMessage('Network error. Please check your connection.')
    }
  }

  return (
    <form onSubmit={handleUpload} className="space-y-4">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center gap-3 rounded-[24px] border-2 border-dashed border-white/10 bg-slate-950/50 p-8 text-center transition hover:border-violet-400/40 hover:bg-white/5"
      >
        <Upload className="h-8 w-8 text-violet-400" />
        {file ? (
          <div className="flex items-center gap-2 text-slate-200">
            <FileText className="h-4 w-4 text-violet-400" />
            <span className="text-sm font-medium">{file.name}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setFile(null); if (inputRef.current) inputRef.current.value = '' }}
              className="ml-1 text-slate-500 hover:text-slate-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm font-medium text-slate-200">Drop a file here or click to browse</p>
            <p className="text-xs text-slate-500">PDF, DOCX, or PPTX — max 20 MB</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.pptx,.txt"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Subject input */}
      <input
        type="text"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Subject or tag (optional — e.g. Chemistry, Week 3)"
        className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-400/60"
      />

      {/* Status messages */}
      {status === 'success' && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          <CheckCircle className="h-4 w-4 shrink-0" />
          {message}
        </div>
      )}
      {status === 'error' && (
        <div className="flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {message}
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={!file || status === 'uploading'}
        className="flex w-full items-center justify-center gap-2 rounded-3xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === 'uploading' ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Processing…
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            Upload & Process
          </>
        )}
      </button>
    </form>
  )
}
