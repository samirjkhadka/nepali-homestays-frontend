import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Briefcase } from 'lucide-react';
import { api } from '@/lib/api';

type Job = {
  title: string;
  department?: string;
  location?: string;
  type?: string;
  description?: string;
};

type CareersConfig = {
  title?: string;
  subtitle?: string;
  jobs?: Job[];
  benefits?: string[];
};

export default function CareersPage() {
  const [config, setConfig] = useState<CareersConfig | null>(null);

  useEffect(() => {
    api
      .get<CareersConfig>('/api/settings/careers')
      .then((res) => setConfig(res.data))
      .catch(() => setConfig({ jobs: [], benefits: [] }));
  }, []);

  const jobs = config?.jobs ?? [];
  const benefits = config?.benefits ?? [];

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-to-b from-primary/5 to-background pb-12 pt-12">
        <div className="section-container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 font-display text-4xl font-bold md:text-5xl">{config?.title || 'Careers'}</h1>
            <p className="text-lg text-muted-foreground">
              {config?.subtitle || 'Join us in connecting travelers with authentic Nepali hospitality'}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="section-container py-12">
        <div className="grid gap-6">
          {jobs.map((job) => (
            <div key={job.title} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-semibold">{job.title}</h2>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {job.department && (
                      <span className="inline-flex items-center gap-1">
                        <Briefcase className="h-4 w-4" /> {job.department}
                      </span>
                    )}
                    {job.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-4 w-4" /> {job.location}
                      </span>
                    )}
                    {job.type && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-4 w-4" /> {job.type}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {job.description && <p className="mt-3 text-muted-foreground">{job.description}</p>}
            </div>
          ))}
          {!jobs.length && <p className="text-center text-muted-foreground">No open roles right now.</p>}
        </div>

        {benefits.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-4 font-display text-2xl font-semibold">Benefits</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {benefits.map((b) => (
                <li key={b} className="rounded-lg border border-border bg-card px-4 py-3 text-sm">
                  {b}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
