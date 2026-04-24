import { cn } from '@/lib/utils';

interface Props {
  variant?: 'mountains' | 'mandala' | 'wave';
  className?: string;
  flip?: boolean;
  fill?: string;
}

export function SectionDivider({
  variant = 'mountains',
  className,
  flip = false,
  fill = 'hsl(var(--muted))',
}: Props) {
  const transform = flip ? 'rotate(180deg)' : undefined;

  if (variant === 'mountains') {
    return (
      <div className={cn('w-full leading-[0]', className)} style={{ transform }} aria-hidden>
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="h-12 w-full md:h-20">
          <path
            d="M0,120 L120,60 L240,90 L360,30 L480,80 L600,20 L720,70 L840,35 L960,85 L1080,40 L1200,75 L1320,30 L1440,80 L1440,120 Z"
            fill={fill}
          />
          <path
            d="M0,120 L120,90 L240,110 L360,75 L480,105 L600,70 L720,100 L840,80 L960,108 L1080,82 L1200,102 L1320,78 L1440,100 L1440,120 Z"
            fill={fill}
            opacity="0.6"
          />
        </svg>
      </div>
    );
  }

  if (variant === 'wave') {
    return (
      <div className={cn('w-full leading-[0]', className)} style={{ transform }} aria-hidden>
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="h-10 w-full md:h-14">
          <path
            d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z"
            fill={fill}
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={cn('flex w-full items-center justify-center py-8 md:py-10', className)} aria-hidden>
      <span className="h-px max-w-[120px] flex-1 bg-border" />
      <svg width="40" height="40" viewBox="0 0 40 40" className="mx-3 text-primary/60">
        <g fill="none" stroke="currentColor" strokeWidth="1.2">
          <circle cx="20" cy="20" r="3" />
          <circle cx="20" cy="20" r="9" />
          <circle cx="20" cy="20" r="15" strokeDasharray="2 3" />
          <line x1="20" y1="2" x2="20" y2="38" />
          <line x1="2" y1="20" x2="38" y2="20" />
          <line x1="6" y1="6" x2="34" y2="34" />
          <line x1="34" y1="6" x2="6" y2="34" />
        </g>
      </svg>
      <span className="h-px max-w-[120px] flex-1 bg-border" />
    </div>
  );
}
