import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { useHomeContent, type HomeTestimonial } from '@/hooks/useHomeContent';

const FALLBACK: HomeTestimonial[] = [
  {
    id: 1,
    name: 'Sarah Johnson',
    country: 'United States',
    avatar: 'S',
    rating: 5,
    homestay: 'Mountain View Retreat',
    comment:
      'An absolutely magical experience! The host family treated us like their own. Waking up to the Himalayan sunrise with a cup of Nepali chai was unforgettable.',
  },
];

export function TestimonialsSection() {
  const { content } = useHomeContent();
  const testimonials =
    content?.testimonials?.items?.length ? content.testimonials.items : FALLBACK;
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    setCurrent(0);
  }, [testimonials.length]);

  useEffect(() => {
    if (testimonials.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  if (!testimonials.length) return null;

  const prev = () => setCurrent((c) => (c - 1 + testimonials.length) % testimonials.length);
  const next = () => setCurrent((c) => (c + 1) % testimonials.length);
  const t = testimonials[current] ?? testimonials[0];
  const rating = Math.min(5, Math.max(1, t.rating ?? 5));

  return (
    <section className="py-20 bg-gradient-to-b from-background to-primary/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(var(--accent)/0.08),transparent_60%)]" />
      <div className="section-container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-widest">
            {content?.testimonials?.badge || 'Testimonials'}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-3">
            {content?.testimonials?.title || 'What Our Guests Say'}
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">
            {content?.testimonials?.subtitle ||
              'Real stories from travelers who experienced the warmth of Nepali hospitality.'}
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <div className="relative bg-card rounded-3xl border border-border shadow-lg p-8 md:p-12 min-h-[320px] flex flex-col justify-center overflow-hidden">
            <span className="absolute -top-6 -left-2 md:-top-8 md:-left-4 font-display text-[180px] md:text-[240px] leading-none text-primary/10 select-none pointer-events-none">
              ❝
            </span>
            <Quote className="w-10 h-10 text-primary/30 absolute top-6 left-6 md:top-8 md:left-8" />

            <AnimatePresence mode="wait">
              <motion.div
                key={String(t.id)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="text-center"
              >
                <div className="flex justify-center gap-1 mb-6">
                  {[...Array(rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-foreground text-lg md:text-xl leading-relaxed mb-8 italic">
                  &ldquo;{t.comment}&rdquo;
                </p>
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display font-bold text-xl">
                    {t.avatar || t.name.slice(0, 1)}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{t.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {[t.country, t.homestay].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {testimonials.length > 1 && (
              <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
                <button type="button" onClick={prev} className="rounded-full border border-border p-2 hover:bg-muted" aria-label="Previous">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button type="button" onClick={next} className="rounded-full border border-border p-2 hover:bg-muted" aria-label="Next">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
