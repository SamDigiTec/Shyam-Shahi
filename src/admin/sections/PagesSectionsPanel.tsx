import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { apiRequest } from '../../lib/api';
import type { PageRecord, PageSection, SectionType } from '../../types/cms';
import { useToast } from '../../components/ToastProvider';
import { usePortfolioData } from '../../hooks/usePortfolioData';
import { MediaPickerModal } from '../components/MediaPickerModal';

const SECTION_TYPES: Array<{ value: SectionType; label: string }> = [
  { value: 'hero', label: 'Hero' },
  { value: 'text_image', label: 'Text and Image' },
  { value: 'project_grid', label: 'Project Grid' },
  { value: 'image_gallery', label: 'Image Gallery' },
  { value: 'video_gallery', label: 'Video Gallery' },
  { value: 'services_grid', label: 'Services Grid' },
  { value: 'testimonials', label: 'Testimonials' },
  { value: 'statistics', label: 'Statistics / Toolkit' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'cta', label: 'CTA Banner' },
  { value: 'contact_form', label: 'Contact Form' },
];

export function PagesSectionsPanel() {
  const { toast, confirm } = useToast();
  const { refreshPortfolio } = usePortfolioData();
  const [pages, setPages] = useState<PageRecord[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [editingPage, setEditingPage] = useState<PageRecord | null>(null);
  const [editingSection, setEditingSection] = useState<PageSection | null>(null);
  const [newPageOpen, setNewPageOpen] = useState(false);
  const [newPage, setNewPage] = useState({ title: '', slug: '', seo_title: '', meta_description: '' });
  const [dragSectionId, setDragSectionId] = useState<string | null>(null);
  const [pickerFor, setPickerFor] = useState<'page' | 'section' | null>(null);

  const loadPages = async () => {
    const res = await apiRequest<{ pages: PageRecord[] }>('/api/admin/pages');
    setPages(res.pages);
    if (!selectedPageId && res.pages[0]) {
      setSelectedPageId(res.pages[0].id);
      setEditingPage(res.pages[0]);
    } else if (selectedPageId) {
      const updated = res.pages.find((p) => p.id === selectedPageId) || res.pages[0];
      if (updated) {
        setSelectedPageId(updated.id);
        setEditingPage(updated);
      }
    }
  };

  useEffect(() => {
    void loadPages();
  }, []);

  const handleSelectPage = (p: PageRecord) => {
    setSelectedPageId(p.id);
    setEditingPage(p);
    setEditingSection(null);
  };

  const handleSavePage = async (statusOverride?: 'draft' | 'published') => {
    if (!editingPage) return;
    const nextStatus = statusOverride ?? editingPage.status;
    await apiRequest(`/api/admin/pages/${editingPage.id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...editingPage, status: nextStatus }),
    });
    toast(nextStatus === 'published' ? 'Page published.' : 'Page saved as draft.');
    await loadPages();
    await refreshPortfolio();
  };

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiRequest<{ id: string }>('/api/admin/pages', {
        method: 'POST',
        body: JSON.stringify({ ...newPage, status: 'draft' }),
      });
      toast('Page created as draft.');
      setNewPageOpen(false);
      setNewPage({ title: '', slug: '', seo_title: '', meta_description: '' });
      setSelectedPageId(res.id);
      await loadPages();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  };

  const handleDeletePage = async (p: PageRecord) => {
    const ok = await confirm({
      title: `Delete "${p.title}"?`,
      description: 'This permanently deletes the page and all of its custom sections.',
      confirmLabel: 'Delete Page',
      destructive: true,
    });
    if (!ok) return;
    try {
      await apiRequest(`/api/admin/pages/${p.id}`, { method: 'DELETE' });
      toast('Page deleted.');
      setSelectedPageId(null);
      await loadPages();
      await refreshPortfolio();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  };

  const handleAddSection = async () => {
    if (!editingPage) return;
    await apiRequest('/api/admin/sections', {
      method: 'POST',
      body: JSON.stringify({
        page_id: editingPage.id,
        section_type: 'text_image',
        title: 'New Custom Section',
        subtitle: 'Section Subtitle',
        description: 'Describe your campaign strategy, process, or showcase content here.',
        status: 'published',
      }),
    });
    toast('Section added.');
    await loadPages();
    await refreshPortfolio();
  };

  const handleSaveSection = async () => {
    if (!editingSection) return;
    await apiRequest(`/api/admin/sections/${editingSection.id}`, {
      method: 'PUT',
      body: JSON.stringify(editingSection),
    });
    toast('Section updated.');
    setEditingSection(null);
    await loadPages();
    await refreshPortfolio();
  };

  const handleToggleSectionVisibility = async (sec: PageSection) => {
    await apiRequest(`/api/admin/sections/${sec.id}`, {
      method: 'PUT',
      body: JSON.stringify({ is_visible: !sec.is_visible }),
    });
    await loadPages();
    await refreshPortfolio();
  };

  const handleDuplicateSection = async (secId: string) => {
    await apiRequest(`/api/admin/sections/${secId}/duplicate`, { method: 'POST' });
    toast('Section duplicated.');
    await loadPages();
  };

  const handleDeleteSection = async (sec: PageSection) => {
    const ok = await confirm({
      title: `Delete section "${sec.title}"?`,
      description: 'You can hide sections instead if you want to keep them for later.',
      confirmLabel: 'Delete Section',
      destructive: true,
    });
    if (!ok) return;
    await apiRequest(`/api/admin/sections/${sec.id}`, { method: 'DELETE' });
    toast('Section deleted.');
    if (editingSection?.id === sec.id) setEditingSection(null);
    await loadPages();
    await refreshPortfolio();
  };

  const reorderSections = async (ordered: PageSection[]) => {
    await apiRequest('/api/admin/sections/reorder', {
      method: 'PUT',
      body: JSON.stringify({ orderedIds: ordered.map((s) => s.id) }),
    });
    await loadPages();
    await refreshPortfolio();
  };

  const handleDropSection = async (targetId: string) => {
    if (!dragSectionId || dragSectionId === targetId || !editingPage?.sections) return;
    const list = [...editingPage.sections];
    const fromIdx = list.findIndex((s) => s.id === dragSectionId);
    const toIdx = list.findIndex((s) => s.id === targetId);
    if (fromIdx < 0 || toIdx < 0) return;
    const [moved] = list.splice(fromIdx, 1);
    list.splice(toIdx, 0, moved);
    setDragSectionId(null);
    await reorderSections(list);
    toast('Section order saved.');
  };

  const moveSectionBy = async (idx: number, delta: number) => {
    if (!editingPage?.sections) return;
    const list = [...editingPage.sections];
    const target = idx + delta;
    if (target < 0 || target >= list.length) return;
    const [moved] = list.splice(idx, 1);
    list.splice(target, 0, moved);
    await reorderSections(list);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#F5F8FF]">Pages &amp; Section Builder</h2>
          <p className="text-sm text-[#A9BBD3]">
            Manage pages, SEO metadata, visibility, and drag-and-drop section order.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setNewPageOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2878FF] hover:bg-[#1E66E5] text-white text-xs font-semibold"
        >
          <Plus className="w-4 h-4" /> Create New Page
        </button>
      </div>

      {newPageOpen && (
        <form
          onSubmit={handleCreatePage}
          className="rounded-2xl border border-[#2878FF]/50 bg-[#0D2747] p-6 grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <input
            type="text"
            required
            placeholder="Page Title (e.g. Case Studies)"
            value={newPage.title}
            onChange={(e) => setNewPage({ ...newPage, title: e.target.value })}
            className="rounded-xl border border-[#24466C] bg-[#06152B] px-3.5 py-2.5 text-sm text-[#F5F8FF]"
          />
          <input
            type="text"
            required
            placeholder="URL Slug (e.g. ai-workflow)"
            value={newPage.slug}
            onChange={(e) => setNewPage({ ...newPage, slug: e.target.value })}
            className="rounded-xl border border-[#24466C] bg-[#06152B] px-3.5 py-2.5 text-sm text-[#F5F8FF]"
          />
          <input
            type="text"
            placeholder="SEO Title"
            value={newPage.seo_title}
            onChange={(e) => setNewPage({ ...newPage, seo_title: e.target.value })}
            className="rounded-xl border border-[#24466C] bg-[#06152B] px-3.5 py-2.5 text-sm text-[#F5F8FF]"
          />
          <input
            type="text"
            placeholder="Meta Description"
            value={newPage.meta_description}
            onChange={(e) => setNewPage({ ...newPage, meta_description: e.target.value })}
            className="rounded-xl border border-[#24466C] bg-[#06152B] px-3.5 py-2.5 text-sm text-[#F5F8FF]"
          />
          <div className="sm:col-span-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setNewPageOpen(false)}
              className="px-4 py-2 rounded-xl border border-[#24466C] text-xs font-semibold text-[#A9BBD3]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#2878FF] text-white text-xs font-semibold"
            >
              Create Draft Page
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pages List */}
        <div className="lg:col-span-4 space-y-2">
          {pages.map((p) => {
            const active = editingPage?.id === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPage(p)}
                className={`w-full text-left rounded-2xl border p-4 transition-colors ${
                  active
                    ? 'border-[#2878FF] bg-[#0D2747]'
                    : 'border-[#24466C] bg-[#0B1F3A] hover:border-[#2878FF]/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm text-[#F5F8FF]">{p.title}</span>
                  <span
                    className={`text-[11px] font-medium ${
                      p.status === 'published' ? 'text-[#22C55E]' : 'text-amber-400'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
                <div className="text-xs text-[#A9BBD3] mt-1 font-mono">
                  /{p.slug === 'home' ? '' : p.slug}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Page Editor & Sections */}
        {editingPage && (
          <div className="lg:col-span-8 space-y-6">
            <div className="rounded-2xl border border-[#24466C] bg-[#0D2747] p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-[#F5F8FF]">Page Settings: {editingPage.title}</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={`${editingPage.slug === 'home' ? '/' : `/${editingPage.slug}`}?preview=1`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#24466C] text-xs font-semibold text-[#00B8FF]"
                  >
                    Preview <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    type="button"
                    onClick={() => void handleSavePage('draft')}
                    className="px-3.5 py-1.5 rounded-lg border border-[#24466C] text-xs font-semibold text-[#F5F8FF]"
                  >
                    Save Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSavePage('published')}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#2878FF] text-xs font-semibold text-white"
                  >
                    <Save className="w-3.5 h-3.5" /> Publish
                  </button>
                  {!editingPage.is_system && (
                    <button
                      type="button"
                      onClick={() => void handleDeletePage(editingPage)}
                      className="p-2 rounded-lg border border-[#24466C] text-rose-400 hover:bg-rose-500/10"
                      title="Delete Page"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#A9BBD3] mb-1">Page Title</label>
                  <input
                    type="text"
                    value={editingPage.title}
                    onChange={(e) => setEditingPage({ ...editingPage, title: e.target.value })}
                    className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-sm text-[#F5F8FF]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#A9BBD3] mb-1">Slug</label>
                  <input
                    type="text"
                    disabled={editingPage.is_system}
                    value={editingPage.slug}
                    onChange={(e) => setEditingPage({ ...editingPage, slug: e.target.value })}
                    className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-sm font-mono text-[#F5F8FF] disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#A9BBD3] mb-1">SEO Title</label>
                  <input
                    type="text"
                    value={editingPage.seo_title}
                    onChange={(e) => setEditingPage({ ...editingPage, seo_title: e.target.value })}
                    className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-sm text-[#F5F8FF]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#A9BBD3] mb-1">Banner Image URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editingPage.banner_image_url}
                      onChange={(e) =>
                        setEditingPage({ ...editingPage, banner_image_url: e.target.value })
                      }
                      className="flex-1 rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-xs text-[#F5F8FF]"
                    />
                    <button
                      type="button"
                      onClick={() => setPickerFor('page')}
                      className="px-3 py-2 rounded-xl border border-[#24466C] text-xs text-[#00B8FF]"
                    >
                      Pick
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#A9BBD3] mb-1">Meta Description</label>
                <textarea
                  rows={2}
                  value={editingPage.meta_description}
                  onChange={(e) =>
                    setEditingPage({ ...editingPage, meta_description: e.target.value })
                  }
                  className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-sm text-[#F5F8FF]"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-xs text-[#F5F8FF] cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingPage.is_enabled}
                  onChange={(e) =>
                    setEditingPage({ ...editingPage, is_enabled: e.target.checked })
                  }
                  className="accent-[#2878FF]"
                />
                <span>Page Enabled on Public Website</span>
              </label>
            </div>

            {/* Drag-and-Drop Section Manager */}
            <div className="rounded-2xl border border-[#24466C] bg-[#0D2747] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-[#F5F8FF]">Page Sections</h4>
                  <p className="text-xs text-[#A9BBD3]">
                    Drag rows to reorder, toggle visibility, duplicate, or customize content.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleAddSection()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2878FF] text-white text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Section
                </button>
              </div>

              {(editingPage.sections || []).length === 0 ? (
                <p className="text-sm text-[#A9BBD3] py-4">
                  No custom sections configured for this page yet. Click "Add Section" to build one.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {(editingPage.sections || []).map((sec, idx) => (
                    <div
                      key={sec.id}
                      draggable
                      onDragStart={() => setDragSectionId(sec.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => void handleDropSection(sec.id)}
                      className="rounded-xl border border-[#24466C] bg-[#06152B] p-3.5 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <GripVertical className="w-4 h-4 text-[#A9BBD3] cursor-grab shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[#F5F8FF] truncate">
                            {sec.title || 'Untitled Section'}
                          </div>
                          <div className="text-xs text-[#00B8FF] font-mono">
                            {sec.section_type} · {sec.is_visible ? 'Visible' : 'Hidden'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => void moveSectionBy(idx, -1)}
                          className="p-1.5 rounded-lg border border-[#24466C] text-[#A9BBD3] hover:text-white"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void moveSectionBy(idx, 1)}
                          className="p-1.5 rounded-lg border border-[#24466C] text-[#A9BBD3] hover:text-white"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleToggleSectionVisibility(sec)}
                          className="p-1.5 rounded-lg border border-[#24466C] text-[#A9BBD3] hover:text-white"
                          title={sec.is_visible ? 'Hide Section' : 'Show Section'}
                        >
                          {sec.is_visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDuplicateSection(sec.id)}
                          className="p-1.5 rounded-lg border border-[#24466C] text-[#A9BBD3] hover:text-white"
                          title="Duplicate Section"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingSection(sec)}
                          className="px-2.5 py-1.5 rounded-lg border border-[#2878FF]/40 text-xs font-semibold text-[#00B8FF]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteSection(sec)}
                          className="p-1.5 rounded-lg border border-[#24466C] text-rose-400 hover:bg-rose-500/10"
                          title="Delete Section"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Section Detail Editor Drawer */}
              {editingSection && (
                <div className="mt-4 rounded-xl border border-[#2878FF] bg-[#0B1F3A] p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-bold text-[#F5F8FF]">Edit Section</h5>
                    <button
                      type="button"
                      onClick={() => setEditingSection(null)}
                      className="text-xs text-[#A9BBD3] hover:text-white"
                    >
                      Close
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-[#A9BBD3] mb-1">Section Type</label>
                      <select
                        value={editingSection.section_type}
                        onChange={(e) =>
                          setEditingSection({
                            ...editingSection,
                            section_type: e.target.value as SectionType,
                          })
                        }
                        className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-xs text-[#F5F8FF]"
                      >
                        {SECTION_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-[#A9BBD3] mb-1">Text Alignment</label>
                      <select
                        value={editingSection.text_alignment}
                        onChange={(e) =>
                          setEditingSection({
                            ...editingSection,
                            text_alignment: e.target.value as 'left' | 'center' | 'right',
                          })
                        }
                        className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-xs text-[#F5F8FF]"
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-[#A9BBD3] mb-1">Title</label>
                      <input
                        type="text"
                        value={editingSection.title}
                        onChange={(e) =>
                          setEditingSection({ ...editingSection, title: e.target.value })
                        }
                        className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-xs text-[#F5F8FF]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#A9BBD3] mb-1">Subtitle</label>
                      <input
                        type="text"
                        value={editingSection.subtitle}
                        onChange={(e) =>
                          setEditingSection({ ...editingSection, subtitle: e.target.value })
                        }
                        className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-xs text-[#F5F8FF]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#A9BBD3] mb-1">CTA Label</label>
                      <input
                        type="text"
                        value={editingSection.cta_label}
                        onChange={(e) =>
                          setEditingSection({ ...editingSection, cta_label: e.target.value })
                        }
                        className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-xs text-[#F5F8FF]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#A9BBD3] mb-1">CTA URL</label>
                      <input
                        type="text"
                        value={editingSection.cta_url}
                        onChange={(e) =>
                          setEditingSection({ ...editingSection, cta_url: e.target.value })
                        }
                        className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-xs text-[#F5F8FF]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#A9BBD3] mb-1">Section Image URL</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editingSection.image_url}
                          onChange={(e) =>
                            setEditingSection({ ...editingSection, image_url: e.target.value })
                          }
                          className="flex-1 rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-xs text-[#F5F8FF]"
                        />
                        <button
                          type="button"
                          onClick={() => setPickerFor('section')}
                          className="px-3 py-2 rounded-xl border border-[#24466C] text-xs text-[#00B8FF]"
                        >
                          Pick
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-[#A9BBD3] mb-1">Background Color</label>
                      <input
                        type="text"
                        value={editingSection.background_color}
                        onChange={(e) =>
                          setEditingSection({ ...editingSection, background_color: e.target.value })
                        }
                        className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-xs font-mono text-[#F5F8FF]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-[#A9BBD3] mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={editingSection.description}
                      onChange={(e) =>
                        setEditingSection({ ...editingSection, description: e.target.value })
                      }
                      className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-xs text-[#F5F8FF]"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => void handleSaveSection()}
                      className="px-4 py-2 rounded-xl bg-[#2878FF] text-white text-xs font-semibold"
                    >
                      Save Section
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <MediaPickerModal
        open={pickerFor !== null}
        onClose={() => setPickerFor(null)}
        onSelect={(url) => {
          if (pickerFor === 'page' && editingPage) {
            setEditingPage({ ...editingPage, banner_image_url: url });
          }
          if (pickerFor === 'section' && editingSection) {
            setEditingSection({ ...editingSection, image_url: url });
          }
        }}
      />
    </div>
  );
}
