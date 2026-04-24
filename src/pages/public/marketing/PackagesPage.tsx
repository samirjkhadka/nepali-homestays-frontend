import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mountain, Compass, Tent, Clock, Users, MapPin, Star, ChevronRight, Calendar, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const homestay1 = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800';
const homestay2 = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800';
const homestay3 = 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=800';
const homestay4 = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800';
const homestay5 = 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800';
const homestay6 = 'https://images.unsplash.com/photo-1445019980597-93fa8a06a392?w=800';

const trekkingPackages = [
  {
    id: 'annapurna-circuit',
    name: 'Annapurna Circuit Trek',
    duration: '14-21 days',
    difficulty: 'Moderate to Challenging',
    maxAltitude: '5,416m (Thorong La)',
    groupSize: '2-12',
    price: 85000,
    rating: 4.9,
    reviews: 234,
    image: homestay1,
    highlights: ['Cross Thorong La Pass', 'Visit Muktinath Temple', 'Experience diverse landscapes', 'Stay in traditional teahouses'],
    description: 'The classic Himalayan trek circling the Annapurna massif, featuring diverse landscapes from subtropical forests to high-altitude desert.',
  },
  {
    id: 'everest-base-camp',
    name: 'Everest Base Camp Trek',
    duration: '12-16 days',
    difficulty: 'Moderate to Challenging',
    maxAltitude: '5,364m (EBC)',
    groupSize: '2-12',
    price: 95000,
    rating: 4.9,
    reviews: 312,
    image: homestay2,
    highlights: ['Stand at Everest Base Camp', 'Visit Tengboche Monastery', 'Sherpa culture immersion', 'Stunning Himalayan panoramas'],
    description: 'Walk in the footsteps of legends to the base of the world\'s highest peak, experiencing Sherpa culture and breathtaking mountain scenery.',
  },
  {
    id: 'langtang-valley',
    name: 'Langtang Valley Trek',
    duration: '7-10 days',
    difficulty: 'Moderate',
    maxAltitude: '4,984m (Kyanjin Ri)',
    groupSize: '2-10',
    price: 45000,
    rating: 4.8,
    reviews: 156,
    image: homestay3,
    highlights: ['Tamang heritage villages', 'Cheese factory visit', 'Glacial valleys', 'Rhododendron forests'],
    description: 'A shorter trek perfect for those with limited time, offering stunning mountain views and rich Tamang cultural experiences.',
  },
];

const culturalPackages = [
  {
    id: 'kathmandu-heritage',
    name: 'Kathmandu Valley Heritage Tour',
    duration: '5 days',
    type: 'Cultural',
    locations: ['Kathmandu', 'Bhaktapur', 'Patan'],
    groupSize: '2-15',
    price: 35000,
    rating: 4.8,
    reviews: 189,
    image: homestay4,
    highlights: ['7 UNESCO World Heritage Sites', 'Traditional Newari feast', 'Pottery workshop', 'Temple ceremonies'],
    description: 'Explore the ancient cities of the Kathmandu Valley, immersing yourself in centuries-old traditions and architectural wonders.',
  },
  {
    id: 'tharu-cultural',
    name: 'Tharu Cultural Immersion',
    duration: '4 days',
    type: 'Cultural',
    locations: ['Chitwan', 'Sauraha'],
    groupSize: '2-10',
    price: 28000,
    rating: 4.7,
    reviews: 98,
    image: homestay5,
    highlights: ['Tharu village stay', 'Traditional dance performance', 'Cooking class', 'Jungle safari'],
    description: 'Experience the unique culture of the indigenous Tharu people, combined with wildlife encounters in Chitwan National Park.',
  },
  {
    id: 'buddhist-pilgrimage',
    name: 'Buddhist Pilgrimage Circuit',
    duration: '7 days',
    type: 'Spiritual',
    locations: ['Lumbini', 'Kathmandu', 'Boudhanath'],
    groupSize: '2-20',
    price: 42000,
    rating: 4.9,
    reviews: 145,
    image: homestay6,
    highlights: ['Birthplace of Buddha', 'Meditation sessions', 'Ancient monasteries', 'Peace pagoda visit'],
    description: 'A spiritual journey through Nepal\'s most sacred Buddhist sites, including the birthplace of Lord Buddha.',
  },
];

const adventurePackages = [
  {
    id: 'paragliding-pokhara',
    name: 'Paragliding & Adventure in Pokhara',
    duration: '5 days',
    activities: ['Paragliding', 'Zip-lining', 'Bungee'],
    adrenalineLevel: 'High',
    groupSize: '2-8',
    price: 48000,
    rating: 4.9,
    reviews: 267,
    image: homestay1,
    highlights: ['Tandem paragliding', 'Highest bungee jump', 'Zip-line over gorge', 'Lake activities'],
    description: 'Get your adrenaline pumping with Nepal\'s best adventure activities in the adventure capital of Pokhara.',
  },
  {
    id: 'white-water-rafting',
    name: 'White Water Rafting Expedition',
    duration: '3 days',
    activities: ['Rafting', 'Camping', 'Kayaking'],
    adrenalineLevel: 'High',
    groupSize: '4-16',
    price: 32000,
    rating: 4.8,
    reviews: 178,
    image: homestay2,
    highlights: ['Grade 3-4 rapids', 'Beach camping', 'Cliff jumping', 'Riverside BBQ'],
    description: 'Navigate thrilling rapids on the Trisuli or Bhote Koshi rivers, camping on pristine river beaches.',
  },
  {
    id: 'mountain-biking',
    name: 'Mountain Biking: Kathmandu to Pokhara',
    duration: '6 days',
    activities: ['Mountain Biking', 'Sightseeing'],
    adrenalineLevel: 'Moderate',
    groupSize: '2-10',
    price: 55000,
    rating: 4.7,
    reviews: 89,
    image: homestay3,
    highlights: ['Scenic trails', 'Village homestays', 'Temple visits', 'River crossings'],
    description: 'Cycle through Nepal\'s stunning landscapes, from the capital to the lakeside city of Pokhara.',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function PackagesPage() {
  const [activeTab, setActiveTab] = useState('trekking');

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
          <div className="section-container relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-3xl mx-auto"
            >
              <span className="text-primary font-medium text-sm uppercase tracking-wider">
                Curated Experiences
              </span>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mt-2 mb-4">
                Explore Nepal Your Way
              </h1>
              <p className="text-lg text-muted-foreground">
                From epic Himalayan treks to cultural immersions and adrenaline-pumping adventures, 
                discover packages designed to create unforgettable memories.
              </p>
            </motion.div>

            {/* Category Icons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex justify-center gap-8 mt-12"
            >
              <div 
                onClick={() => setActiveTab('trekking')}
                className={`flex flex-col items-center gap-2 cursor-pointer transition-all ${activeTab === 'trekking' ? 'text-primary scale-110' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${activeTab === 'trekking' ? 'bg-primary/20' : 'bg-muted'}`}>
                  <Mountain className="w-8 h-8" />
                </div>
                <span className="font-medium text-sm">Trekking</span>
              </div>
              <div 
                onClick={() => setActiveTab('cultural')}
                className={`flex flex-col items-center gap-2 cursor-pointer transition-all ${activeTab === 'cultural' ? 'text-primary scale-110' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${activeTab === 'cultural' ? 'bg-primary/20' : 'bg-muted'}`}>
                  <Compass className="w-8 h-8" />
                </div>
                <span className="font-medium text-sm">Cultural</span>
              </div>
              <div 
                onClick={() => setActiveTab('adventure')}
                className={`flex flex-col items-center gap-2 cursor-pointer transition-all ${activeTab === 'adventure' ? 'text-primary scale-110' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${activeTab === 'adventure' ? 'bg-primary/20' : 'bg-muted'}`}>
                  <Tent className="w-8 h-8" />
                </div>
                <span className="font-medium text-sm">Adventure</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Packages Section */}
        <section className="section-container">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="hidden">
              <TabsTrigger value="trekking">Trekking</TabsTrigger>
              <TabsTrigger value="cultural">Cultural</TabsTrigger>
              <TabsTrigger value="adventure">Adventure</TabsTrigger>
            </TabsList>

            <TabsContent value="trekking">
              <PackageHeader 
                title="Trekking Packages"
                subtitle="Epic Himalayan adventures from beginner-friendly trails to challenging expeditions"
              />
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              >
                {trekkingPackages.map((pkg) => (
                  <TrekkingCard key={pkg.id} package={pkg} />
                ))}
              </motion.div>
            </TabsContent>

            <TabsContent value="cultural">
              <PackageHeader 
                title="Cultural Experiences"
                subtitle="Immerse yourself in Nepal's rich heritage, traditions, and spiritual practices"
              />
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              >
                {culturalPackages.map((pkg) => (
                  <CulturalCard key={pkg.id} package={pkg} />
                ))}
              </motion.div>
            </TabsContent>

            <TabsContent value="adventure">
              <PackageHeader 
                title="Adventure Packages"
                subtitle="Adrenaline-pumping activities for thrill-seekers and adventure enthusiasts"
              />
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              >
                {adventurePackages.map((pkg) => (
                  <AdventureCard key={pkg.id} package={pkg} />
                ))}
              </motion.div>
            </TabsContent>
          </Tabs>
        </section>

        {/* CTA Section */}
        <section className="section-container mt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-8 md:p-12 text-center"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Can't Find What You're Looking For?
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">
              We specialize in creating custom itineraries tailored to your interests, 
              budget, and schedule. Let us design your perfect Nepal adventure.
            </p>
            <Button size="lg" variant="secondary" className="font-semibold">
              Request Custom Package
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </section>
      </main>
</div>
  );
}

function PackageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-8">
      <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">{title}</h2>
      <p className="text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function TrekkingCard({ package: pkg }: { package: typeof trekkingPackages[0] }) {
  return (
    <motion.div
      variants={cardVariants}
      className="group bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-elevated transition-all duration-300 border border-border"
    >
      <div className="flex flex-col md:flex-row">
        <div className="md:w-2/5 relative overflow-hidden">
          <img
            src={pkg.image}
            alt={pkg.name}
            className="w-full h-48 md:h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute top-3 left-3 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
            {pkg.difficulty}
          </div>
        </div>
        <div className="md:w-3/5 p-6">
          <h3 className="font-display text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
            {pkg.name}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">{pkg.description}</p>
          
          <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              {pkg.duration}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mountain className="w-4 h-4" />
              {pkg.maxAltitude}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-4 h-4" />
              {pkg.groupSize} people
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 fill-accent text-accent" />
              <span className="font-medium">{pkg.rating}</span>
              <span className="text-muted-foreground">({pkg.reviews})</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {pkg.highlights.slice(0, 2).map((highlight, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full">
                <Check className="w-3 h-3 text-secondary" />
                {highlight}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div>
              <span className="text-2xl font-bold text-primary">NPR {pkg.price.toLocaleString()}</span>
              <span className="text-muted-foreground text-sm">/person</span>
            </div>
            <Button>View Details</Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CulturalCard({ package: pkg }: { package: typeof culturalPackages[0] }) {
  return (
    <motion.div
      variants={cardVariants}
      className="group bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-elevated transition-all duration-300 border border-border"
    >
      <div className="flex flex-col md:flex-row">
        <div className="md:w-2/5 relative overflow-hidden">
          <img
            src={pkg.image}
            alt={pkg.name}
            className="w-full h-48 md:h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute top-3 left-3 px-3 py-1 bg-secondary text-secondary-foreground text-xs font-semibold rounded-full">
            {pkg.type}
          </div>
        </div>
        <div className="md:w-3/5 p-6">
          <h3 className="font-display text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
            {pkg.name}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">{pkg.description}</p>
          
          <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              {pkg.duration}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              {pkg.locations.length} locations
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-4 h-4" />
              {pkg.groupSize} people
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 fill-accent text-accent" />
              <span className="font-medium">{pkg.rating}</span>
              <span className="text-muted-foreground">({pkg.reviews})</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {pkg.highlights.slice(0, 2).map((highlight, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full">
                <Check className="w-3 h-3 text-secondary" />
                {highlight}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div>
              <span className="text-2xl font-bold text-primary">NPR {pkg.price.toLocaleString()}</span>
              <span className="text-muted-foreground text-sm">/person</span>
            </div>
            <Button>View Details</Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function AdventureCard({ package: pkg }: { package: typeof adventurePackages[0] }) {
  return (
    <motion.div
      variants={cardVariants}
      className="group bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-elevated transition-all duration-300 border border-border"
    >
      <div className="flex flex-col md:flex-row">
        <div className="md:w-2/5 relative overflow-hidden">
          <img
            src={pkg.image}
            alt={pkg.name}
            className="w-full h-48 md:h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute top-3 left-3 px-3 py-1 bg-accent text-accent-foreground text-xs font-semibold rounded-full">
            {pkg.adrenalineLevel} Adrenaline
          </div>
        </div>
        <div className="md:w-3/5 p-6">
          <h3 className="font-display text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
            {pkg.name}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">{pkg.description}</p>
          
          <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              {pkg.duration}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Tent className="w-4 h-4" />
              {pkg.activities.length} activities
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-4 h-4" />
              {pkg.groupSize} people
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 fill-accent text-accent" />
              <span className="font-medium">{pkg.rating}</span>
              <span className="text-muted-foreground">({pkg.reviews})</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {pkg.highlights.slice(0, 2).map((highlight, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full">
                <Check className="w-3 h-3 text-secondary" />
                {highlight}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div>
              <span className="text-2xl font-bold text-primary">NPR {pkg.price.toLocaleString()}</span>
              <span className="text-muted-foreground text-sm">/person</span>
            </div>
            <Button>View Details</Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
