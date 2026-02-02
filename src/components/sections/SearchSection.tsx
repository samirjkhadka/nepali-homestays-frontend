import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';

/** Optional section imagery (Nepal scenery); falls back to gradient if unavailable */
const SEARCH_HERO_IMAGE = 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200&q=80';

export default function SearchSection() {
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
    <section className="relative overflow-hidden rounded-2xl border border-primary-200 shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900" />
      <img
        src={SEARCH_HERO_IMAGE}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-primary-900/50" />
      <div className="relative mx-auto max-w-4xl p-6 md:p-8">
        <h2 className="text-xl font-semibold text-white drop-shadow md:text-2xl">Find your homestay</h2>
        <p className="mt-1 text-white/90">Search by location, price, and guests</p>
        <form
          onSubmit={handleSearch}
          className="mt-6 flex flex-wrap items-end gap-4 rounded-xl bg-white/95 p-4 shadow-lg backdrop-blur-sm md:gap-5 md:p-5"
        >
          <div className="min-w-[160px] flex-1">
            <Label htmlFor="hero-location">Location</Label>
            <Input
              id="hero-location"
              name="location"
              placeholder="e.g. Kathmandu, Pokhara"
              className="mt-1"
            />
          </div>
          <div className="w-28">
            <Label htmlFor="hero-minPrice">Min price</Label>
            <Input
              id="hero-minPrice"
              name="minPrice"
              type="number"
              placeholder="0"
              min={0}
              className="mt-1"
            />
          </div>
          <div className="w-28">
            <Label htmlFor="hero-maxPrice">Max price</Label>
            <Input
              id="hero-maxPrice"
              name="maxPrice"
              type="number"
              placeholder="500"
              min={0}
              className="mt-1"
            />
          </div>
          <div className="w-24">
            <Label htmlFor="hero-guests">Guests</Label>
            <Input
              id="hero-guests"
              name="guests"
              type="number"
              placeholder="1"
              min={1}
              className="mt-1"
            />
          </div>
          <Button type="submit" size="lg" className="bg-primary-600 hover:bg-primary-700">
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
        </form>
      </div>
    </section>
  );
}
