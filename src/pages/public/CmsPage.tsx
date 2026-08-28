import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { SafeHtml } from '@/components/SafeHtml';

const SLUG_TO_KEY: Record<string, string> = {
  privacy: 'privacy_policy',
  terms: 'terms_of_service',
  cookies: 'cookie_policy',
  faqs: 'faqs',
  help: 'help_center',
  safety: 'safety_information',
  cancellation: 'cancellation_policy',
  'about-us': 'about_us',
  'our-team': 'our_team',
  address: 'address',
};

type Props = { slugOverride?: string };

export default function CmsPage({ slugOverride }: Props) {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const slug = slugOverride || paramSlug;
  const key = slug ? SLUG_TO_KEY[slug] || slug.replace(/-/g, '_') : '';
  const [section, setSection] = useState<{ title: string | null; content: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!key) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setNotFound(false);
    api
      .get<{ title: string | null; content: string | null }>(`/api/cms/sections/${key}`)
      .then((res) => setSection(res.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [key]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }
  if (notFound || !section) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-muted-foreground">Page not found.</p>
        <Link to="/" className="mt-4 inline-flex items-center gap-2 text-accent hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
      </div>
    );
  }

  const html = section.content || '';
  const looksLikeHtml = /<[a-z][\s\S]*>/i.test(html);

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-to-b from-primary/5 to-background pb-10 pt-12">
        <div className="section-container">
          <div className="mx-auto max-w-3xl">
            <Link to="/" className="mb-6 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
            <h1 className="font-display text-4xl font-bold text-foreground md:text-5xl">
              {section.title || slug}
            </h1>
          </div>
        </div>
      </section>
      <div className="section-container py-12">
        <div className="prose prose-neutral mx-auto max-w-3xl dark:prose-invert">
          {looksLikeHtml ? (
            <SafeHtml html={html} />
          ) : (
            <div className="whitespace-pre-wrap text-foreground">{html || 'Content not yet added.'}</div>
          )}
        </div>
      </div>
    </div>
  );
}
