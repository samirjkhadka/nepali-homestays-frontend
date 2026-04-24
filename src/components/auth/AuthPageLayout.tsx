import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { assets } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

type Props = {
  children: React.ReactNode;
  title?: string;
  description?: React.ReactNode;
  maxWidthClassName?: string;
  /** Custom header (replaces default title + description) */
  header?: React.ReactNode;
};

export function AuthPageLayout({
  children,
  title,
  description,
  maxWidthClassName = 'max-w-md',
  header,
}: Props) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn('w-full', maxWidthClassName)}
      >
        <Link to="/" className="mb-8 flex flex-col items-center justify-center gap-2">
          <img src={assets.logo} alt="Nepali Homestays" className="h-12 w-auto" />
          <span className="font-display text-xl font-semibold text-foreground">Nepali Homestays</span>
        </Link>
        <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
          {header ? (
            <div className="mb-6">{header}</div>
          ) : (title != null && title !== '') || description ? (
            <div className="mb-6 text-center">
              {title != null && title !== '' && (
                <h1 className="font-display text-2xl font-bold text-foreground">{title}</h1>
              )}
              {description && <div className="mt-2 text-sm text-muted-foreground">{description}</div>}
            </div>
          ) : null}
          {children}
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            ← Back to home
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
