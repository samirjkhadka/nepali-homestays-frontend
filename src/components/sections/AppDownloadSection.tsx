import { motion } from 'framer-motion';
import { Smartphone, Apple, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

const containerClass = 'container mx-auto px-4';

/** Dummy app screen mockup: simple placeholder UI inside a phone frame */
function PhoneMockup({ variant = 'left' }: { variant?: 'left' | 'right' }) {
  return (
    <div className="relative mx-auto w-[160px] sm:w-[180px]">
      <div className="relative rounded-[2rem] border-[8px] border-primary-800 bg-primary-900 p-2 shadow-xl">
        <div className="absolute left-1/2 top-0 h-5 w-16 -translate-x-1/2 rounded-b-2xl bg-primary-800" />
        <div className="overflow-hidden rounded-[1.25rem] bg-muted">
          {/* Fake status bar */}
          <div className="flex items-center justify-between bg-primary-600 px-3 py-1.5 text-[10px] text-white">
            <span>9:41</span>
            <span className="flex gap-0.5">
              <span className="rounded-sm bg-white/90 px-1" />
              <span className="rounded-sm bg-white/90 px-1" />
            </span>
          </div>
          {/* Fake app content */}
          <div className="min-h-[200px] p-2">
            {variant === 'left' ? (
              <>
                <div className="mb-2 h-3 w-3/4 rounded bg-primary-200" />
                <div className="space-y-2">
                  <div className="h-12 rounded-lg bg-primary-100" />
                  <div className="h-12 rounded-lg bg-primary-100/80" />
                  <div className="h-12 rounded-lg bg-primary-100/60" />
                </div>
                <div className="mt-3 flex gap-1">
                  <div className="h-8 flex-1 rounded bg-accent-200" />
                  <div className="h-8 flex-1 rounded bg-primary-200" />
                </div>
              </>
            ) : (
              <>
                <div className="mb-2 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary-200" />
                  <div className="h-2 w-20 rounded bg-primary-200" />
                </div>
                <div className="h-24 rounded-xl bg-primary-100" />
                <div className="mt-2 flex gap-2">
                  <div className="h-10 flex-1 rounded-lg bg-primary-100" />
                  <div className="h-10 flex-1 rounded-lg bg-primary-100" />
                </div>
                <div className="mt-2 h-3 w-full rounded bg-primary-100/80" />
                <div className="mt-1 h-3 w-2/3 rounded bg-primary-100/60" />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AppDownloadSection() {
  return (
    <section id="app-download" className="py-16 md:py-20">
      <div className={containerClass}>
        <div className="relative overflow-hidden rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50/30 px-6 py-12 shadow-lg md:px-12 md:py-16">
          {/* Coming soon flag */}
          <div className="absolute right-4 top-4 md:right-8 md:top-6">
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-accent-500 bg-accent-500/15 px-3 py-1 text-sm font-semibold text-accent-700">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-600" />
              </span>
              Coming soon
            </span>
          </div>

          <div className="flex flex-col items-center gap-10 md:flex-row md:items-center md:justify-between md:gap-12">
            {/* Left: copy + store buttons */}
            <div className="max-w-xl text-center md:text-left">
              <div className="mb-4 inline-flex items-center justify-center rounded-full bg-primary-100 p-3 text-primary-700">
                <Smartphone className="h-8 w-8" />
              </div>
              <h2 className="font-display text-3xl font-bold text-primary-800 md:text-4xl">
                Nepali Homestays on the go
              </h2>
              <p className="mt-3 text-muted-foreground">
                Book homestays, message hosts, and manage your trips from your phone. Our app is coming soon to the App Store and Google Play.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4 md:justify-start">
                <Button
                  variant="outline"
                  size="lg"
                  disabled
                  className="pointer-events-none rounded-xl border-2 border-primary-300 bg-white/80 px-6 py-6 text-primary-800 opacity-90"
                >
                  <Apple className="mr-2 h-6 w-6" />
                  App Store
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  disabled
                  className="pointer-events-none rounded-xl border-2 border-primary-300 bg-white/80 px-6 py-6 text-primary-800 opacity-90"
                >
                  <Play className="mr-2 h-6 w-6" />
                  Google Play
                </Button>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                We&apos;re building the app. You&apos;ll be the first to know when it&apos;s ready.
              </p>
            </div>

            {/* Right: phone mockups */}
            <motion.div
              className="flex items-end justify-center gap-2 sm:gap-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              <PhoneMockup variant="left" />
              <PhoneMockup variant="right" />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
