import { getImageDisplayUrl } from '@/lib/image-url';

/** Inline preview for offline payment slip (image or PDF URL). */
export function OfflineProofPreview({ url }: { url: string }) {
  const full = getImageDisplayUrl(url);
  if (!full) return null;
  const pathOnly = full.split(/[?#]/)[0]?.toLowerCase() ?? '';
  const isPdf = pathOnly.endsWith('.pdf');
  if (isPdf) {
    return (
      <div className="mt-2 space-y-2">
        <div className="overflow-hidden rounded-md border border-primary-200 bg-muted/40">
          <iframe title="Payment proof PDF" src={full} className="h-64 w-full" />
        </div>
        <a href={full} target="_blank" rel="noreferrer" className="text-sm text-accent-600 underline">
          Open PDF in new tab
        </a>
      </div>
    );
  }
  return (
    <div className="mt-2 space-y-2">
      <img src={full} alt="Payment proof" className="max-h-56 max-w-full rounded-md border border-primary-200 bg-background object-contain" />
      <a href={full} target="_blank" rel="noreferrer" className="text-sm text-accent-600 underline">
        Open full size
      </a>
    </div>
  );
}
