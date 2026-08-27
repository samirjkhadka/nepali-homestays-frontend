import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, Users, MapPin, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ExperienceBookingPanel } from '@/components/booking/ExperienceBookingPanel';
import { api } from '@/lib/api';
import { getImageDisplayUrl } from '@/lib/image-url';

interface Experience {
  id: number;
  name: string;
  description: string | null;
  price_npr: string | number;
  unit: string;
  duration_minutes: number | null;
  min_participants: number;
  max_participants: number | null;
  standalone_bookable: boolean;
  image_url: string | null;
  category: { id: number; name: string } | null;
  listing: { id: number; title: string | null; location: string | null };
}

function formatDuration(mins: number | null): string | null {
  if (!mins || mins <= 0) return null;
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

/**
 * One experience, with its booking panel.
 *
 * Exists so a standalone booking has somewhere to happen. The catalogue used to
 * link through to the homestay, which is the wrong destination for someone who
 * wants a cooking class and not a bed.
 */
export default function ExperienceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [experience, setExperience] = useState<Experience | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get<{ experience: Experience }>(`/api/experiences/${id}`)
      .then((res) => setExperience(res.data?.experience ?? null))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="mx-auto max-w-5xl px-4 py-12"><p className="text-muted-foreground">Loading…</p></div>;
  }

  if (notFound || !experience) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="font-display text-xl font-semibold">Experience not found</h1>
        <p className="mt-2 text-muted-foreground">It may have been withdrawn by the host.</p>
        <Link to="/things-to-do" className="mt-4 inline-flex items-center gap-1 text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to things to do
        </Link>
      </div>
    );
  }

  const duration = formatDuration(experience.duration_minutes);
  const price = Number(experience.price_npr) || 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link to="/things-to-do" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Things to do
      </Link>

      {experience.image_url && (
        <img
          src={getImageDisplayUrl(experience.image_url)}
          alt=""
          className="mb-6 h-64 w-full rounded-lg object-cover sm:h-80"
        />
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div>
          {experience.category && (
            <span className="rounded-full bg-accent-100 px-2.5 py-1 text-xs text-accent-800">
              {experience.category.name}
            </span>
          )}

          <h1 className="mt-3 font-display text-3xl font-semibold text-foreground">{experience.name}</h1>

          <p className="mt-2 flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <Link to={`/listings/${experience.listing.id}`} className="hover:underline">
              {experience.listing.title || experience.listing.location}
            </Link>
          </p>

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {duration && <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{duration}</span>}
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {experience.max_participants
                ? `${experience.min_participants}–${experience.max_participants} people`
                : `${experience.min_participants}+ people`}
            </span>
          </div>

          {experience.description && (
            <div className="mt-6 border-t pt-6">
              <p className="whitespace-pre-line leading-relaxed text-foreground">{experience.description}</p>
            </div>
          )}

          {!experience.standalone_bookable && (
            <Card className="mt-6">
              <CardContent className="p-5">
                <p className="font-medium">This one comes with a stay</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  The host offers it to guests staying at {experience.listing.title || 'the homestay'}. Book the stay
                  and add it at checkout.
                </p>
                <Link
                  to={`/listings/${experience.listing.id}`}
                  className="mt-3 inline-block text-sm text-primary hover:underline"
                >
                  See the homestay
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {experience.standalone_bookable && (
          <ExperienceBookingPanel
            experienceId={experience.id}
            price={price}
            unit={experience.unit}
            minParticipants={experience.min_participants}
            maxParticipants={experience.max_participants}
          />
        )}
      </div>
    </div>
  );
}
