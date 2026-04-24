import { motion } from 'framer-motion';
import { Clock, Users, Star, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const experiences = [
  {
    title: 'Traditional Nepali Cooking Class',
    host: 'Maya Gurung',
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
    duration: '3 hours',
    groupSize: '2-6',
    rating: 4.9,
    reviews: 124,
    price: 35,
    description: 'Learn to cook authentic dal bhat, momos, and more with a local family.',
  },
  {
    title: 'Sunrise Yoga in the Himalayas',
    host: 'Tenzing Lama',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
    duration: '2 hours',
    groupSize: '4-12',
    rating: 5.0,
    reviews: 89,
    price: 25,
    description: 'Start your day with meditation and yoga overlooking mountain peaks.',
  },
  {
    title: 'Village Pottery Workshop',
    host: 'Rajan Prajapati',
    image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800',
    duration: '4 hours',
    groupSize: '2-4',
    rating: 4.8,
    reviews: 56,
    price: 40,
    description: 'Create traditional Nepali pottery using centuries-old techniques.',
  },
  {
    title: 'Tea Plantation Tour',
    host: 'Sunita Rai',
    image: 'https://images.unsplash.com/photo-1582793988951-9aed5509eb97?w=800',
    duration: '5 hours',
    groupSize: '2-8',
    rating: 4.7,
    reviews: 78,
    price: 45,
    description: 'Explore organic tea gardens in Ilam and learn about tea production.',
  },
  {
    title: 'Thangka Painting Masterclass',
    host: 'Karma Lama',
    image: 'https://images.unsplash.com/photo-1558799401-1dcba79f4c42?w=800',
    duration: '6 hours',
    groupSize: '2-4',
    rating: 4.9,
    reviews: 42,
    price: 75,
    description: 'Learn the sacred Buddhist art of Thangka painting from a master artist.',
  },
  {
    title: 'Nepali Music & Dance Evening',
    host: 'Priya Sharma',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
    duration: '3 hours',
    groupSize: '4-20',
    rating: 4.8,
    reviews: 156,
    price: 30,
    description: 'Enjoy traditional music performances and learn folk dance moves.',
  },
];

const Experiences = () => {
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
              Unique Experiences
            </h1>
            <p className="text-lg text-muted-foreground">
              Immerse yourself in Nepali culture with activities hosted by locals
            </p>
          </motion.div>
        </div>
      </section>

      <section className="section-container py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {experiences.map((exp, index) => (
            <motion.div
              key={exp.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-card rounded-2xl overflow-hidden border border-border hover:shadow-lg transition-shadow group"
            >
              <div className="h-48 overflow-hidden">
                <img 
                  src={exp.image} 
                  alt={exp.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    {exp.rating}
                  </span>
                  <span className="text-muted-foreground text-sm">({exp.reviews} reviews)</span>
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">{exp.title}</h3>
                <p className="text-muted-foreground text-sm mb-4">{exp.description}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {exp.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {exp.groupSize} guests
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-foreground font-semibold">
                    ${exp.price} <span className="text-muted-foreground font-normal text-sm">/ person</span>
                  </p>
                  <Button variant="outline" size="sm" className="group/btn">
                    Book
                    <ArrowRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
</div>
  );
};

export default Experiences;