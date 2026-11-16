export interface ParsedGoogleDriveFile {
  fileId: string;
  docType: 'file' | 'document' | 'presentation' | 'spreadsheets';
  embedUrl: string;
  openUrl: string;
  directImageUrl: string;
  accessible: boolean;
  warning?: string;
}

export function extractGoogleDriveInfo(rawUrl: string): {
  fileId: string;
  docType: 'file' | 'document' | 'presentation' | 'spreadsheets';
} | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();
    if (!host.includes('drive.google.com') && !host.includes('docs.google.com')) {
      return null;
    }

    // Match /file/d/<id>, /document/d/<id>, /presentation/d/<id>, /spreadsheets/d/<id>
    const pathMatch = parsed.pathname.match(
      /\/(file|document|presentation|spreadsheets)\/d\/([a-zA-Z0-9_-]{10,})/
    );
    if (pathMatch) {
      return {
        docType: pathMatch[1] as 'file' | 'document' | 'presentation' | 'spreadsheets',
        fileId: pathMatch[2],
      };
    }

    // Match ?id=<id>
    const queryId = parsed.searchParams.get('id');
    if (queryId && /^[a-zA-Z0-9_-]{10,}$/.test(queryId)) {
      return { docType: 'file', fileId: queryId };
    }
  } catch {
    return null;
  }
  return null;
}

export function buildGoogleDriveUrls(
  fileId: string,
  docType: 'file' | 'document' | 'presentation' | 'spreadsheets' = 'file'
): Omit<ParsedGoogleDriveFile, 'accessible' | 'warning'> {
  if (docType === 'document' || docType === 'presentation' || docType === 'spreadsheets') {
    return {
      fileId,
      docType,
      embedUrl: `https://docs.google.com/${docType}/d/${fileId}/preview`,
      openUrl: `https://docs.google.com/${docType}/d/${fileId}/view`,
      directImageUrl: `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`,
    };
  }
  return {
    fileId,
    docType: 'file',
    embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
    openUrl: `https://drive.google.com/file/d/${fileId}/view`,
    directImageUrl: `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`,
  };
}

export async function verifyGoogleDriveFile(rawUrl: string): Promise<ParsedGoogleDriveFile> {
  const info = extractGoogleDriveInfo(rawUrl);
  if (!info) {
    throw new Error(
      'Invalid Google Drive URL. Supported formats: drive.google.com/file/d/<ID>/view or docs.google.com/.../d/<ID>'
    );
  }

  const urls = buildGoogleDriveUrls(info.fileId, info.docType);
  let accessible = true;
  let warning: string | undefined;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const resp = await fetch(urls.openUrl, {
      method: 'HEAD',
      redirect: 'manual',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const location = resp.headers.get('location') || '';
    if (
      resp.status === 401 ||
      resp.status === 403 ||
      resp.status === 404 ||
      location.includes('accounts.google.com')
    ) {
      accessible = false;
      warning =
        'This Google Drive file appears private or restricted. Set sharing to "Anyone with the link" (Viewer) in Google Drive for public embedding.';
    }
  } catch {
    // Network timeout or blocked outbound check in sandbox — keep URL usable with gentle notice
    accessible = true;
    warning =
      'Saved Google Drive reference. Ensure file sharing is set to "Anyone with the link" so visitors can view the preview.';
  }

  return {
    ...urls,
    accessible,
    warning,
  };
}

export function resolveCdnUrl(assetUrl: string, cdnDomain?: string): string {
  if (!assetUrl) return '';
  if (!cdnDomain || !cdnDomain.trim()) return assetUrl;

  // Never rewrite Google Drive or Docs URLs through Cloudflare CDN
  if (
    assetUrl.includes('drive.google.com') ||
    assetUrl.includes('docs.google.com') ||
    assetUrl.includes('googleusercontent.com')
  ) {
    return assetUrl;
  }

  // Only rewrite local /uploads/ or relative assets if CDN domain is configured
  if (assetUrl.startsWith('/uploads/')) {
    const cleanDomain = cdnDomain.replace(/\/+$/, '');
    const prefix = cleanDomain.startsWith('http') ? cleanDomain : `https://${cleanDomain}`;
    return `${prefix}${assetUrl}`;
  }

  return assetUrl;
}

export function normalizeVideoEmbedUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';
  try {
    const u = new URL(trimmed);
    const host = u.hostname.toLowerCase();
    // YouTube watch or youtu.be
    if (host.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube-nocookie.com/embed/${v}`;
      if (u.pathname.startsWith('/shorts/')) {
        const id = u.pathname.split('/')[2];
        if (id) return `https://www.youtube-nocookie.com/embed/${id}`;
      }
      if (u.pathname.startsWith('/embed/')) return trimmed;
    }
    if (host === 'youtu.be') {
      const id = u.pathname.replace('/', '');
      if (id) return `https://www.youtube-nocookie.com/embed/${id}`;
    }
    // Vimeo
    if (host.includes('vimeo.com') && !host.includes('player.vimeo.com')) {
      const id = u.pathname.split('/').filter(Boolean)[0];
      if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
    }
    // Google Drive preview
    const driveInfo = extractGoogleDriveInfo(trimmed);
    if (driveInfo) {
      return buildGoogleDriveUrls(driveInfo.fileId, driveInfo.docType).embedUrl;
    }
  } catch {
    return trimmed;
  }
  return trimmed;
}
