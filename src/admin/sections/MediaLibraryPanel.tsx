import React, { useEffect, useState } from 'react';
import { Copy, ExternalLink, FileText, Link2, Trash2, Upload } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import type { MediaAsset } from '../../types/cms';
import { useToast } from '../../components/ToastProvider';
import { SmartImage } from '../../components/SmartImage';
import { GoogleDriveViewer } from '../../components/GoogleDriveViewer';

export function MediaLibraryPanel() {
  const { toast, confirm } = useToast();
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [uploading, setUploading] = useState(false);

  // Google Drive Importer State
  const [driveUrl, setDriveUrl] = useState('');
  const [driveTitle, setDriveTitle] = useState('');
  const [driveType, setDriveType] = useState<'pdf' | 'image' | 'video' | 'document'>('pdf');
  const [driveLoading, setDriveLoading] = useState(false);
  const [previewDrive, setPreviewDrive] = useState<MediaAsset | null>(null);

  const load = async () => {
    const res = await apiRequest<{ assets: MediaAsset[] }>('/api/admin/media');
    setAssets(res.assets);
  };

  useEffect(() => {
    void load();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append('files', f));
      fd.append('folder', 'media-library');
      await apiRequest('/api/admin/media/upload', { method: 'POST', body: fd });
      toast('Media uploaded successfully.');
      await load();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleImportDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    setDriveLoading(true);
    try {
      const res = await apiRequest<{ warning?: string }>('/api/admin/media/gdrive', {
        method: 'POST',
        body: JSON.stringify({
          url: driveUrl,
          title: driveTitle,
          file_type: driveType,
          folder: 'google-drive',
        }),
      });
      toast(res.warning || 'Google Drive asset linked and verified.', 'info');
      setDriveUrl('');
      setDriveTitle('');
      await load();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setDriveLoading(false);
    }
  };

  const copyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    toast('Asset URL copied to clipboard.');
  };

  const handleDelete = async (asset: MediaAsset) => {
    const ok = await confirm({
      title: `Delete "${asset.title}"?`,
      description: 'Ensure no published page or project is still referencing this file.',
      confirmLabel: 'Delete Asset',
      destructive: true,
    });
    if (!ok) return;
    await apiRequest(`/api/admin/media/${asset.id}`, { method: 'DELETE' });
    toast('Asset deleted.');
    await load();
  };

  const filtered = assets.filter((a) => {
    if (filterType !== 'all' && a.file_type !== filterType) return false;
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#F5F8FF]">Media Library &amp; Google Drive</h2>
          <p className="text-sm text-[#A9BBD3]">
            Upload images/videos/PDFs, serve via Cloudflare CDN when configured, or attach Google Drive files.
          </p>
        </div>

        <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2878FF] hover:bg-[#1E66E5] text-white text-xs font-semibold cursor-pointer">
          <Upload className="w-4 h-4" />
          <span>{uploading ? 'Uploading...' : 'Upload Media Files'}</span>
          <input
            type="file"
            multiple
            accept="image/*,video/mp4,video/webm,.pdf"
            className="hidden"
            onChange={handleUpload}
          />
        </label>
      </div>

      {/* Google Drive Importer */}
      <form
        onSubmit={handleImportDrive}
        className="rounded-2xl border border-[#24466C] bg-[#0D2747] p-5 space-y-3"
      >
        <div className="flex items-center gap-2 text-sm font-bold text-[#F5F8FF]">
          <Link2 className="w-4 h-4 text-[#00B8FF]" />
          <span>Connect Google Drive Portfolio File (PDF, Presentation, Image, Video)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <input
            type="text"
            required
            placeholder="Document / Asset Title"
            value={driveTitle}
            onChange={(e) => setDriveTitle(e.target.value)}
            className="sm:col-span-3 rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-xs text-[#F5F8FF]"
          />
          <input
            type="url"
            required
            placeholder="https://drive.google.com/file/d/FILE_ID/view"
            value={driveUrl}
            onChange={(e) => setDriveUrl(e.target.value)}
            className="sm:col-span-5 rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-xs text-[#F5F8FF]"
          />
          <select
            value={driveType}
            onChange={(e) => setDriveType(e.target.value as 'pdf' | 'image' | 'video' | 'document')}
            className="sm:col-span-2 rounded-xl border border-[#24466C] bg-[#06152B] px-3 py-2 text-xs text-[#F5F8FF]"
          >
            <option value="pdf">PDF / Deck</option>
            <option value="document">Google Doc</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
          <button
            type="submit"
            disabled={driveLoading}
            className="sm:col-span-2 rounded-xl bg-[#2878FF] text-white text-xs font-semibold py-2"
          >
            {driveLoading ? 'Verifying...' : 'Attach Drive File'}
          </button>
        </div>
      </form>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search files by title..."
          className="flex-1 min-w-[200px] rounded-xl border border-[#24466C] bg-[#0D2747] px-3.5 py-2 text-sm text-[#F5F8FF]"
        />
        {['all', 'image', 'video', 'pdf', 'document'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setFilterType(t)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold capitalize ${
              filterType === t
                ? 'bg-[#2878FF] text-white'
                : 'border border-[#24466C] bg-[#0B1F3A] text-[#A9BBD3]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {previewDrive && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-[#00B8FF]">Google Drive Document Preview</span>
            <button
              type="button"
              onClick={() => setPreviewDrive(null)}
              className="text-xs text-[#A9BBD3] hover:text-white"
            >
              Close Preview
            </button>
          </div>
          <GoogleDriveViewer
            url={previewDrive.drive_open_url || previewDrive.url}
            fileId={previewDrive.drive_file_id}
            title={previewDrive.title}
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filtered.map((asset) => (
          <div
            key={asset.id}
            className="rounded-2xl border border-[#24466C] bg-[#0D2747] overflow-hidden flex flex-col"
          >
            <div className="aspect-[4/3] bg-[#06152B] flex items-center justify-center overflow-hidden">
              {asset.file_type === 'image' ? (
                <SmartImage
                  src={asset.cdn_url || asset.url}
                  alt={asset.alt_text || asset.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-[#00B8FF] p-4 text-center">
                  <FileText className="w-8 h-8" />
                  <span className="text-xs uppercase font-mono">{asset.file_type}</span>
                </div>
              )}
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-[#F5F8FF] truncate">{asset.title}</h4>
                <p className="text-[11px] font-mono text-[#A9BBD3] mt-0.5">
                  {asset.storage_provider} · {asset.folder}
                </p>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#24466C]/60">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => void copyUrl(asset.cdn_url || asset.url)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#24466C] text-[11px] text-[#F5F8FF]"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                  {asset.storage_provider === 'google_drive' && (
                    <button
                      type="button"
                      onClick={() => setPreviewDrive(asset)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#2878FF]/40 text-[11px] text-[#00B8FF]"
                    >
                      <ExternalLink className="w-3 h-3" /> View
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => void handleDelete(asset)}
                  className="p-1.5 rounded-lg border border-[#24466C] text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
