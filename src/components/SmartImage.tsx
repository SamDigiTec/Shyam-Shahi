import { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface SmartImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackLabel?: string;
  objectPosition?: string;
  zoom?: number;
  loading?: 'lazy' | 'eager';
}

export function SmartImage({
  src,
  alt,
  className = '',
  fallbackLabel,
  objectPosition,
  zoom = 1,
  loading = 'lazy',
}: SmartImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#0B1F3A] via-[#0D2747] to-[#06152B] text-[#A9BBD3] p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <ImageIcon className="w-8 h-8 text-[#2878FF]/70 mb-2" aria-hidden="true" />
        <span className="text-xs font-medium tracking-wide text-[#A9BBD3]/90 max-w-[200px] truncate">
          {fallbackLabel || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      style={{
        objectPosition: objectPosition || undefined,
        transform: zoom !== 1 ? `scale(${zoom})` : undefined,
      }}
      className={className}
    />
  );
}
