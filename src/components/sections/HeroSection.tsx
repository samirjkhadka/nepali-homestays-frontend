import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronDown } from 'lucide-react';

export default function HeroSection() {
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const location = (form.elements.namedItem('location') as HTMLInputElement)?.value ?? '';
    const minPrice = (form.elements.namedItem('minPrice') as HTMLInputElement)?.value ?? '';
    const maxPrice = (form.elements.namedItem('maxPrice') as HTMLInputElement)?.value ?? '';
    const guests = (form.elements.namedItem('guests') as HTMLInputElement)?.value ?? '';
    const params = new URLSearchParams();
    if (location) params.set('location', location);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (guests) params.set('guests', guests);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <section className="relative min-h-[70vh] overflow-hidden rounded-2xl bg-gradient-nepal shadow-xl md:min-h-[75vh]">
      <div className="absolute inset-0 bg-primary-900/20" />
      <div className="relative flex min-h-[70vh] flex-col justify-center px-6 py-16 md:min-h-[75vh] md:px-12 md:py-24">
        <div className="mx-auto w-full max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-md md:text-5xl lg:text-6xl">
            Discover Authentic Nepal
          </h1>
          <p className="mt-4 text-lg text-white/95 md:text-xl">
            Book homestays with local families. Experience culture, nature, and warmth.
          </p>
          <form
            onSubmit={handleSearch}
            className="mt-8 flex flex-wrap justify-center gap-3 rounded-xl bg-white/15 p-4 backdrop-blur-sm md:gap-4 md:p-5"
          >
            <div className="min-w-[140px] flex-1">
              <Label className="text-white/95">Location</Label>
              <Input
                name="location"
                placeholder="e.g. Kathmandu"
                className="mt-1 border-white/30 bg-white/95 text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="w-24">
              <Label className="text-white/95">Min $</Label>
              <Input
                name="minPrice"
                type="number"
                placeholder="0"
                className="mt-1 border-white/30 bg-white/95 text-foreground"
              />
            </div>
            <div className="w-24">
              <Label className="text-white/95">Max $</Label>
              <Input
                name="maxPrice"
                type="number"
                placeholder="500"
                className="mt-1 border-white/30 bg-white/95 text-foreground"
              />
            </div>
            <div className="w-24">
              <Label className="text-white/95">Guests</Label>
              <Input
                name="guests"
                type="number"
                placeholder="1"
                min={1}
                className="mt-1 border-white/30 bg-white/95 text-foreground"
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" size="lg" className="bg-white text-primary-700 hover:bg-white/90">
                Search
              </Button>
            </div>
          </form>
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-8 w-8 text-white/80" aria-hidden />
        </div>
      </div>
    </section>
  );
}
