import { motion } from 'framer-motion';
import { MapPin, Home, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
const destinations = [
  {
    name: 'Kathmandu Valley',
    region: 'Bagmati Province',
    image: 'https://images.unsplash.com/photo-1565073624497-7144969d0a07?w=800',
    homestays: 45,
    rating: 4.8,
    description: 'Ancient temples, vibrant culture, and the gateway to Nepal.',
  },
  {
    name: 'Pokhara',
    region: 'Gandaki Province',
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800',
    homestays: 38,
    rating: 4.9,
    description: 'Lakeside paradise with stunning Annapurna views.',
  },
  {
    name: 'Chitwan',
    region: 'Bagmati Province',
    image: 'https://images.unsplash.com/photo-1585016495481-91613a3ab1bc?w=800',
    homestays: 22,
    rating: 4.7,
    description: 'Wildlife adventures in the jungle heartland.',
  },
  {
    name: 'Everest Region',
    region: 'Province 1',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
    homestays: 28,
    rating: 4.9,
    description: 'Trek to the base of the world\'s highest peak.',
  },
  {
    name: 'Lumbini',
    region: 'Lumbini Province',
    image: 'https://images.unsplash.com/photo-1558799401-1dcba79f4c42?w=800',
    homestays: 15,
    rating: 4.6,
    description: 'Birthplace of Buddha and UNESCO World Heritage Site.',
  },
  {
    name: 'Mustang',
    region: 'Gandaki Province',
    image: 'https://images.unsplash.com/photo-1533130061792-64b345e4a833?w=800',
    homestays: 12,
    rating: 4.8,
    description: 'Ancient kingdom with Tibetan culture and desert landscapes.',
  },
];

const Destinations = () => {
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
              Explore Destinations
            </h1>
            <p className="text-lg text-muted-foreground">
              Discover authentic homestays across Nepal's most beautiful regions
            </p>
          </motion.div>
        </div>
      </section>

      <section className="section-container py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {destinations.map((destination, index) => (
            <motion.div
              key={destination.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <Link to={`/search?location=${encodeURIComponent(destination.name)}`}>
                <div className="bg-card rounded-2xl overflow-hidden border border-border hover:shadow-xl transition-all">
                  <div className="h-56 overflow-hidden relative">
                    <img 
                      src={destination.image} 
                      alt={destination.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="font-display text-2xl font-bold text-white">{destination.name}</h3>
                      <p className="text-white/80 text-sm flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {destination.region}
                      </p>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-muted-foreground text-sm mb-4">{destination.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Home className="w-4 h-4" />
                        {destination.homestays} homestays
                      </span>
                      <span className="flex items-center gap-1 text-sm font-medium">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        {destination.rating}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
</div>
  );
};

export default Destinations;