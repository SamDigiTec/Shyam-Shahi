import { useState } from 'react';
import { ExternalLink, FileText, AlertTriangle } from 'lucide-react';

interface GoogleDriveViewerProps {
  url: string;
  fileId?: string;
  title?: string;
  heightClass?: string;
}

export function extractDriveIdClient(rawUrl: string): string {
  if (!rawUrl) return '';
  const match = rawUrl.match(/\/d\/([a-zA-Z0-9_-]{10,})/);
  if (match) return match[1];
  try {
    const u = new URL(rawUrl);
    return u.searchParams.get('id') || '';
  } catch {
    return '';
  }
}

export function GoogleDriveViewer({
  url,
  fileId,
  title = 'Portfolio Document',
  heightClass = 'h-[480px]',
}: GoogleDriveViewerProps) {
  const [embedBlocked, setEmbedBlocked] = useState(false);
  const resolvedId = fileId || extractDriveIdClient(url);

  if (!url && !resolvedId) return null;

  const isDocs = url.includes('docs.google.com/presentation')
    ? 'presentation'
    : url.includes('docs.google.com/document')
      ? 'document'
      : null;

  const embedSrc = resolvedId
    ? isDocs
      ? `https://docs.google.com/${isDocs}/d/${resolvedId}/preview`
      : `https://drive.google.com/file/d/${resolvedId}/preview`
    : url;

  const openHref = resolvedId
    ? isDocs
      ? `https://docs.google.com/${isDocs}/d/${resolvedId}/view`
      : `https://drive.google.com/file/d/${resolvedId}/view`
    : url;

  return (
    <div className="rounded-2xl border border-[#24466C] bg-[#0B1F3A] overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-[#24466C] bg-[#0D2747]">
        <div className="flex items-center gap-2.5 min-w-0">
          <FileText className="w-4 h-4 text-[#00B8FF] shrink-0" aria-hidden="true" />
          <span className="text-sm font-medium text-[#F5F8FF] truncate">{title}</span>
        </div>
        <a
          href={openHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2878FF] hover:bg-[#1E66E5] text-xs font-medium text-white transition-colors whitespace-nowrap shrink-0"
        >
          Open in Google Drive
          <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
        </a>
      </div>

      {!embedBlocked && resolvedId ? (
        <div className={`relative w-full ${heightClass} bg-[#06152B]`}>
          <iframe
            src={embedSrc}
            title={title}
            className="w-full h-full border-0"
            allow="autoplay"
            sandbox="allow-scripts allow-same-origin allow-popups"
            onError={() => setEmbedBlocked(true)}
          />
        </div>
      ) : (
        <div className="p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
          <p className="text-sm text-[#A9BBD3] max-w-md mx-auto">
            Inline preview is unavailable if the file sharing permission is restricted or blocked by browser settings. Use the button above to open it directly in Google Drive.
          </p>
        </div>
      )}
    </div>
  );
}
