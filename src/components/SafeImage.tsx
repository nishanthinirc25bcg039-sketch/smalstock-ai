import { useState } from 'react';
import { Package } from 'lucide-react';

interface SafeImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export function SafeImage({ src, alt, className = 'w-11 h-11 rounded-lg', fallbackLabel }: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`${className} bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0`}
        role="img"
        aria-label={alt}
      >
        {fallbackLabel ? (
          <span className="text-xs font-semibold tracking-tight text-slate-600 uppercase">
            {fallbackLabel.slice(0, 2)}
          </span>
        ) : (
          <Package className="w-4 h-4 text-slate-500" aria-hidden="true" />
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`${className} object-cover bg-slate-100 border border-slate-200 shrink-0`}
    />
  );
}
