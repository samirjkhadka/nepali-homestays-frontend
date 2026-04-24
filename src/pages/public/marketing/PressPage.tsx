import { motion } from 'framer-motion';
import { Calendar, ExternalLink, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

const pressReleases = [
  {
    title: 'Nepali Homestays Expands to All 7 Provinces',
    date: '2026-01-15',
    excerpt: 'Platform now offers authentic homestay experiences across every province of Nepal.',
  },
  {
    title: 'Partnership with Nepal Tourism Board Announced',
    date: '2025-12-01',
    excerpt: 'Collaboration aims to promote sustainable community-based tourism in Nepal.',
  },
  {
    title: '10,000 Happy Guests Milestone Reached',
    date: '2025-10-20',
    excerpt: 'Celebrating a decade of connecting travelers with Nepali hospitality.',
  },
];

const mediaFeatures = [
  { name: 'Lonely Planet', logo: 'LP' },
  { name: 'National Geographic', logo: 'NG' },
  { name: 'BBC Travel', logo: 'BBC' },
  { name: 'Travel + Leisure', logo: 'T+L' },
];

const Press = () => {
  return (
    <div className="min-h-screen bg-background">
      <section className="pt-12 pb-12 bg-gradient-to-b from-primary/5 to-background">
        <div className="section-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Press & Media
            </h1>
            <p className="text-lg text-muted-foreground">
              Latest news and media resources about Nepali Homestays
            </p>
          </motion.div>
        </div>
      </section>

      {/* Featured In */}
      <section className="section-container py-12">
        <h2 className="font-display text-2xl font-bold text-foreground mb-8 text-center">Featured In</h2>
        <div className="flex flex-wrap justify-center gap-8">
          {mediaFeatures.map((media) => (
            <div key={media.name} className="w-24 h-24 bg-muted rounded-2xl flex items-center justify-center">
              <span className="font-display font-bold text-2xl text-muted-foreground">{media.logo}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Press Releases */}
      <section className="section-container py-12">
        <h2 className="font-display text-2xl font-bold text-foreground mb-8">Press Releases</h2>
        <div className="space-y-4">
          {pressReleases.map((release, index) => (
            <motion.div
              key={release.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-card rounded-2xl border border-border p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(release.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                  <h3 className="font-display text-xl font-semibold text-foreground mb-2">{release.title}</h3>
                  <p className="text-muted-foreground">{release.excerpt}</p>
                </div>
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Media Kit */}
      <section className="section-container py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-primary/5 rounded-2xl p-8 text-center"
        >
          <h3 className="font-display text-2xl font-bold text-foreground mb-4">Media Kit</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Download our press kit including logos, brand guidelines, and high-resolution images.
          </p>
          <Button size="lg">
            <Download className="w-4 h-4 mr-2" />
            Download Media Kit
          </Button>
        </motion.div>
      </section>
</div>
  );
};

export default Press;