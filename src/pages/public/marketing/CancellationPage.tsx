import { motion } from 'framer-motion';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
const policies = [
  {
    name: 'Flexible',
    description: 'Full refund up to 24 hours before check-in',
    details: [
      'Full refund if cancelled at least 24 hours before check-in',
      '50% refund if cancelled less than 24 hours before check-in',
      'No refund after check-in',
    ],
  },
  {
    name: 'Moderate',
    description: 'Full refund up to 5 days before check-in',
    details: [
      'Full refund if cancelled at least 5 days before check-in',
      '50% refund if cancelled between 24 hours and 5 days before check-in',
      'No refund if cancelled less than 24 hours before check-in',
    ],
  },
  {
    name: 'Strict',
    description: '50% refund up to 7 days before check-in',
    details: [
      '50% refund if cancelled at least 7 days before check-in',
      'No refund if cancelled less than 7 days before check-in',
    ],
  },
];

const Cancellation = () => {
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
              <Calendar className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Cancellation Policy
            </h1>
            <p className="text-lg text-muted-foreground">
              Each homestay has its own cancellation policy. Check before booking.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Policy Types */}
      <section className="section-container py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {policies.map((policy, index) => (
            <motion.div
              key={policy.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-card rounded-2xl border border-border p-6"
            >
              <h3 className="font-display text-xl font-bold text-foreground mb-2">{policy.name}</h3>
              <p className="text-primary font-medium mb-4">{policy.description}</p>
              <ul className="space-y-3">
                {policy.details.map((detail, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                    {detail}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Important Note */}
      <section className="section-container py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-amber-50 dark:bg-amber-950/20 rounded-2xl p-8"
        >
          <div className="flex items-start gap-4">
            <AlertCircle className="w-8 h-8 text-amber-500 shrink-0" />
            <div>
              <h3 className="font-display text-xl font-bold text-foreground mb-2">Important Note</h3>
              <p className="text-muted-foreground">
                The cancellation policy for each homestay is displayed on the listing page before you book. 
                Service fees are non-refundable. In case of extenuating circumstances (natural disasters, 
                government travel restrictions, etc.), additional exceptions may apply. Contact our support 
                team for assistance.
              </p>
            </div>
          </div>
        </motion.div>
      </section>
</div>
  );
};

export default Cancellation;