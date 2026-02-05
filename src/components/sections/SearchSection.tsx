import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MapPin, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SearchSection() {
  const navigate = useNavigate();
  const [location, setLocation] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('1');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location.trim()) params.set('location', location.trim());
    if (checkIn) params.set('check_in', checkIn);
    if (checkOut) params.set('check_out', checkOut);
    if (guests) params.set('guests', guests);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <section className="relative -mt-24 z-30 w-full px-4">
      <div className="container mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="bg-card rounded-2xl shadow-xl p-6 md:p-8 border border-border"
      >
        <form onSubmit={handleSearch}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
            {/* Location */}
            <div className="space-y-2">
              <label htmlFor="hero-location" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Location
              </label>
              <input
                id="hero-location"
                name="location"
                type="text"
                placeholder="Where do you want to go?"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-3 bg-muted rounded-xl border-0 focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>

            {/* Check-in */}
            <div className="space-y-2">
              <label htmlFor="hero-check-in" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Check-in
              </label>
              <input
                id="hero-check-in"
                name="check_in"
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full px-4 py-3 bg-muted rounded-xl border-0 focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>

            {/* Check-out */}
            <div className="space-y-2">
              <label htmlFor="hero-check-out" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Check-out
              </label>
              <input
                id="hero-check-out"
                name="check_out"
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full px-4 py-3 bg-muted rounded-xl border-0 focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>

            {/* Guests */}
            <div className="space-y-2">
              <label htmlFor="hero-guests" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Guests
              </label>
              <select
                id="hero-guests"
                name="guests"
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                className="w-full px-4 py-3 bg-muted rounded-xl border-0 focus:ring-2 focus:ring-primary outline-none transition-all"
              >
                <option value="1">1 Guest</option>
                <option value="2">2 Guests</option>
                <option value="3">3 Guests</option>
                <option value="4">4+ Guests</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <Button
              type="submit"
              size="lg"
              className="px-8 py-6 text-lg font-semibold rounded-xl bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              <Search className="w-5 h-5 mr-2" />
              Search Homestays
            </Button>
          </div>
        </form>
      </motion.div>
      </div>
    </section>
  );
}
