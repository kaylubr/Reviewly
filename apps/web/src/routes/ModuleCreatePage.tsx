import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Tag, X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router';
import { useCreateModule } from '../lib/modules';

export function ModuleCreatePage() {
  const navigate = useNavigate();
  const createModule = useCreateModule();
  const [form, setForm] = useState({ title: '', description: '', content: '', tags: [] as string[] });
  const [tagInput, setTagInput] = useState('');

  function addTag() {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !form.tags.includes(tag)) {
      setForm((previous) => ({ ...previous, tags: [...previous.tags, tag] }));
    }
    setTagInput('');
  }

  function removeTag(tag: string) {
    setForm((previous) => ({ ...previous, tags: previous.tags.filter((existing) => existing !== tag) }));
  }

  async function handleSave() {
    if (!form.title.trim()) {
      toast.error('Module title is required');
      return;
    }
    if (!form.content.trim()) {
      toast.error('Add some study content');
      return;
    }

    try {
      const result = await createModule.mutateAsync({
        title: form.title.trim(),
        description: form.description.trim(),
        content: form.content.trim(),
        tags: form.tags,
      });
      toast.success('Module created');
      navigate(`/modules/${result.module.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create module');
    }
  }

  return (
    <div className="page module-create">
      <div className="page-header">
        <button className="btn-ghost btn-sm" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={14} /> Dashboard
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1>Create a Module</h1>
        <p className="subtitle">Paste your notes and generate questions from them.</p>

        <div className="form-card">
          <div className="field">
            <label>Module Title *</label>
            <input
              className="input"
              type="text"
              placeholder="e.g. Biology Chapter 5 — Cell Division"
              value={form.title}
              onChange={(event) => setForm((previous) => ({ ...previous, title: event.target.value }))}
              maxLength={120}
            />
          </div>

          <div className="field">
            <label>Description</label>
            <input
              className="input"
              type="text"
              placeholder="Brief description (optional)"
              value={form.description}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, description: event.target.value }))
              }
            />
          </div>

          <div className="field">
            <label>Study Content</label>
            <textarea
              className="input textarea"
              placeholder="Paste your notes, lesson text, or study material here..."
              value={form.content}
              onChange={(event) => setForm((previous) => ({ ...previous, content: event.target.value }))}
              rows={8}
            />
            <p className="field-hint">{form.content.length} characters</p>
          </div>

          <div className="field">
            <label>Tags</label>
            <div className="tag-input-row">
              <input
                className="input"
                type="text"
                placeholder="Add a tag..."
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addTag();
                  }
                }}
              />
              <button type="button" className="btn-ghost btn-sm" onClick={addTag}>
                <Plus size={15} />
              </button>
            </div>
            <div className="tags-row">
              {form.tags.map((tag) => (
                <span key={tag} className="tag">
                  <Tag size={10} /> {tag}
                  <button type="button" onClick={() => removeTag(tag)}>
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <motion.button
            className="btn-primary btn-lg"
            onClick={handleSave}
            disabled={createModule.isPending}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {createModule.isPending ? (
              <>
                <span className="spinner" /> Saving...
              </>
            ) : (
              'Create Module'
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
