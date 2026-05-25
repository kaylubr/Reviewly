import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X, Sparkles, ArrowLeft, Tag, Plus, Check } from 'lucide-react'
import { insforge } from '../lib/insforge'
import { apiRequest } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const GEN_STEPS = [
  'Reading content',
  'Identifying key concepts',
  'Crafting flashcards',
  'Building quiz questions',
]

export default function ModuleCreate() {
  const navigate = useNavigate()
  const { user, token } = useAuth()
  const [form, setForm] = useState({ title: '', description: '', content: '', tags: [] })
  const [tagInput, setTagInput] = useState('')
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [moduleId, setModuleId] = useState(null)
  const [step, setStep] = useState('create') // 'create' | 'generating' | 'done'

  const onDrop = useCallback(accepted => { if (accepted[0]) setFile(accepted[0]) }, [])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'] },
    maxFiles: 1, maxSize: 20 * 1024 * 1024,
  })

  function addTag() {
    const t = tagInput.trim().toLowerCase()
    if (t && !form.tags.includes(t)) setForm(f => ({ ...f, tags: [...f.tags, t] }))
    setTagInput('')
  }
  function removeTag(tag) { setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) })) }

  async function handleSave() {
    if (!form.title.trim()) { toast.error('Module title is required'); return }
    if (!form.content.trim() && !file) { toast.error('Add some content or upload a file'); return }
    setSaving(true)
    try {
      let fileUrl = null
      if (file) {
        setUploading(true)
        const ext = file.name.split('.').pop()
        const path = `${user.id}/${Date.now()}.${ext}`
        const { data: storageData, error: storageErr } = await insforge.storage.from('modules').upload(path, file)
        setUploading(false)
        if (storageErr) throw storageErr
        fileUrl = insforge.storage.from('modules').getPublicUrl(storageData?.key || path) || null
      }

      const { data: mod, error } = await insforge.database
        .from('modules')
        .insert([{ user_id: user.id, title: form.title.trim(), description: form.description.trim(), content: form.content.trim(), file_url: fileUrl, tags: form.tags }])
        .select().single()
      if (error) throw error

      setModuleId(mod.id)
      setStep('generating')
      setSaving(false)

      const result = await apiRequest(`/api/modules/${mod.id}/generate`, { method: 'POST' }, token)
      setStep('done')
      toast.success(`Generated ${result.flashcards_count} flashcards & ${result.mcq_count} questions!`)
    } catch (err) {
      toast.error(err.message || 'Failed to create module')
      setSaving(false); setStep('create')
    }
  }

  return (
    <div className="page module-create">
      <div className="page-header">
        <button className="btn-ghost btn-sm" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={14} /> Dashboard
        </button>
      </div>

      <AnimatePresence mode="wait">
        {step === 'create' && (
          <motion.div key="create" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <h1>Create a Module</h1>
            <p className="subtitle">Upload your notes or paste content — AI will generate questions for you.</p>

            <div className="form-card">
              <div className="field">
                <label>Module Title *</label>
                <input className="input" type="text"
                  placeholder="e.g. Biology Chapter 5 — Cell Division"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  maxLength={120} />
              </div>

              <div className="field">
                <label>Description</label>
                <input className="input" type="text"
                  placeholder="Brief description (optional)"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>

              <div className="field">
                <label>Study Content</label>
                <textarea className="input textarea"
                  placeholder="Paste your notes, lesson text, or study material here..."
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  rows={8} />
                <p className="field-hint">{form.content.length} characters</p>
              </div>

              <div className="field">
                <label>Or Upload a File</label>
                <div {...getRootProps()}
                  className={`dropzone ${isDragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}>
                  <input {...getInputProps()} />
                  {file ? (
                    <div className="file-preview">
                      <FileText size={18} />
                      <span>{file.name}</span>
                      <button type="button" onClick={e => { e.stopPropagation(); setFile(null) }}>
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <div className="dropzone-inner">
                      <Upload size={22} />
                      <p>Drop a PDF or TXT, or <span>browse</span></p>
                      <small>Max 20 MB</small>
                    </div>
                  )}
                </div>
              </div>

              <div className="field">
                <label>Tags</label>
                <div className="tag-input-row">
                  <input className="input" type="text" placeholder="Add a tag..."
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} />
                  <button type="button" className="btn-ghost btn-sm" onClick={addTag}>
                    <Plus size={15} />
                  </button>
                </div>
                <div className="tags-row">
                  {form.tags.map(t => (
                    <span key={t} className="tag">
                      <Tag size={10} /> {t}
                      <button type="button" onClick={() => removeTag(t)}><X size={10} /></button>
                    </span>
                  ))}
                </div>
              </div>

              <motion.button className="btn-primary btn-lg" onClick={handleSave}
                disabled={saving || uploading}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                {saving || uploading
                  ? <><span className="spinner" /> {uploading ? 'Uploading...' : 'Saving...'}</>
                  : <><Sparkles size={17} /> Create & Generate AI Questions</>}
              </motion.button>
            </div>
          </motion.div>
        )}

        {step === 'generating' && (
          <motion.div key="generating" className="generating-screen"
            initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <div className="gen-spinner" />
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>AI is analyzing your content...</h2>
            <p style={{ color: 'var(--text-muted)' }}>Generating flashcards and quiz questions</p>
            <div className="generating-steps">
              {GEN_STEPS.map((s, i) => (
                <motion.div key={s} className="gen-step"
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.45 }}>
                  <span className="gen-dot" />
                  {s}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'done' && (
          <motion.div key="done" className="done-screen"
            initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}>
            <motion.div className="done-check"
              animate={{ scale: [0.9, 1.08, 1] }} transition={{ duration: 0.5 }}>
              <Check size={36} strokeWidth={2.5} />
            </motion.div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>Module ready!</h2>
            <p style={{ color: 'var(--text-muted)' }}>Your AI-generated study materials are ready.</p>
            <div className="done-buttons">
              <button className="btn-primary" onClick={() => navigate(`/modules/${moduleId}`)}>
                Start Studying
              </button>
              <button className="btn-ghost" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}