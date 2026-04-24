import { motion } from 'framer-motion';
import { Cookie } from 'lucide-react';
const Cookies = () => {
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
              <Cookie className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Cookie Policy
            </h1>
            <p className="text-muted-foreground">Last updated: February 1, 2026</p>
          </motion.div>
        </div>
      </section>

      <section className="section-container py-12">
        <div className="max-w-3xl mx-auto prose prose-neutral dark:prose-invert">
          <h2>What Are Cookies?</h2>
          <p>Cookies are small text files stored on your device when you visit our website. They help us remember your preferences and improve your experience.</p>
          
          <h2>Types of Cookies We Use</h2>
          
          <h3>Essential Cookies</h3>
          <p>Required for the website to function. These enable secure login, booking processes, and basic site functionality.</p>
          
          <h3>Analytics Cookies</h3>
          <p>Help us understand how visitors use our site. We use this data to improve our services and user experience.</p>
          
          <h3>Preference Cookies</h3>
          <p>Remember your settings like language and currency preferences.</p>
          
          <h3>Marketing Cookies</h3>
          <p>Used to show relevant advertisements. These are only set with your consent.</p>
          
          <h2>Managing Cookies</h2>
          <p>You can control cookies through your browser settings. Blocking essential cookies may affect site functionality.</p>
          
          <h2>Contact Us</h2>
          <p>Questions about our cookie policy? Contact us at privacy@nepalihomestays.com.</p>
        </div>
      </section>
</div>
  );
};

export default Cookies;