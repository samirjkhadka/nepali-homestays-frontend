import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Linkedin, Twitter, Mail } from 'lucide-react';
import { api } from '@/lib/api';

type Member = {
  name: string;
  role: string;
  image?: string;
  bio?: string;
  social?: { linkedin?: string; twitter?: string; email?: string };
};

type TeamConfig = {
  title?: string;
  subtitle?: string;
  members?: Member[];
};

export default function TeamPage() {
  const [config, setConfig] = useState<TeamConfig | null>(null);

  useEffect(() => {
    api
      .get<TeamConfig>('/api/settings/team')
      .then((res) => setConfig(res.data))
      .catch(() => setConfig({ title: 'Meet Our Team', members: [] }));
  }, []);

  const members = config?.members ?? [];

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-to-b from-primary/5 to-background pb-12 pt-12">
        <div className="section-container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 font-display text-4xl font-bold text-foreground md:text-5xl">
              {config?.title || 'Meet Our Team'}
            </h1>
            <p className="text-lg text-muted-foreground">
              {config?.subtitle || 'The passionate people working to bring you authentic Nepali experiences'}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="section-container py-16">
        {!members.length ? (
          <p className="text-center text-muted-foreground">Team details will appear here once added by the admin.</p>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {members.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="group overflow-hidden rounded-2xl border border-border bg-card"
              >
                {member.image && (
                  <div className="h-64 overflow-hidden">
                    <img src={member.image} alt={member.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  </div>
                )}
                <div className="p-6">
                  <h3 className="font-display text-xl font-semibold">{member.name}</h3>
                  <p className="text-sm text-primary">{member.role}</p>
                  {member.bio && <p className="mt-3 text-sm text-muted-foreground">{member.bio}</p>}
                  <div className="mt-4 flex gap-3">
                    {member.social?.linkedin && (
                      <a href={member.social.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn">
                        <Linkedin className="h-4 w-4" />
                      </a>
                    )}
                    {member.social?.twitter && (
                      <a href={member.social.twitter} target="_blank" rel="noreferrer" aria-label="Twitter">
                        <Twitter className="h-4 w-4" />
                      </a>
                    )}
                    {member.social?.email && (
                      <a href={`mailto:${member.social.email}`} aria-label="Email">
                        <Mail className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        <div className="mt-10 text-center">
          <Link to="/contact" className="text-primary hover:underline">
            Contact us
          </Link>
        </div>
      </section>
    </div>
  );
}
