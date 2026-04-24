import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqCategories = [
  {
    category: 'Booking',
    questions: [
      {
        q: 'How do I book a homestay?',
        a: 'Browse our listings, select your preferred homestay, choose your dates and number of guests, then click "Book Now". You\'ll be guided through the payment process to confirm your reservation.',
      },
      {
        q: 'Can I book for someone else?',
        a: 'Yes, you can book on behalf of family or friends. Just make sure to provide their contact information and let the host know who will be staying.',
      },
      {
        q: 'How far in advance should I book?',
        a: 'We recommend booking at least 2-3 weeks in advance, especially during peak season (October-November and March-April). Popular homestays fill up quickly.',
      },
    ],
  },
  {
    category: 'Payment',
    questions: [
      {
        q: 'What payment methods do you accept?',
        a: 'We accept major credit cards (Visa, Mastercard, American Express), PayPal, and bank transfers. Local payment options may be available in some regions.',
      },
      {
        q: 'When will I be charged?',
        a: 'You\'ll be charged immediately upon booking confirmation. The payment is held securely and released to the host 24 hours after check-in.',
      },
      {
        q: 'Are there any hidden fees?',
        a: 'No hidden fees. The total price shown before booking includes the nightly rate, service fee, and any applicable taxes. Some hosts may charge extra for additional services.',
      },
    ],
  },
  {
    category: 'Stay Experience',
    questions: [
      {
        q: 'What should I bring to a homestay?',
        a: 'Bring comfortable clothes, toiletries, and any personal medications. Check with your host about specific items like towels or adapters. Modest dress is appreciated in traditional areas.',
      },
      {
        q: 'Are meals included?',
        a: 'Most homestays include breakfast, and many offer lunch and dinner options. Meal inclusions are clearly listed on each homestay page.',
      },
      {
        q: 'Can I communicate with my host before arrival?',
        a: 'Yes! After booking, you can message your host through our platform to ask questions, share arrival details, or request special accommodations.',
      },
    ],
  },
  {
    category: 'Cancellation & Refunds',
    questions: [
      {
        q: 'How do I cancel a booking?',
        a: 'Go to "My Bookings" in your account, select the reservation you want to cancel, and click "Cancel Booking". Refund amount depends on the host\'s cancellation policy.',
      },
      {
        q: 'How long do refunds take?',
        a: 'Refunds are typically processed within 5-10 business days. The exact timing depends on your payment method and bank.',
      },
    ],
  },
];

const FAQs = () => {
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
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-muted-foreground">
              Find answers to common questions about booking and staying at Nepali homestays
            </p>
          </motion.div>
        </div>
      </section>

      <section className="section-container py-12">
        <div className="max-w-3xl mx-auto space-y-12">
          {faqCategories.map((category, catIndex) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: catIndex * 0.1 }}
            >
              <h2 className="font-display text-2xl font-bold text-foreground mb-6">{category.category}</h2>
              <Accordion type="single" collapsible className="space-y-4">
                {category.questions.map((faq, index) => (
                  <AccordionItem key={index} value={`${catIndex}-${index}`} className="bg-card rounded-xl border border-border px-6">
                    <AccordionTrigger className="text-left font-medium hover:no-underline">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          ))}
        </div>
      </section>
</div>
  );
};

export default FAQs;