import { motion } from 'framer-motion';
import { Apple, Smartphone, Star, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHomeContent } from '@/hooks/useHomeContent';

export default function MobileAppSection() {
  const { content } = useHomeContent();
  const app = content?.mobile_app;
  const features = app?.features?.length
    ? app.features
    : [
        'Book homestays on the go',
        'Instant booking confirmations',
        'Secure in-app messaging',
        'Offline access to bookings',
        'Real-time notifications',
        'Easy payment options',
      ];

  const openStore = (url?: string) => {
    if (url?.trim()) window.open(url.trim(), '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden relative">
      {app?.coming_soon !== false && (
        <div className="absolute right-4 top-6 z-20 md:right-8 md:top-8">
          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-accent-500 bg-accent-500/15 px-3 py-1.5 text-sm font-semibold text-accent-700">
            Coming soon
          </span>
        </div>
      )}
      <div className="section-container">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
              {app?.badge || 'Get the App'}
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              {app?.title || 'Your Homestay Experience,'}
              <br />
              <span className="text-primary">{app?.title_accent || 'Always in Your Pocket'}</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              {app?.subtitle ||
                'Download our mobile app for a seamless booking experience. Access exclusive deals, manage your trips, and connect with hosts — all from your phone.'}
            </p>

            <div className="grid grid-cols-2 gap-3 mb-8">
              {features.map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-sm text-foreground">{feature}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4 mb-8 p-4 bg-card rounded-xl border border-border inline-flex">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                ))}
              </div>
              <div>
                <p className="font-semibold text-foreground">{app?.rating || '4.9'} Rating</p>
                <p className="text-sm text-muted-foreground">{app?.downloads_label || '10,000+ Downloads'}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className="bg-foreground hover:bg-foreground/90 text-background gap-3 px-6"
                onClick={() => openStore(app?.app_store_url)}
                disabled={!app?.app_store_url?.trim()}
              >
                <Apple className="w-6 h-6" />
                <div className="text-left">
                  <div className="text-xs opacity-80">Download on the</div>
                  <div className="font-semibold">App Store</div>
                </div>
              </Button>
              <Button
                size="lg"
                className="bg-foreground hover:bg-foreground/90 text-background gap-3 px-6"
                onClick={() => openStore(app?.play_store_url)}
                disabled={!app?.play_store_url?.trim()}
              >
                <Smartphone className="w-6 h-6" />
                <div className="text-left">
                  <div className="text-xs opacity-80">Get it on</div>
                  <div className="font-semibold">Google Play</div>
                </div>
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative h-[420px] md:h-[520px] flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl opacity-50" />
            <div className="relative w-56 h-[420px] rounded-[2rem] border-4 border-foreground/20 bg-card shadow-elevated overflow-hidden">
              <div className="h-full bg-gradient-to-b from-primary/20 to-background p-6 flex flex-col justify-end">
                <p className="font-display text-xl font-bold text-foreground">Nepali Homestays</p>
                <p className="text-sm text-muted-foreground mt-2">Book authentic stays on the go.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
