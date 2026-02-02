import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useCurrency } from '@/lib/currency';
import {
  HeroCarousel,
  SearchSection,
  ProvinceExplorer,
  HowItWorks,
  BlogsAndNews,
  Testimonials,
  Footer,
} from '@/components/sections';

type Listing = {
  id: number;
  title: string;
  location: string;
  price_per_night: string;
  max_guests: number;
  image_url?: string | null;
};

function youtubeVideoId(url: string): string | null {
  if (!url?.trim()) return null;
  const u = url.trim();
  const m = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export default function HomePage() {
  const navigate = useNavigate();
  const { format: formatPrice } = useCurrency();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [listingsError, setListingsError] = useState<string | null>(null);
  const [landingYoutubeUrl, setLandingYoutubeUrl] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setListingsError(null);
    api
      .get<{ listings: Listing[]; total?: number }>('/api/listings', { params: { limit: 6 } })
      .then((res) => {
        const data = res.data?.listings ?? res.data;
        setListings(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        setListings([]);
        setListingsError(err.response?.data?.message || err.message || 'Could not load listings. Is the backend running on port 3000?');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api
      .get<{ landing_youtube_url?: string | null }>('/api/settings/landing')
      .then((res) => setLandingYoutubeUrl(res.data.landing_youtube_url ?? null))
      .catch(() => setLandingYoutubeUrl(null));
  }, []);

  const videoId = landingYoutubeUrl ? youtubeVideoId(landingYoutubeUrl) : null;

  return (
    <div className="space-y-16 md:space-y-20 overflow-x-hidden">
      <HeroCarousel listings={listings} />
      <SearchSection />

      <ProvinceExplorer />

      {videoId && (
        <section className="space-y-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-primary-800 md:text-4xl">Discover Nepal</h2>
            <p className="mt-2 text-muted-foreground">See what awaits you in Nepali homestays</p>
          </div>
          <div className="mx-auto max-w-4xl overflow-hidden rounded-xl border border-primary-200 bg-primary-100 shadow-lg">
            <div className="aspect-video w-full">
              <iframe
                title="Nepali Homestays video"
                src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          </div>
        </section>
      )}

      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-primary-800 md:text-4xl">Featured homestays</h2>
          <p className="mt-2 text-muted-foreground">
            Handpicked homestays for an authentic stay
          </p>
        </div>
        {loading ? (
          <p className="py-8 text-center text-muted-foreground">Loading...</p>
        ) : listingsError ? (
          <div className="col-span-full rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
            <p className="font-medium text-destructive">{listingsError}</p>
            <p className="mt-2 text-sm text-muted-foreground">Ensure the backend is running (npm run dev in backend/) and the database is seeded.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.length === 0 && (
              <p className="col-span-full py-8 text-center text-muted-foreground">
                No listings yet. Be the first to add one as a host!
              </p>
            )}
            {listings.map((listing) => (
              <Card
                key={listing.id}
                className="overflow-hidden transition-shadow hover:shadow-lg"
              >
                <div className="aspect-video bg-primary-100">
                  {listing.image_url ? (
                    <img
                      src={
                        listing.image_url.startsWith('http')
                          ? listing.image_url
                          : (import.meta.env.VITE_API_URL || '') + listing.image_url
                      }
                      alt={listing.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Bed className="h-12 w-12 text-primary-400" />
                    </div>
                  )}
                </div>
                <CardHeader className="pb-2">
                  <CardContent className="p-0">
                    <h3 className="font-semibold text-primary-800">{listing.title}</h3>
                    <p className="text-sm text-muted-foreground">{listing.location}</p>
                  </CardContent>
                </CardHeader>
                <CardFooter className="flex items-center justify-between pt-0">
                  <span className="font-medium text-accent-600">
                    {formatPrice(listing.price_per_night)}/night
                  </span>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/listings/${listing.id}`)}
                    className="bg-primary-600 hover:bg-primary-700"
                  >
                    View Details
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </section>

      <BlogsAndNews />

      <HowItWorks />

      <Testimonials />

      <Footer />
    </div>
  );
}
