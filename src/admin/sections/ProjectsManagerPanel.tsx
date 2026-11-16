import { useEffect, useState } from 'react';
import { ExternalLink, Image as ImageIcon, Plus, Save, Star, Trash2, X } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import type { ProjectMedia, ProjectRecord } from '../../types/cms';
import { useToast } from '../../components/ToastProvider';
import { usePortfolioData } from '../../hooks/usePortfolioData';
import { RichTextEditor } from '../components/RichTextEditor';
import { MediaPickerModal } from '../components/MediaPickerModal';
import { SmartImage } from '../../components/SmartImage';

const EMPTY_PROJECT: Partial<ProjectRecord> = {
  title: '',
  slug: '',
  client_name: '',
  category_name: 'Social Media Management',
  short_description: '',
  overview: '',
  challenge: '',
  strategy: '',
  creative_execution: '',
  deliverables: [],
  tools_used: [],
  metrics: [],
  thumbnail_url: '',
  external_url: '',
  drive_doc_url: '',
  completion_date: new Date().toISOString().slice(0, 7),
  is_featured: true,
  is_demo: false,
  status: 'published',
  media: [],
};

export function ProjectsManagerPanel() {
  const { toast, confirm } = useToast();
  const { refreshPortfolio } = usePortfolioData();
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [categories, setCategories] = useState<string[]>([
    'Social Media Management',
    'AI Images',
    'AI Videos',
    'Graphic Design',
    'Content Strategy',
    'Automation',
  ]);
  const [editing, setEditing] = useState<Partial<ProjectRecord> | null>(null);
  const [pickerTarget, setPickerTarget] = useState<'thumbnail' | 'gallery' | null>(null);
  const [toolsInput, setToolsInput] = useState('');
  const [deliverablesInput, setDeliverablesInput] = useState('');
  const [videoEmbedInput, setVideoEmbedInput] = useState('');

  const loadProjects = async () => {
    const res = await apiRequest<{ projects: ProjectRecord[]; categories: Array<{ name: string }> }>(
      '/api/admin/projects'
    );
    setProjects(res.projects);
    if (res.categories.length > 0) {
      setCategories(res.categories.map((c) => c.name));
    }
  };

  useEffect(() => {
    void loadProjects();
  }, []);

  const openEditor = (proj?: ProjectRecord) => {
    const target = proj ? { ...proj } : { ...EMPTY_PROJECT };
    setEditing(target);
    setToolsInput((target.tools_used || []).join(', '));
    setDeliverablesInput((target.deliverables || []).join('\n'));
  };

  const handleSave = async (statusOverride?: 'draft' | 'published') => {
    if (!editing || !editing.title) {
      toast('Project title is required.', 'error');
      return;
    }

    const payload = {
      ...editing,
      status: statusOverride ?? editing.status ?? 'published',
      tools_used: toolsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      deliverables: deliverablesInput
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    };

    try {
      if (editing.id) {
        await apiRequest(`/api/admin/projects/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        toast('Project updated.');
      } else {
        await apiRequest('/api/admin/projects', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast('Project created.');
      }
      setEditing(null);
      await loadProjects();
      await refreshPortfolio();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  };

  const handleDelete = async (p: ProjectRecord) => {
    const ok = await confirm({
      title: `Delete "${p.title}"?`,
      description: 'This removes the project case study and its attached media records.',
      confirmLabel: 'Delete Project',
      destructive: true,
    });
    if (!ok) return;
    await apiRequest(`/api/admin/projects/${p.id}`, { method: 'DELETE' });
    toast('Project deleted.');
    await loadProjects();
    await refreshPortfolio();
  };

  const addMediaItem = (url: string, media_type: ProjectMedia['media_type'], caption = '') => {
    if (!editing) return;
    const current = editing.media || [];
    setEditing({
      ...editing,
      media: [
        ...current,
        {
          id: `temp-${Date.now()}`,
          project_id: editing.id || '',
          media_type,
          url,
          drive_file_id: '',
          caption,
          sort_order: current.length + 1,
        },
      ],
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#F5F8FF]">Projects &amp; Case Studies</h2>
          <p className="text-sm text-[#A9BBD3]">
            Create rich case studies with galleries, embedded videos, Google Drive decks, and featured selection.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openEditor()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2878FF] hover:bg-[#1E66E5] text-white text-xs font-semibold"
        >
          <Plus className="w-4 h-4" /> Add Project
        </button>
      </div>

      {editing ? (
        <div className="rounded-2xl border border-[#2878FF]/60 bg-[#0D2747] p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#F5F8FF]">
              {editing.id ? `Edit: ${editing.title}` : 'New Project Case Study'}
            </h3>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="p-1.5 rounded-lg text-[#A9BBD3] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#A9BBD3] mb-1">Project Title *</label>
              <input
                type="text"
                value={editing.title || ''}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2.5 text-sm text-[#F5F8FF]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#A9BBD3] mb-1">Client / Brand Name</label>
              <input
                type="text"
                value={editing.client_name || ''}
                onChange={(e) => setEditing({ ...editing, client_name: e.target.value })}
                className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2.5 text-sm text-[#F5F8FF]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#A9BBD3] mb-1">Category</label>
              <select
                value={editing.category_name || categories[0]}
                onChange={(e) => setEditing({ ...editing, category_name: e.target.value })}
                className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2.5 text-sm text-[#F5F8FF]"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#A9BBD3] mb-1">Completion Date</label>
              <input
                type="text"
                placeholder="2026-10"
                value={editing.completion_date || ''}
                onChange={(e) => setEditing({ ...editing, completion_date: e.target.value })}
                className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2.5 text-sm text-[#F5F8FF]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#A9BBD3] mb-1">External Project URL</label>
              <input
                type="url"
                placeholder="https://..."
                value={editing.external_url || ''}
                onChange={(e) => setEditing({ ...editing, external_url: e.target.value })}
                className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2.5 text-sm text-[#F5F8FF]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#A9BBD3] mb-1">
                Google Drive Case Study PDF / Deck URL
              </label>
              <input
                type="url"
                placeholder="https://drive.google.com/file/d/..."
                value={editing.drive_doc_url || ''}
                onChange={(e) => setEditing({ ...editing, drive_doc_url: e.target.value })}
                className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2.5 text-sm text-[#F5F8FF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#A9BBD3] mb-1">Featured Thumbnail</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editing.thumbnail_url || ''}
                  onChange={(e) => setEditing({ ...editing, thumbnail_url: e.target.value })}
                  className="flex-1 rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-xs text-[#F5F8FF]"
                />
                <button
                  type="button"
                  onClick={() => setPickerTarget('thumbnail')}
                  className="px-3.5 py-2 rounded-xl bg-[#2878FF]/20 border border-[#2878FF]/40 text-xs font-semibold text-[#00B8FF]"
                >
                  Choose Image
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#A9BBD3] mb-1">
                Tools Used (comma-separated)
              </label>
              <input
                type="text"
                value={toolsInput}
                onChange={(e) => setToolsInput(e.target.value)}
                placeholder="Meta Business Suite, Midjourney, CapCut"
                className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-sm text-[#F5F8FF]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A9BBD3] mb-1">Short Description</label>
            <textarea
              rows={2}
              value={editing.short_description || ''}
              onChange={(e) => setEditing({ ...editing, short_description: e.target.value })}
              className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-sm text-[#F5F8FF]"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RichTextEditor
              label="Project Overview"
              value={editing.overview || ''}
              onChange={(val) => setEditing({ ...editing, overview: val })}
            />
            <RichTextEditor
              label="Client Challenge"
              value={editing.challenge || ''}
              onChange={(val) => setEditing({ ...editing, challenge: val })}
            />
            <RichTextEditor
              label="Strategy"
              value={editing.strategy || ''}
              onChange={(val) => setEditing({ ...editing, strategy: val })}
            />
            <RichTextEditor
              label="Creative Execution"
              value={editing.creative_execution || ''}
              onChange={(val) => setEditing({ ...editing, creative_execution: val })}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-[#A9BBD3] mb-1">
                Final Deliverables (one per line)
              </label>
              <textarea
                rows={4}
                value={deliverablesInput}
                onChange={(e) => setDeliverablesInput(e.target.value)}
                className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-xs text-[#F5F8FF]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#A9BBD3]">
                  Verified Results / Metrics (Optional)
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setEditing({
                      ...editing,
                      metrics: [...(editing.metrics || []), { label: '', value: '' }],
                    })
                  }
                  className="text-xs font-semibold text-[#00B8FF]"
                >
                  + Add Metric
                </button>
              </div>
              {(editing.metrics || []).map((m, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2">
                  <input
                    type="text"
                    placeholder="Metric label"
                    value={m.label}
                    onChange={(e) => {
                      const next = [...(editing.metrics || [])];
                      next[idx] = { ...m, label: e.target.value };
                      setEditing({ ...editing, metrics: next });
                    }}
                    className="col-span-5 rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-xs text-[#F5F8FF]"
                  />
                  <input
                    type="text"
                    placeholder="Verified value"
                    value={m.value}
                    onChange={(e) => {
                      const next = [...(editing.metrics || [])];
                      next[idx] = { ...m, value: e.target.value };
                      setEditing({ ...editing, metrics: next });
                    }}
                    className="col-span-6 rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-xs text-[#F5F8FF]"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setEditing({
                        ...editing,
                        metrics: (editing.metrics || []).filter((_, i) => i !== idx),
                      })
                    }
                    className="col-span-1 flex items-center justify-center text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Project Gallery & Video Embeds */}
          <div className="pt-4 border-t border-[#24466C] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-semibold text-[#F5F8FF]">
                Project Media Gallery &amp; Embedded Videos
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPickerTarget('gallery')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#24466C] text-xs font-semibold text-[#00B8FF]"
                >
                  <ImageIcon className="w-3.5 h-3.5" /> Add Gallery Image
                </button>
                <div className="flex gap-1.5">
                  <input
                    type="url"
                    placeholder="YouTube / Vimeo / Drive video URL"
                    value={videoEmbedInput}
                    onChange={(e) => setVideoEmbedInput(e.target.value)}
                    className="rounded-lg border border-[#24466C] bg-[#06152B] px-3 py-1.5 text-xs text-[#F5F8FF]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!videoEmbedInput.trim()) return;
                      addMediaItem(videoEmbedInput.trim(), 'embed', 'Campaign Video');
                      setVideoEmbedInput('');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#2878FF] text-white text-xs font-semibold"
                  >
                    Embed Video
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(editing.media || []).map((m, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-[#24466C] bg-[#06152B] p-3 flex items-center justify-between gap-2 text-xs"
                >
                  <span className="truncate text-[#A9BBD3]">
                    [{m.media_type}] {m.caption || m.url}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setEditing({
                        ...editing,
                        media: (editing.media || []).filter((_, i) => i !== idx),
                      })
                    }
                    className="text-rose-400 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#24466C]">
            <div className="flex items-center gap-6 text-xs text-[#F5F8FF]">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(editing.is_featured)}
                  onChange={(e) => setEditing({ ...editing, is_featured: e.target.checked })}
                  className="accent-[#2878FF]"
                />
                <span>Feature on Homepage</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(editing.is_demo)}
                  onChange={(e) => setEditing({ ...editing, is_demo: e.target.checked })}
                  className="accent-[#2878FF]"
                />
                <span>Mark as Demo Sample</span>
              </label>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-xl border border-[#24466C] text-xs font-semibold text-[#A9BBD3]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSave('draft')}
                className="px-4 py-2 rounded-xl border border-[#24466C] bg-[#0B1F3A] text-xs font-semibold text-[#F5F8FF]"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={() => void handleSave('published')}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#2878FF] text-white text-xs font-semibold"
              >
                <Save className="w-3.5 h-3.5" /> Publish Project
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border border-[#24466C] bg-[#0D2747] overflow-hidden flex flex-col"
            >
              <div className="aspect-[4/3] bg-[#06152B]">
                <SmartImage src={p.thumbnail_url} alt={p.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-[#00B8FF] font-medium">{p.category_name}</span>
                    <span className={p.status === 'published' ? 'text-[#22C55E]' : 'text-amber-400'}>
                      {p.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#F5F8FF]">{p.title}</h3>
                  <p className="mt-1.5 text-xs text-[#A9BBD3] line-clamp-2">{p.short_description}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#24466C]/70">
                  <div className="flex items-center gap-2">
                    {p.is_featured && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#00B8FF]">
                        <Star className="w-3 h-3 fill-[#00B8FF]" /> Featured
                      </span>
                    )}
                    <a
                      href={`/projects/${p.slug}?preview=1`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#A9BBD3] hover:text-white"
                      title="Preview Case Study"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditor(p)}
                      className="px-3 py-1.5 rounded-lg border border-[#24466C] text-xs font-semibold text-[#F5F8FF] hover:border-[#2878FF]"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(p)}
                      className="p-1.5 rounded-lg border border-[#24466C] text-rose-400 hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <MediaPickerModal
        open={pickerTarget !== null}
        onClose={() => setPickerTarget(null)}
        onSelect={(url) => {
          if (!editing) return;
          if (pickerTarget === 'thumbnail') setEditing({ ...editing, thumbnail_url: url });
          if (pickerTarget === 'gallery') addMediaItem(url, 'image', editing.title || 'Project Image');
        }}
      />
    </div>
  );
}
