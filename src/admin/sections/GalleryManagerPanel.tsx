import React, { useEffect, useState } from 'react';
import { Plus, Save, Trash2, Upload, X } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import type { GalleryItem, MediaAsset } from '../../types/cms';
import { useToast } from '../../components/ToastProvider';
import { usePortfolioData } from '../../hooks/usePortfolioData';
import { MediaPickerModal } from '../components/MediaPickerModal';
import { SmartImage } from '../../components/SmartImage';

const GALLERY_CATS = [
  'AI-Generated Images',
  'AI Videos',
  'Social Media Creatives',
  'Posters & Advertisements',
  'Branding & Graphic Design',
  'Marketing Campaigns',
  'Reels & Short Videos',
];

export function GalleryManagerPanel() {
  const { toast, confirm } = useToast();
  const { refreshPortfolio } = usePortfolioData();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [editing, setEditing] = useState<Partial<GalleryItem> | null>(null);
  const [tagsInput, setTagsInput] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);

  const loadGallery = async () => {
    const res = await apiRequest<{ items: GalleryItem[] }>('/api/admin/gallery');
    setItems(res.items);
  };

  useEffect(() => {
    void loadGallery();
  }, []);

  const openEditor = (item?: GalleryItem) => {
    const target: Partial<GalleryItem> = item
      ? { ...item }
      : {
          title: '',
          category_name: GALLERY_CATS[0],
          description: '',
          media_type: 'image',
          media_url: '',
          thumbnail_url: '',
          embed_url: '',
          tool_used: '',
          tags: [],
          creation_date: new Date().toISOString().slice(0, 7),
          status: 'published',
        };
    setEditing(target);
    setTagsInput((target.tags || []).join(', '));
  };

  const handleSave = async (statusOverride?: 'draft' | 'published') => {
    if (!editing || !editing.title || (!editing.media_url && !editing.embed_url)) {
      toast('Title and media URL are required.', 'error');
      return;
    }
    const payload = {
      ...editing,
      status: statusOverride ?? editing.status ?? 'published',
      tags: tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };
    if (editing.id) {
      await apiRequest(`/api/admin/gallery/${editing.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      toast('Gallery item updated.');
    } else {
      await apiRequest('/api/admin/gallery', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      toast('Gallery item added.');
    }
    setEditing(null);
    await loadGallery();
    await refreshPortfolio();
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setBulkUploading(true);
    try {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append('files', f));
      fd.append('folder', 'gallery');
      const res = await apiRequest<{ assets: MediaAsset[] }>('/api/admin/media/upload', {
        method: 'POST',
        body: fd,
      });
      for (const asset of res.assets) {
        await apiRequest('/api/admin/gallery', {
          method: 'POST',
          body: JSON.stringify({
            title: asset.title,
            category_name: asset.file_type === 'video' ? 'Reels & Short Videos' : 'AI-Generated Images',
            media_type: asset.file_type === 'video' ? 'video' : 'image',
            media_url: asset.cdn_url || asset.url,
            thumbnail_url: asset.file_type === 'image' ? asset.cdn_url || asset.url : '',
            status: 'published',
          }),
        });
      }
      toast(`Uploaded and published ${res.assets.length} gallery item(s).`);
      await loadGallery();
      await refreshPortfolio();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setBulkUploading(false);
    }
  };

  const handleDelete = async (item: GalleryItem) => {
    const ok = await confirm({
      title: `Remove "${item.title}"?`,
      description: 'This removes the item from your public Creative Gallery.',
      confirmLabel: 'Remove',
      destructive: true,
    });
    if (!ok) return;
    await apiRequest(`/api/admin/gallery/${item.id}`, { method: 'DELETE' });
    toast('Gallery item deleted.');
    await loadGallery();
    await refreshPortfolio();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#F5F8FF]">Creative Gallery Manager</h2>
          <p className="text-sm text-[#A9BBD3]">
            Upload AI images, MP4 videos, or embed YouTube/Vimeo/Google Drive reels.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#24466C] bg-[#0D2747] hover:border-[#2878FF] text-xs font-semibold text-[#F5F8FF] cursor-pointer">
            <Upload className="w-4 h-4 text-[#00B8FF]" />
            <span>{bulkUploading ? 'Uploading...' : 'Bulk Upload Files'}</span>
            <input
              type="file"
              multiple
              accept="image/*,video/mp4,video/webm"
              className="hidden"
              onChange={handleBulkUpload}
            />
          </label>
          <button
            type="button"
            onClick={() => openEditor()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2878FF] hover:bg-[#1E66E5] text-white text-xs font-semibold"
          >
            <Plus className="w-4 h-4" /> Add Gallery Item
          </button>
        </div>
      </div>

      {editing && (
        <div className="rounded-2xl border border-[#2878FF]/60 bg-[#0D2747] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#F5F8FF]">
              {editing.id ? 'Edit Gallery Item' : 'New Gallery Entry'}
            </h3>
            <button type="button" onClick={() => setEditing(null)} className="text-[#A9BBD3] hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-[#A9BBD3] mb-1">Title *</label>
              <input
                type="text"
                value={editing.title || ''}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-sm text-[#F5F8FF]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#A9BBD3] mb-1">Category</label>
              <select
                value={editing.category_name || GALLERY_CATS[0]}
                onChange={(e) => setEditing({ ...editing, category_name: e.target.value })}
                className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-sm text-[#F5F8FF]"
              >
                {GALLERY_CATS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#A9BBD3] mb-1">Media Type</label>
              <select
                value={editing.media_type || 'image'}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    media_type: e.target.value as 'image' | 'video' | 'embed',
                  })
                }
                className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-sm text-[#F5F8FF]"
              >
                <option value="image">Image (JPG/PNG/WebP/GIF)</option>
                <option value="video">Direct MP4/WebM Video</option>
                <option value="embed">External Video Embed (YouTube/Vimeo/Drive)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs text-[#A9BBD3] mb-1">
                {editing.media_type === 'embed' ? 'Video Share / Embed URL *' : 'Media URL *'}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editing.media_type === 'embed' ? editing.embed_url || editing.media_url || '' : editing.media_url || ''}
                  onChange={(e) =>
                    editing.media_type === 'embed'
                      ? setEditing({ ...editing, embed_url: e.target.value, media_url: e.target.value })
                      : setEditing({ ...editing, media_url: e.target.value, thumbnail_url: e.target.value })
                  }
                  className="flex-1 rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-xs text-[#F5F8FF]"
                />
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="px-3.5 py-2 rounded-xl border border-[#24466C] text-xs font-semibold text-[#00B8FF]"
                >
                  Media Library
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#A9BBD3] mb-1">Tool / Software Used</label>
              <input
                type="text"
                placeholder="Midjourney · Premiere Pro"
                value={editing.tool_used || ''}
                onChange={(e) => setEditing({ ...editing, tool_used: e.target.value })}
                className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-sm text-[#F5F8FF]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#A9BBD3] mb-1">Tags (comma-separated)</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-sm text-[#F5F8FF]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#A9BBD3] mb-1">Creation Date</label>
              <input
                type="text"
                value={editing.creation_date || ''}
                onChange={(e) => setEditing({ ...editing, creation_date: e.target.value })}
                className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-sm text-[#F5F8FF]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#A9BBD3] mb-1">Description</label>
            <textarea
              rows={2}
              value={editing.description || ''}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-sm text-[#F5F8FF]"
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
              <Save className="w-3.5 h-3.5" /> Publish Item
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-[#24466C] bg-[#0D2747] overflow-hidden flex flex-col"
          >
            <div className="aspect-[4/3] bg-[#06152B]">
              <SmartImage
                src={item.thumbnail_url || item.media_url}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[#00B8FF] font-medium">{item.category_name}</span>
                  <span className={item.status === 'published' ? 'text-[#22C55E]' : 'text-amber-400'}>
                    {item.status}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-[#F5F8FF]">{item.title}</h3>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#24466C]/70">
                <button
                  type="button"
                  onClick={() => openEditor(item)}
                  className="px-3 py-1.5 rounded-lg border border-[#24466C] text-xs font-semibold text-[#F5F8FF]"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(item)}
                  className="p-1.5 rounded-lg border border-[#24466C] text-rose-400 hover:bg-rose-500/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        acceptType="all"
        onSelect={(url) => {
          if (!editing) return;
          setEditing({ ...editing, media_url: url, thumbnail_url: url });
        }}
      />
    </div>
  );
}
