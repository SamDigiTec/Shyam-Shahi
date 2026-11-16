import React, { useEffect, useState } from 'react';
import { Upload, X, Check } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import type { MediaAsset } from '../../types/cms';
import { SmartImage } from '../../components/SmartImage';
import { useToast } from '../../components/ToastProvider';

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string, asset?: MediaAsset) => void;
  acceptType?: 'image' | 'all';
}

export function MediaPickerModal({
  open,
  onClose,
  onSelect,
  acceptType = 'image',
}: MediaPickerModalProps) {
  const { toast } = useToast();
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');

  const loadAssets = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ assets: MediaAsset[] }>('/api/admin/media');
      setAssets(res.assets);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) void loadAssets();
  }, [open]);

  if (!open) return null;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append('files', f));
      fd.append('folder', 'cms-uploads');
      const res = await apiRequest<{ assets: MediaAsset[] }>('/api/admin/media/upload', {
        method: 'POST',
        body: fd,
      });
      toast('Media uploaded to library.');
      await loadAssets();
      if (res.assets[0]) {
        onSelect(res.assets[0].cdn_url || res.assets[0].url, res.assets[0]);
        onClose();
      }
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const filtered = assets.filter((a) => {
    if (acceptType === 'image' && a.file_type !== 'image') return false;
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-[90] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl rounded-2xl border border-[#24466C] bg-[#0B1F3A] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#24466C] bg-[#0D2747]">
          <h3 className="text-lg font-bold text-[#F5F8FF]">Select or Upload Media</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A9BBD3] hover:text-white hover:bg-[#06152B]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-[#24466C] flex flex-wrap items-center justify-between gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search media library..."
            className="flex-1 min-w-[200px] rounded-xl border border-[#24466C] bg-[#06152B] px-3.5 py-2 text-sm text-[#F5F8FF]"
          />
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2878FF] hover:bg-[#1E66E5] text-white text-xs font-semibold cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Uploading...' : 'Upload New File'}</span>
            <input type="file" className="hidden" onChange={handleUpload} accept="image/*,video/mp4,.pdf" />
          </label>
        </div>

        <div className="p-6 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {loading ? (
            <p className="text-sm text-[#A9BBD3] col-span-full">Loading library...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-[#A9BBD3] col-span-full">No matching assets found.</p>
          ) : (
            filtered.map((asset) => (
              <button
                key={asset.id}
                type="button"
                onClick={() => {
                  onSelect(asset.cdn_url || asset.url, asset);
                  onClose();
                }}
                className="group relative rounded-xl border border-[#24466C] bg-[#0D2747] overflow-hidden text-left hover:border-[#2878FF] transition-colors"
              >
                <div className="aspect-[4/3] bg-[#06152B] overflow-hidden">
                  <SmartImage
                    src={asset.cdn_url || asset.url}
                    alt={asset.alt_text || asset.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-2.5 flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-[#F5F8FF] truncate">{asset.title}</span>
                  <Check className="w-3.5 h-3.5 text-[#00B8FF] opacity-0 group-hover:opacity-100 shrink-0" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
