import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';

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

export default function CmsPage() {
  const { slug } = useParams<{ slug: string }>();
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
    api
      .get<{ title: string | null; content: string | null }>(`/api/cms/sections/${key}`)
      .then((res) => setSection(res.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [key]);

  if (loading) return <div className="container mx-auto px-4 py-16 max-w-3xl"><p className="text-muted-foreground">Loading…</p></div>;
  if (notFound || !section) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-3xl text-center">
        <p className="text-muted-foreground">Page not found.</p>
        <Link to="/" className="inline-flex items-center gap-2 mt-4 text-accent hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>
      <h1 className="font-display text-3xl font-bold text-primary-800 mb-8">{section.title || slug}</h1>
      <div className="prose prose-primary max-w-none text-foreground whitespace-pre-wrap">{section.content || 'Content not yet added.'}</div>
    </div>
  );
}
