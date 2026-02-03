import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

type CmsSection = { id: number; section_key: string; title: string | null; content: string | null; display_place: string; sort_order: number };

export default function AboutPage() {
  const [sections, setSections] = useState<CmsSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ sections: CmsSection[] }>('/api/cms/sections?place=page')
      .then((res) => setSections(res.data.sections ?? []))
      .catch(() => setSections([]))
      .finally(() => setLoading(false));
  }, []);

  const about = sections.find((s) => s.section_key === 'about_us');
  const team = sections.find((s) => s.section_key === 'our_team');

  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <h1 className="font-display text-3xl font-bold text-primary-800 mb-8">About Us</h1>
      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-10 prose prose-primary max-w-none">
          {about && (
            <section>
              <h2 className="text-xl font-semibold text-primary-800 mb-3">{about.title || 'About Us'}</h2>
              <div className="text-foreground whitespace-pre-wrap">{about.content || 'Content not yet added.'}</div>
            </section>
          )}
          {team && (
            <section>
              <h2 className="text-xl font-semibold text-primary-800 mb-3">{team.title || 'Our Team'}</h2>
              <div className="text-foreground whitespace-pre-wrap">{team.content || 'Content not yet added.'}</div>
            </section>
          )}
          {!loading && sections.length === 0 && (
            <p className="text-muted-foreground">About us content will appear here once added by the admin.</p>
          )}
        </div>
      )}
    </div>
  );
}
