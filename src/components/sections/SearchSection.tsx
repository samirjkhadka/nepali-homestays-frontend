import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  MapPin,
  Calendar,
  Users,
  Home,
  SlidersHorizontal,
  IndianRupee,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { DateRangePicker } from '@/components/DateRangePicker';
import { HOMESTAY_TYPES } from '@/data/districts';

export default function SearchSection() {
  const navigate = useNavigate();
  const [location, setLocation] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('2');
  const [homestayType, setHomestayType] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 25000]);
  const [showFilters, setShowFilters] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showCalendar) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCalendar]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (location.trim()) params.set('location', location.trim());
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    if (guests) params.set('guests', guests);
    if (homestayType) params.set('type', homestayType);
    if (priceRange[0] > 0) params.set('minPrice', String(priceRange[0]));
    if (priceRange[1] < 25000) params.set('maxPrice', String(priceRange[1]));
    navigate(`/search?${params.toString()}`);
  };

  const dateLabel = checkIn && checkOut
    ? `${new Date(checkIn + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${new Date(
        checkOut + 'T12:00:00'
      ).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
    : checkIn
      ? new Date(checkIn + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
        ' – Add checkout'
      : 'When?';

  return (
    <section className="relative z-30 mt-0 mb-24 md:mb-32">
      <div className="absolute inset-0 -top-2 -bottom-6 md:-bottom-8 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.03] to-transparent" />
      </div>
      <div className="section-container relative">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-card rounded-3xl shadow-floating border border-border overflow-hidden"
        >
          <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 px-6 md:px-8 py-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-primary" />
                <h2 className="font-display text-lg font-semibold text-foreground">Find Your Perfect Homestay</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowFilters((v) => !v)}
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {showFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  Location
                </label>
                <input
                  type="text"
                  placeholder="Where do you want to go?"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-3 bg-muted/60 rounded-xl border border-border/50 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all text-sm"
                />
              </div>
              <div className="space-y-1.5" ref={calendarRef}>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  Dates
                </label>
                <button
                  type="button"
                  onClick={() => setShowCalendar((v) => !v)}
                  className="w-full px-4 py-3 bg-muted/60 rounded-xl border border-border/50 text-left text-sm transition-all focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                >
                  {dateLabel}
                </button>
                {showCalendar && (
                  <div className="absolute right-0 top-full mt-2 z-50 bg-card border border-border rounded-xl shadow-xl p-3 calendar-popup min-w-[min(100vw-2rem,36rem)]">
                    <DateRangePicker
                      checkIn={checkIn}
                      checkOut={checkOut}
                      onCheckInChange={setCheckIn}
                      onCheckOutChange={(v) => {
                        setCheckOut(v);
                        if (v) setShowCalendar(false);
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  Guests
                </label>
                <select
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="w-full px-4 py-3 bg-muted/60 rounded-xl border border-border/50 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all text-sm"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={String(n)}>
                      {n} {n === 1 ? 'Guest' : 'Guests'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleSearch}
                  className="w-full px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all"
                >
                  Search
                </button>
              </div>
            </div>

            <motion.div
              initial={false}
              animate={{ height: showFilters ? 'auto' : 0, opacity: showFilters ? 1 : 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="pt-4 border-t border-border/50 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5 text-primary" />
                    Homestay Type
                  </label>
                  <select
                    value={homestayType}
                    onChange={(e) => setHomestayType(e.target.value)}
                    className="w-full px-4 py-3 bg-muted/60 rounded-xl border border-border/50 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all text-sm"
                  >
                    <option value="">All Types</option>
                    {HOMESTAY_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5 text-primary" />
                    Price Range (NPR {priceRange[0].toLocaleString()} - {priceRange[1].toLocaleString()})
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={25000}
                      step={500}
                      value={priceRange[0]}
                      onChange={(e) =>
                        setPriceRange([Math.min(Number(e.target.value), priceRange[1] - 500), priceRange[1]])
                      }
                      className="flex-1 accent-primary h-2"
                    />
                    <input
                      type="range"
                      min={0}
                      max={25000}
                      step={500}
                      value={priceRange[1]}
                      onChange={(e) =>
                        setPriceRange([priceRange[0], Math.max(Number(e.target.value), priceRange[0] + 500)])
                      }
                      className="flex-1 accent-primary h-2"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
