import { Card, CardContent } from '@/components/ui/card';
import { Quote } from 'lucide-react';

/** Placeholder avatars (optional; initials used as fallback) */
const testimonialImages = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
];

const testimonials = [
  {
    quote:
      'Staying with a family in Pokhara was the highlight of our trip. We felt like part of the family and learned so much about Nepali culture.',
    author: 'Sarah M.',
    location: 'Australia',
  },
  {
    quote:
      'Authentic experience, warm hospitality, and delicious dal bhat. Would recommend to anyone visiting Nepal.',
    author: 'James K.',
    location: 'UK',
  },
  {
    quote:
      'Our host in Kathmandu went above and beyond. The kids still talk about the homestay. Thank you!',
    author: 'Priya & Raj',
    location: 'India',
  },
];

export default function Testimonials() {
  return (
    <section className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-primary-800 md:text-4xl">What guests say</h2>
        <p className="mt-2 text-muted-foreground">
          Real experiences from travelers who stayed with local families
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {testimonials.map((t, i) => (
          <Card key={t.author} className="overflow-hidden border-primary-100">
            <div className="relative h-32 w-full overflow-hidden bg-primary-100">
              <img
                src={testimonialImages[i]}
                alt=""
                className="h-full w-full object-cover object-top"
              />
              <div className="absolute bottom-3 left-3 flex items-center gap-3 rounded-lg bg-white/95 px-3 py-2 shadow">
                <img
                  src={testimonialImages[i]}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover ring-2 ring-white"
                />
                <div>
                  <p className="text-sm font-medium text-primary-800">{t.author}</p>
                  <p className="text-xs text-muted-foreground">{t.location}</p>
                </div>
              </div>
            </div>
            <CardContent className="pt-4">
              <Quote className="h-6 w-6 text-accent-400" />
              <p className="mt-2 text-sm text-foreground">&ldquo;{t.quote}&rdquo;</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
