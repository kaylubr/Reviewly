import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Check, Plus, Sparkles, Tag, Upload, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router';
import { useCreateModule, useExtractDocument, useGenerateQuestions } from '../lib/modules';

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

const GENERATION_STEPS = [
  'Reading content',
  'Identifying key concepts',
  'Crafting flashcards',
  'Building quiz questions',
];

type Step = 'form' | 'generating' | 'done';

export function ModuleCreatePage() {
  const navigate = useNavigate();
  const createModule = useCreateModule();
  const extractDocument = useExtractDocument();
  const generateQuestions = useGenerateQuestions();

  const [step, setStep] = useState<Step>('form');
  const [createdModuleId, setCreatedModuleId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', content: '', tags: [] as string[] });
  const [tagInput, setTagInput] = useState('');

  const onDrop = useCallback(
    async (accepted: File[], rejections: FileRejection[]) => {
      const rejection = rejections[0];

      if (rejection) {
        const codes = rejection.errors.map((error) => error.code);
        toast.error(
          codes.includes('file-too-large')
            ? 'File is too large. Maximum 20 MB allowed.'
            : (rejection.errors[0]?.message ?? 'File not accepted'),
        );
        return;
      }

      const file = accepted[0];

      if (!file) {
        return;
      }

      try {
        const extracted = await extractDocument.mutateAsync(file);
        setForm((previous) => ({ ...previous, content: extracted.text }));
        toast.success(`Extracted ${extracted.characters.toLocaleString()} characters from ${file.name}`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Could not read that file');
      }
    },
    [extractDocument],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'] },
    maxFiles: 1,
    maxSize: MAX_UPLOAD_BYTES,
    disabled: extractDocument.isPending,
  });

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
      toast.error('Paste some study content, or upload a document');
      return;
    }

    let moduleId: string;

    try {
      const created = await createModule.mutateAsync({
        title: form.title.trim(),
        description: form.description.trim(),
        content: form.content.trim(),
        tags: form.tags,
      });
      moduleId = created.module.id;
      setCreatedModuleId(moduleId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create module');
      return;
    }

    setStep('generating');

    try {
      const result = await generateQuestions.mutateAsync(moduleId);
      setStep('done');
      toast.success(
        `Generated ${result.flashcardCount} flashcards and ${result.questionCount} questions`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? `${error.message} The module was saved — you can retry from its page.`
          : 'Generation failed. The module was saved — you can retry from its page.',
      );
      navigate(`/modules/${moduleId}`);
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
        {step === 'form' && (
          <motion.div key="form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <h1>Create a Module</h1>
            <p className="subtitle">
              Paste your notes or upload a document, and AI will generate questions from them.
            </p>

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
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, content: event.target.value }))
                  }
                  rows={8}
                />
                <p className="field-hint">{form.content.length} characters</p>
              </div>

              <div className="field">
                <label>Or Upload a Document</label>
                <div
                  {...getRootProps()}
                  className={`dropzone ${isDragActive ? 'active' : ''} ${
                    extractDocument.isPending ? 'has-file' : ''
                  }`}
                >
                  <input {...getInputProps()} />
                  {extractDocument.isPending ? (
                    <div className="dropzone-inner">
                      <span className="spinner" />
                      <p>Reading your document...</p>
                    </div>
                  ) : (
                    <div className="dropzone-inner">
                      <Upload size={22} />
                      <p>
                        Drop a PDF or TXT, or <span>browse</span>
                      </p>
                      <small>Max 20 MB — its text replaces the field above</small>
                    </div>
                  )}
                </div>
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
                disabled={createModule.isPending || extractDocument.isPending}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {createModule.isPending ? (
                  <>
                    <span className="spinner" /> Saving...
                  </>
                ) : (
                  <>
                    <Sparkles size={17} /> Create &amp; Generate AI Questions
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}

        {step === 'generating' && (
          <motion.div
            key="generating"
            className="generating-screen"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="gen-spinner" />
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>
              AI is analyzing your content...
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>Generating flashcards and quiz questions</p>
            <div className="generating-steps">
              {GENERATION_STEPS.map((label, index) => (
                <motion.div
                  key={label}
                  className="gen-step"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.45 }}
                >
                  <span className="gen-dot" /> {label}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'done' && (
          <motion.div
            key="done"
            className="done-screen"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <motion.div
              className="done-check"
              animate={{ scale: [0.9, 1.08, 1] }}
              transition={{ duration: 0.5 }}
            >
              <Check size={36} strokeWidth={2.5} />
            </motion.div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>Module ready!</h2>
            <p style={{ color: 'var(--text-muted)' }}>Your AI-generated study materials are ready.</p>
            <div className="done-buttons">
              <button className="btn-primary" onClick={() => navigate(`/modules/${createdModuleId}`)}>
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
  );
}
