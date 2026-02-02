import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Mountain } from '@/components/icons';
import { PROVINCES, getProvinceSearchParam } from '@/data/provinces';

/** Section header image (Nepal landscape); card fallback uses gradient + icon */
const PROVINCES_HEADER_IMAGE = 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&q=80';

export default function ProvinceExplorer() {
  return (
    <section className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-primary-200 shadow-md">
        <img
          src={PROVINCES_HEADER_IMAGE}
          alt=""
          className="h-48 w-full object-cover md:h-56"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-900/80 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
          <h2 className="text-3xl font-bold text-white drop-shadow md:text-4xl">Explore by Province</h2>
          <p className="mt-2 text-white/95">
            Discover homestays across Nepal&apos;s seven provinces
          </p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {PROVINCES.map((province) => (
          <Link
            key={province.id}
            to={`/search?${getProvinceSearchParam(province.slug)}`}
            className="group block"
          >
            <Card className="overflow-hidden transition-all hover:shadow-lg hover:ring-2 hover:ring-accent-400">
              <div className="flex h-32 items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200 group-hover:from-primary-200 group-hover:to-primary-300">
                <Mountain className="h-14 w-14 text-primary-600" />
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-primary-800 group-hover:text-accent-600">
                  {province.name}
                </h3>
                {province.description && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {province.description}
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
