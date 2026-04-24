import { motion } from 'framer-motion';
import { Shield, CheckCircle, Phone, AlertTriangle } from 'lucide-react';
const safetyFeatures = [
  {
    title: 'Verified Hosts',
    description: 'All hosts undergo identity verification and background checks before listing.',
  },
  {
    title: 'Secure Payments',
    description: 'Your payment is held securely and only released to hosts after check-in.',
  },
  {
    title: '24/7 Support',
    description: 'Our team is available around the clock to assist with any emergencies.',
  },
  {
    title: 'Property Standards',
    description: 'Every homestay is inspected to meet our safety and cleanliness standards.',
  },
  {
    title: 'Secure Messaging',
    description: 'Communicate with hosts through our secure in-app messaging system.',
  },
  {
    title: 'Travel Insurance',
    description: 'Optional travel insurance available for all bookings.',
  },
];

const Safety = () => {
  return (
    <div className="min-h-screen bg-background">
      <section className="pt-12 pb-12 bg-gradient-to-b from-primary/5 to-background">
        <div className="section-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Your Safety Matters
            </h1>
            <p className="text-lg text-muted-foreground">
              We're committed to making your homestay experience safe and secure
            </p>
          </motion.div>
        </div>
      </section>

      {/* Safety Features */}
      <section className="section-container py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {safetyFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-card rounded-2xl border border-border p-6"
            >
              <CheckCircle className="w-8 h-8 text-green-500 mb-4" />
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Emergency Contact */}
      <section className="section-container py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-red-50 dark:bg-red-950/20 rounded-2xl p-8"
        >
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-8 h-8 text-red-500 shrink-0" />
            <div>
              <h3 className="font-display text-xl font-bold text-foreground mb-2">Emergency?</h3>
              <p className="text-muted-foreground mb-4">
                If you're in immediate danger, contact local emergency services first. Then reach out to us:
              </p>
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <Phone className="w-5 h-5" />
                <span>Emergency Hotline: +977 9800-123456</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>
</div>
  );
};

export default Safety;