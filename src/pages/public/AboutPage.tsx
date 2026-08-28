import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { SafeHtml } from '@/components/SafeHtml';

type CmsSection = { id: number; section_key: string; title: string | null; content: string | null; display_place: string; sort_order: number };

function CmsBody({ content }: { content: string | null }) {
  const html = content || 'Content not yet added.';
  const looksLikeHtml = /<[a-z][\s\S]*>/i.test(html);
  if (looksLikeHtml) return <SafeHtml html={html} className="mt-4" />;
  return <div className="prose prose-sm mt-4 max-w-none whitespace-pre-wrap text-foreground">{html}</div>;
}

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
    <div className="min-h-screen w-full overflow-x-hidden bg-background pb-16">
      <section className="bg-gradient-to-b from-primary/5 to-background pb-10 pt-12">
        <div className="section-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-3xl text-center"
          >
            <h1 className="font-display text-4xl font-bold text-foreground md:text-5xl">About us</h1>
            <p className="mt-4 text-lg text-muted-foreground">Authentic homestays, community, and the stories behind the stays.</p>
          </motion.div>
        </div>
      </section>
      <div className="section-container py-12">
        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : (
          <div className="mx-auto max-w-3xl space-y-10">
            {about && (
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-2xl border border-border bg-card p-8 shadow-soft"
              >
                <h2 className="font-display text-2xl font-semibold text-foreground">{about.title || 'About us'}</h2>
                <CmsBody content={about.content} />
              </motion.section>
            )}
            {team && (
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-2xl border border-border bg-card p-8 shadow-soft"
              >
                <h2 className="font-display text-2xl font-semibold text-foreground">{team.title || 'Our team'}</h2>
                <CmsBody content={team.content} />
              </motion.section>
            )}
            {!loading && sections.length === 0 && (
              <p className="text-center text-muted-foreground">About us content will appear here once added by the admin.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
