import { motion } from 'framer-motion';
import { MapPin, Clock, Briefcase, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const jobs = [
  {
    title: 'Community Relations Manager',
    department: 'Operations',
    location: 'Kathmandu, Nepal',
    type: 'Full-time',
    description: 'Build and maintain relationships with our host families across Nepal.',
  },
  {
    title: 'Customer Success Specialist',
    department: 'Support',
    location: 'Remote',
    type: 'Full-time',
    description: 'Help travelers plan their perfect homestay experience.',
  },
  {
    title: 'Content Writer',
    department: 'Marketing',
    location: 'Kathmandu / Remote',
    type: 'Part-time',
    description: 'Create engaging content about Nepal travel and culture.',
  },
  {
    title: 'Full Stack Developer',
    department: 'Technology',
    location: 'Remote',
    type: 'Full-time',
    description: 'Build and improve our booking platform using modern technologies.',
  },
];

const benefits = [
  'Competitive salary',
  'Flexible working hours',
  'Remote work options',
  'Travel allowance',
  'Health insurance',
  'Professional development',
];

const Careers = () => {
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
              Join Our Team
            </h1>
            <p className="text-lg text-muted-foreground">
              Help us connect travelers with authentic Nepali experiences
            </p>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="section-container py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-card rounded-2xl border border-border p-8"
        >
          <h2 className="font-display text-2xl font-bold text-foreground mb-6 text-center">Why Work With Us?</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {benefits.map((benefit) => (
              <div key={benefit} className="text-center p-4 bg-muted rounded-xl">
                <p className="text-sm font-medium text-foreground">{benefit}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Open Positions */}
      <section className="section-container py-12">
        <h2 className="font-display text-2xl font-bold text-foreground mb-8">Open Positions</h2>
        <div className="space-y-4">
          {jobs.map((job, index) => (
            <motion.div
              key={job.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-card rounded-2xl border border-border p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-display text-xl font-semibold text-foreground mb-2">{job.title}</h3>
                  <p className="text-muted-foreground text-sm mb-3">{job.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      {job.department}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {job.type}
                    </span>
                  </div>
                </div>
                <Button className="shrink-0 group">
                  Apply Now
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
</div>
  );
};

export default Careers;