import { motion } from 'framer-motion';
import { Apple, Smartphone, Star, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const sectionContainerClass = 'container mx-auto px-4';

const appFeatures = [
  'Book homestays on the go',
  'Instant booking confirmations',
  'Secure in-app messaging',
  'Offline access to bookings',
  'Real-time notifications',
  'Easy payment options',
];

export default function AppDownloadSection() {
  return (
    <section id="app-download" className="py-20 bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden relative">
      {/* Coming soon flag */}
      <div className="absolute right-4 top-6 z-20 md:right-8 md:top-8">
        <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-accent-500 bg-accent-500/15 px-3 py-1.5 text-sm font-semibold text-accent-700">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-600" />
          </span>
          Coming soon
        </span>
      </div>

      <div className={sectionContainerClass}>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
              📱 Get the App
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Your Homestay Experience,<br />
              <span className="text-primary">Always in Your Pocket</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Download our mobile app for a seamless booking experience. Access exclusive deals,
              manage your trips, and connect with hosts — all from your phone.
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {appFeatures.map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-sm text-foreground">{feature}</span>
                </div>
              ))}
            </div>

            {/* App Rating */}
            <div className="flex items-center gap-4 mb-8 p-4 bg-card rounded-xl border border-border inline-flex">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                ))}
              </div>
              <div>
                <p className="font-semibold text-foreground">4.9 Rating</p>
                <p className="text-sm text-muted-foreground">10,000+ Downloads</p>
              </div>
            </div>

            {/* Download Buttons - disabled until launch */}
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                disabled
                className="pointer-events-none bg-foreground/80 hover:bg-foreground/80 text-background gap-3 px-6 opacity-90"
              >
                <Apple className="w-6 h-6" />
                <div className="text-left">
                  <div className="text-xs opacity-80">Download on the</div>
                  <div className="font-semibold">App Store</div>
                </div>
              </Button>
              <Button
                size="lg"
                disabled
                className="pointer-events-none bg-foreground/80 hover:bg-foreground/80 text-background gap-3 px-6 opacity-90"
              >
                <Smartphone className="w-6 h-6" />
                <div className="text-left">
                  <div className="text-xs opacity-80">Get it on</div>
                  <div className="font-semibold">Google Play</div>
                </div>
              </Button>
            </div>
          </motion.div>

          {/* Phone Mockups */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative h-[500px] md:h-[600px]"
          >
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl opacity-50" />

            {/* Phone 1 - Main */}
            <motion.div
              initial={{ y: 20 }}
              whileInView={{ y: 0 }}
              viewport={{ once: true }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
            >
              <div className="w-[240px] md:w-[280px] h-[480px] md:h-[560px] bg-foreground rounded-[3rem] p-2 shadow-2xl">
                <div className="w-full h-full bg-card rounded-[2.5rem] overflow-hidden relative">
                  {/* Phone Screen Content */}
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 w-20 h-6 bg-foreground rounded-full" />
                  <div className="h-full pt-12 px-4 pb-4">
                    <div className="h-full bg-gradient-to-b from-primary/10 to-accent/10 rounded-2xl p-4">
                      <div className="w-full h-32 bg-primary/20 rounded-xl mb-4" />
                      <div className="space-y-3">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                        <div className="h-20 bg-card rounded-xl border border-border" />
                        <div className="h-20 bg-card rounded-xl border border-border" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Phone 2 - Left */}
            <motion.div
              initial={{ y: 40, rotate: -12 }}
              whileInView={{ y: 20, rotate: -12 }}
              viewport={{ once: true }}
              className="absolute left-0 md:left-10 top-20 z-10 hidden md:block"
            >
              <div className="w-[180px] h-[360px] bg-foreground/80 rounded-[2rem] p-1.5 shadow-xl opacity-60">
                <div className="w-full h-full bg-card rounded-[1.5rem] overflow-hidden">
                  <div className="h-full bg-gradient-to-b from-accent/10 to-primary/10 p-3">
                    <div className="w-full h-20 bg-accent/20 rounded-lg mb-3" />
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded w-full" />
                      <div className="h-3 bg-muted rounded w-2/3" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Phone 3 - Right */}
            <motion.div
              initial={{ y: 40, rotate: 12 }}
              whileInView={{ y: 20, rotate: 12 }}
              viewport={{ once: true }}
              className="absolute right-0 md:right-10 top-32 z-10 hidden md:block"
            >
              <div className="w-[180px] h-[360px] bg-foreground/80 rounded-[2rem] p-1.5 shadow-xl opacity-60">
                <div className="w-full h-full bg-card rounded-[1.5rem] overflow-hidden">
                  <div className="h-full bg-gradient-to-b from-primary/10 to-accent/10 p-3">
                    <div className="w-full h-20 bg-primary/20 rounded-lg mb-3" />
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded w-full" />
                      <div className="h-3 bg-muted rounded w-2/3" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
