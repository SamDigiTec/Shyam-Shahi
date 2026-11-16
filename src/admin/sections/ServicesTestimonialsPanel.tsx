import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Save, Star, Trash2, X } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import type { ServiceRecord, TestimonialRecord } from '../../types/cms';
import { useToast } from '../../components/ToastProvider';
import { usePortfolioData } from '../../hooks/usePortfolioData';
import { MediaPickerModal } from '../components/MediaPickerModal';

export function ServicesManagerPanel() {
  const { toast, confirm } = useToast();
  const { refreshPortfolio } = usePortfolioData();
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [editing, setEditing] = useState<Partial<ServiceRecord> | null>(null);
  const [featuresText, setFeaturesText] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);

  const loadServices = async () => {
    const res = await apiRequest<{ services: ServiceRecord[] }>('/api/admin/services');
    setServices(res.services);
  };

  useEffect(() => {
    void loadServices();
  }, []);

  const openEditor = (s?: ServiceRecord) => {
    const target: Partial<ServiceRecord> = s
      ? { ...s }
      : {
          title: '',
          short_description: '',
          full_description: '',
          icon_name: 'Sparkles',
          image_url: '',
          cta_label: 'Discuss This Service',
          cta_url: '/contact',
          is_featured: true,
          status: 'published',
        };
    setEditing(target);
    setFeaturesText((s?.features || []).map((f) => f.feature_text).join('\n'));
  };

  const handleSave = async (statusOverride?: 'draft' | 'published') => {
    if (!editing || !editing.title) {
      toast('Service title is required.', 'error');
      return;
    }
    const payload = {
      ...editing,
      status: statusOverride ?? editing.status ?? 'published',
      features: featuresText
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean),
    };
    if (editing.id) {
      await apiRequest(`/api/admin/services/${editing.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      toast('Service updated.');
    } else {
      await apiRequest('/api/admin/services', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      toast('Service created.');
    }
    setEditing(null);
    await loadServices();
    await refreshPortfolio();
  };

  const moveService = async (idx: number, delta: number) => {
    const target = idx + delta;
    if (target < 0 || target >= services.length) return;
    const copy = [...services];
    const [item] = copy.splice(idx, 1);
    copy.splice(target, 0, item);
    for (let i = 0; i < copy.length; i++) {
      await apiRequest(`/api/admin/services/${copy[i].id}`, {
        method: 'PUT',
        body: JSON.stringify({ sort_order: i + 1 }),
      });
    }
    await loadServices();
    await refreshPortfolio();
  };

  const handleDelete = async (s: ServiceRecord) => {
    const ok = await confirm({
      title: `Delete "${s.title}"?`,
      description: 'This permanently deletes this service record.',
      confirmLabel: 'Delete Service',
      destructive: true,
    });
    if (!ok) return;
    await apiRequest(`/api/admin/services/${s.id}`, { method: 'DELETE' });
    toast('Service deleted.');
    await loadServices();
    await refreshPortfolio();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#F5F8FF]">Services Manager</h2>
          <p className="text-sm text-[#A9BBD3]">
            Add, edit, reorder, or unpublish service offerings and deliverables.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openEditor()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2878FF] text-white text-xs font-semibold"
        >
          <Plus className="w-4 h-4" /> Add Service
        </button>
      </div>

      {editing && (
        <div className="rounded-2xl border border-[#2878FF]/60 bg-[#0D2747] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#F5F8FF]">
              {editing.id ? `Edit: ${editing.title}` : 'New Service'}
            </h3>
            <button type="button" onClick={() => setEditing(null)} className="text-[#A9BBD3]">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#A9BBD3] mb-1">Service Title *</label>
              <input
                type="text"
                value={editing.title || ''}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-sm text-[#F5F8FF]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#A9BBD3] mb-1">Icon Name</label>
              <select
                value={editing.icon_name || 'Sparkles'}
                onChange={(e) => setEditing({ ...editing, icon_name: e.target.value })}
                className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-sm text-[#F5F8FF]"
              >
                <option value="Share2">Social / Share2</option>
                <option value="Sparkles">AI / Sparkles</option>
                <option value="Palette">Design / Palette</option>
                <option value="MessageSquareCode">WhatsApp Automation</option>
                <option value="Compass">Strategy / Compass</option>
                <option value="Megaphone">Ads / Megaphone</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#A9BBD3] mb-1">CTA Label</label>
              <input
                type="text"
                value={editing.cta_label || ''}
                onChange={(e) => setEditing({ ...editing, cta_label: e.target.value })}
                className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-sm text-[#F5F8FF]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#A9BBD3] mb-1">CTA URL</label>
              <input
                type="text"
                value={editing.cta_url || ''}
                onChange={(e) => setEditing({ ...editing, cta_url: e.target.value })}
                className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-sm text-[#F5F8FF]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#A9BBD3] mb-1">Showcase Image</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={editing.image_url || ''}
                onChange={(e) => setEditing({ ...editing, image_url: e.target.value })}
                className="flex-1 rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-xs text-[#F5F8FF]"
              />
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="px-3.5 py-2 rounded-xl border border-[#24466C] text-xs text-[#00B8FF]"
              >
                Pick Image
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#A9BBD3] mb-1">Short Description</label>
            <textarea
              rows={2}
              value={editing.short_description || ''}
              onChange={(e) => setEditing({ ...editing, short_description: e.target.value })}
              className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-sm text-[#F5F8FF]"
            />
          </div>

          <div>
            <label className="block text-xs text-[#A9BBD3] mb-1">Full Description</label>
            <textarea
              rows={3}
              value={editing.full_description || ''}
              onChange={(e) => setEditing({ ...editing, full_description: e.target.value })}
              className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-sm text-[#F5F8FF]"
            />
          </div>

          <div>
            <label className="block text-xs text-[#A9BBD3] mb-1">Service Features (one per line)</label>
            <textarea
              rows={5}
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-xs text-[#F5F8FF]"
            />
          </div>

          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => void handleSave('draft')}
              className="px-4 py-2 rounded-xl border border-[#24466C] text-xs font-semibold text-[#F5F8FF]"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={() => void handleSave('published')}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#2878FF] text-white text-xs font-semibold"
            >
              <Save className="w-3.5 h-3.5" /> Publish Service
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {services.map((s, idx) => (
          <div
            key={s.id}
            className="rounded-2xl border border-[#24466C] bg-[#0D2747] p-5 flex flex-wrap items-center justify-between gap-4"
          >
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-xs mb-1">
                <span className="font-mono text-[#00B8FF]">0{idx + 1}</span>
                <span className={s.status === 'published' ? 'text-[#22C55E]' : 'text-amber-400'}>
                  {s.status}
                </span>
              </div>
              <h3 className="text-base font-bold text-[#F5F8FF]">{s.title}</h3>
              <p className="text-xs text-[#A9BBD3] mt-1">{s.short_description}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void moveService(idx, -1)}
                className="p-2 rounded-lg border border-[#24466C] text-[#A9BBD3] hover:text-white"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => void moveService(idx, 1)}
                className="p-2 rounded-lg border border-[#24466C] text-[#A9BBD3] hover:text-white"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => openEditor(s)}
                className="px-3 py-1.5 rounded-lg border border-[#24466C] text-xs font-semibold text-[#F5F8FF]"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(s)}
                className="p-2 rounded-lg border border-[#24466C] text-rose-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => editing && setEditing({ ...editing, image_url: url })}
      />
    </div>
  );
}

export function TestimonialsManagerPanel() {
  const { toast, confirm } = useToast();
  const { refreshPortfolio } = usePortfolioData();
  const [items, setItems] = useState<TestimonialRecord[]>([]);
  const [editing, setEditing] = useState<Partial<TestimonialRecord> | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const load = async () => {
    const res = await apiRequest<{ testimonials: TestimonialRecord[] }>('/api/admin/testimonials');
    setItems(res.testimonials);
  };

  useEffect(() => {
    void load();
  }, []);

  const handleSave = async () => {
    if (!editing || !editing.client_name || !editing.review) {
      toast('Client name and review text are required.', 'error');
      return;
    }
    if (editing.id) {
      await apiRequest(`/api/admin/testimonials/${editing.id}`, {
        method: 'PUT',
        body: JSON.stringify(editing),
      });
      toast('Testimonial updated.');
    } else {
      await apiRequest('/api/admin/testimonials', {
        method: 'POST',
        body: JSON.stringify(editing),
      });
      toast('Testimonial added.');
    }
    setEditing(null);
    await load();
    await refreshPortfolio();
  };

  const handleDelete = async (t: TestimonialRecord) => {
    const ok = await confirm({
      title: `Delete review from "${t.client_name}"?`,
      description: 'This removes the testimonial from the database.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    await apiRequest(`/api/admin/testimonials/${t.id}`, { method: 'DELETE' });
    toast('Testimonial deleted.');
    await load();
    await refreshPortfolio();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#F5F8FF]">Testimonials Manager</h2>
          <p className="text-sm text-[#A9BBD3]">
            Replace demo placeholder reviews with authentic client testimonials and portraits.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            setEditing({
              client_name: '',
              designation: '',
              company: '',
              photo_url: '',
              review: '',
              rating: 5,
              is_featured: true,
              is_placeholder: false,
              status: 'published',
            })
          }
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2878FF] text-white text-xs font-semibold"
        >
          <Plus className="w-4 h-4" /> Add Testimonial
        </button>
      </div>

      {editing && (
        <div className="rounded-2xl border border-[#2878FF]/60 bg-[#0D2747] p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Client Name *"
              value={editing.client_name || ''}
              onChange={(e) => setEditing({ ...editing, client_name: e.target.value })}
              className="rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-sm text-[#F5F8FF]"
            />
            <input
              type="text"
              placeholder="Designation"
              value={editing.designation || ''}
              onChange={(e) => setEditing({ ...editing, designation: e.target.value })}
              className="rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-sm text-[#F5F8FF]"
            />
            <input
              type="text"
              placeholder="Company"
              value={editing.company || ''}
              onChange={(e) => setEditing({ ...editing, company: e.target.value })}
              className="rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-sm text-[#F5F8FF]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Client Photo URL"
                value={editing.photo_url || ''}
                onChange={(e) => setEditing({ ...editing, photo_url: e.target.value })}
                className="flex-1 rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-xs text-[#F5F8FF]"
              />
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="px-3 py-2 rounded-xl border border-[#24466C] text-xs text-[#00B8FF]"
              >
                Pick Photo
              </button>
            </div>
            <div className="flex items-center gap-4">
              <label className="text-xs text-[#A9BBD3]">Rating:</label>
              <select
                value={editing.rating ?? 5}
                onChange={(e) => setEditing({ ...editing, rating: Number(e.target.value) })}
                className="rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-xs text-[#F5F8FF]"
              >
                {[5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={r}>
                    {r} Stars
                  </option>
                ))}
              </select>
              <label className="inline-flex items-center gap-2 text-xs text-[#F5F8FF] cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(editing.is_placeholder)}
                  onChange={(e) => setEditing({ ...editing, is_placeholder: e.target.checked })}
                  className="accent-[#2878FF]"
                />
                <span>Demo Placeholder</span>
              </label>
            </div>
          </div>

          <textarea
            rows={3}
            placeholder="Client Review *"
            value={editing.review || ''}
            onChange={(e) => setEditing({ ...editing, review: e.target.value })}
            className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-sm text-[#F5F8FF]"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="px-4 py-2 rounded-xl border border-[#24466C] text-xs text-[#A9BBD3]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              className="px-5 py-2 rounded-xl bg-[#2878FF] text-white text-xs font-semibold"
            >
              Save Testimonial
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((t) => (
          <div key={t.id} className="rounded-2xl border border-[#24466C] bg-[#0D2747] p-5 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-sm text-[#F5F8FF]">{t.client_name}</h3>
                <p className="text-xs text-[#A9BBD3]">
                  {t.designation} · {t.company}
                  {t.is_placeholder && ' (Placeholder)'}
                </p>
              </div>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 text-[#00B8FF] fill-[#00B8FF]" />
                ))}
              </div>
            </div>
            <p className="text-xs text-[#A9BBD3] leading-relaxed">“{t.review}”</p>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#24466C]/60">
              <button
                type="button"
                onClick={() => setEditing(t)}
                className="px-3 py-1.5 rounded-lg border border-[#24466C] text-xs font-semibold text-[#F5F8FF]"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(t)}
                className="p-1.5 rounded-lg border border-[#24466C] text-rose-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => editing && setEditing({ ...editing, photo_url: url })}
      />
    </div>
  );
}
