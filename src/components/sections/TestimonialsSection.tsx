import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Sarah Johnson',
    country: 'United States',
    avatar: 'S',
    rating: 5,
    homestay: 'Mountain View Retreat',
    comment: 'An absolutely magical experience! The host family treated us like their own. Waking up to the Himalayan sunrise with a cup of Nepali chai was unforgettable. This is exactly what travel should feel like.',
  },
  {
    id: 2,
    name: 'Takeshi Yamamoto',
    country: 'Japan',
    avatar: 'T',
    rating: 5,
    homestay: 'Lakeside Heritage Home',
    comment: 'The cultural immersion was beyond anything I expected. Learning traditional cooking with the family and joining village festivals gave me memories I will treasure forever. Truly authentic Nepal.',
  },
  {
    id: 3,
    name: 'Emma Müller',
    country: 'Germany',
    avatar: 'E',
    rating: 5,
    homestay: 'Tharu Cultural Homestay',
    comment: 'As a solo female traveler, I felt completely safe and welcomed. The Tharu dance performance and jungle safari were highlights. The host went above and beyond to make my stay perfect.',
  },
  {
    id: 4,
    name: 'Raj Patel',
    country: 'India',
    avatar: 'R',
    rating: 5,
    homestay: 'Ancient Newari House',
    comment: 'The Newari architecture and heritage of the house was stunning. Every corner told a story. The host\'s knowledge of local history and culture made this an educational and heartwarming experience.',
  },
  {
    id: 5,
    name: 'Claire Dupont',
    country: 'France',
    avatar: 'C',
    rating: 5,
    homestay: 'Himalayan Tea Garden Stay',
    comment: 'Picking tea leaves at sunrise, then enjoying freshly brewed tea with panoramic mountain views — pure bliss. The family\'s warmth and the serene environment made me extend my stay twice!',
  },
];

export function TestimonialsSection() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const prev = () => setCurrent((c) => (c - 1 + testimonials.length) % testimonials.length);
  const next = () => setCurrent((c) => (c + 1) % testimonials.length);
  const t = testimonials[current];

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
          <span className="text-primary font-semibold text-sm uppercase tracking-widest">Testimonials</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-3">
            What Our Guests Say
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">
            Real stories from travelers who experienced the warmth of Nepali hospitality.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <div className="relative bg-card rounded-3xl border border-border shadow-lg p-8 md:p-12 min-h-[320px] flex flex-col justify-center overflow-hidden">
            {/* Decorative oversized quote */}
            <span className="absolute -top-6 -left-2 md:-top-8 md:-left-4 font-display text-[180px] md:text-[240px] leading-none text-primary/10 select-none pointer-events-none">
              ❝
            </span>
            <Quote className="w-10 h-10 text-primary/30 absolute top-6 left-6 md:top-8 md:left-8" />

            <AnimatePresence mode="wait">
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="text-center"
              >
                {/* Stars */}
                <div className="flex justify-center gap-1 mb-6">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-foreground text-lg md:text-xl leading-relaxed mb-8 italic">
                  "{t.comment}"
                </p>

                {/* Author */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display font-bold text-xl">
                    {t.avatar}
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{t.name}</h4>
                    <p className="text-sm text-muted-foreground">{t.country} · Stayed at {t.homestay}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation arrows */}
            <button
              onClick={prev}
              className="absolute left-3 md:-left-5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-card border border-border shadow-sm hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 md:-right-5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-card border border-border shadow-sm hover:bg-muted transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === current ? 'w-8 bg-primary' : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
