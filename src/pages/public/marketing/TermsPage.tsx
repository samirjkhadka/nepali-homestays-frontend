import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
const Terms = () => {
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
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Terms of Service
            </h1>
            <p className="text-muted-foreground">Last updated: February 1, 2026</p>
          </motion.div>
        </div>
      </section>

      <section className="section-container py-12">
        <div className="max-w-3xl mx-auto prose prose-neutral dark:prose-invert">
          <h2>1. Acceptance of Terms</h2>
          <p>By using Nepali Homestays, you agree to these Terms of Service. If you do not agree, please do not use our platform.</p>
          
          <h2>2. User Accounts</h2>
          <p>You must provide accurate information when creating an account. You are responsible for maintaining the security of your account.</p>
          
          <h2>3. Bookings</h2>
          <p>Bookings are subject to availability and host acceptance. Payment is required at the time of booking. Cancellation policies vary by listing.</p>
          
          <h2>4. Guest Responsibilities</h2>
          <p>Guests agree to respect host properties, follow house rules, and treat hosts and their families with courtesy. Damages may result in additional charges.</p>
          
          <h2>5. Host Responsibilities</h2>
          <p>Hosts agree to provide accurate listing information, maintain clean and safe accommodations, and honor confirmed bookings.</p>
          
          <h2>6. Prohibited Activities</h2>
          <p>Users may not engage in illegal activities, harassment, fraud, or any behavior that violates these terms or local laws.</p>
          
          <h2>7. Limitation of Liability</h2>
          <p>Nepali Homestays is a platform connecting guests and hosts. We are not responsible for the actions of users or conditions at homestays.</p>
          
          <h2>8. Changes to Terms</h2>
          <p>We may update these terms. Continued use of the platform constitutes acceptance of updated terms.</p>
        </div>
      </section>
</div>
  );
};

export default Terms;