import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Book, CreditCard, Calendar, Shield, MessageCircle, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';

const categories = [
  { icon: Book, title: 'Getting Started', count: 12, href: '/faqs' },
  { icon: Calendar, title: 'Bookings & Reservations', count: 18, href: '/faqs' },
  { icon: CreditCard, title: 'Payments & Refunds', count: 15, href: '/faqs' },
  { icon: Shield, title: 'Safety & Trust', count: 8, href: '/safety' },
  { icon: MessageCircle, title: 'Contact Support', count: 5, href: '/contact' },
];

const popularArticles = [
  { title: 'How to book a homestay', href: '/faqs' },
  { title: 'Cancellation policy explained', href: '/cancellation' },
  { title: 'Payment methods we accept', href: '/faqs' },
  { title: 'What to expect at a homestay', href: '/faqs' },
  { title: 'How to contact your host', href: '/faqs' },
  { title: 'Leaving a review', href: '/faqs' },
];

const Help = () => {
  const [searchQuery, setSearchQuery] = useState('');

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
              How can we help?
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Search our help center or browse categories below
            </p>
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 py-6 text-lg bg-card border-border"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="section-container py-12">
        <h2 className="font-display text-2xl font-bold text-foreground mb-8">Browse by Category</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat, index) => (
            <motion.div
              key={cat.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={cat.href} className="block bg-card rounded-2xl border border-border p-6 hover:shadow-lg transition-shadow group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <cat.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors">{cat.title}</h3>
                    <p className="text-muted-foreground text-sm">{cat.count} articles</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Popular Articles */}
      <section className="section-container py-12">
        <h2 className="font-display text-2xl font-bold text-foreground mb-8">Popular Articles</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {popularArticles.map((article, index) => (
            <motion.div
              key={article.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <Link to={article.href} className="flex items-center justify-between p-4 bg-card rounded-xl border border-border hover:bg-muted transition-colors group">
                <span className="text-foreground group-hover:text-primary transition-colors">{article.title}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
</div>
  );
};

export default Help;