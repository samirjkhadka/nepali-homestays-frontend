import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
const Privacy = () => {
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
              Privacy Policy
            </h1>
            <p className="text-muted-foreground">Last updated: February 1, 2026</p>
          </motion.div>
        </div>
      </section>

      <section className="section-container py-12">
        <div className="max-w-3xl mx-auto prose prose-neutral dark:prose-invert">
          <h2>1. Information We Collect</h2>
          <p>We collect information you provide directly, including name, email, phone number, and payment details when you create an account or make a booking.</p>
          
          <h2>2. How We Use Your Information</h2>
          <p>We use your information to process bookings, communicate with you, improve our services, and send relevant marketing communications (with your consent).</p>
          
          <h2>3. Information Sharing</h2>
          <p>We share necessary information with hosts to facilitate your stay. We do not sell your personal information to third parties.</p>
          
          <h2>4. Data Security</h2>
          <p>We implement industry-standard security measures to protect your data. Payment information is encrypted and processed through secure payment providers.</p>
          
          <h2>5. Your Rights</h2>
          <p>You have the right to access, correct, or delete your personal information. Contact us at privacy@nepalihomestays.com to exercise these rights.</p>
          
          <h2>6. Cookies</h2>
          <p>We use cookies to improve your experience. See our Cookie Policy for details.</p>
          
          <h2>7. Contact Us</h2>
          <p>For privacy-related questions, contact our Data Protection Officer at privacy@nepalihomestays.com.</p>
        </div>
      </section>
</div>
  );
};

export default Privacy;