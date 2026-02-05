/**
 * Renders listing badges (recommended, featured, new) as separate pills with distinct colours.
 * badge can be a comma-separated string from the API (e.g. "recommended,featured").
 */
const BADGE_KEYS = ['recommended', 'featured', 'new'] as const;

const DEFAULT_LABELS: Record<string, string> = {
  recommended: 'Recommended',
  featured: 'Featured',
  new: 'New',
};

/** Colours per badge type: each badge gets its own pill colour */
const BADGE_COLORS: Record<string, string> = {
  recommended: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  featured: 'bg-blue-100 text-blue-800 border-blue-200',
  new: 'bg-amber-100 text-amber-800 border-amber-200',
};

function parseBadges(badge: string | null | undefined): string[] {
  if (!badge || typeof badge !== 'string') return [];
  return badge
    .split(',')
    .map((b) => b.trim())
    .filter((b) => BADGE_KEYS.includes(b as (typeof BADGE_KEYS)[number]));
}

type Props = {
  badge: string | null | undefined;
  /** Optional display labels (e.g. from listing display settings). Keys: recommended, featured, new */
  badgeLabels?: Record<string, string>;
  /** Compact = smaller text and padding (e.g. for cards). Default false = normal size for detail page */
  compact?: boolean;
  className?: string;
};

export function ListingBadges({ badge, badgeLabels, compact, className = '' }: Props) {
  const badges = parseBadges(badge);
  const labels = badgeLabels ?? DEFAULT_LABELS;
  if (badges.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {badges.map((key) => (
        <span
          key={key}
          className={`inline-flex items-center rounded-full border font-medium ${
            compact ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
          } ${BADGE_COLORS[key] ?? 'bg-muted text-muted-foreground border-border'}`}
        >
          {labels[key] ?? key}
        </span>
      ))}
    </div>
  );
}
