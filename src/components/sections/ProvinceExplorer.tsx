import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, ChevronRight } from 'lucide-react';
import { PROVINCES, getProvinceSearchParam } from '@/data/provinces';
import type { Province } from '@/data/provinces';

/** Nepal/region imagery - one per province (Unsplash) */
const PROVINCE_IMAGES = [
  'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80', // Kathmandu / Bagmati
  'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&q=80',   // Annapurna / Gandaki
  'https://images.unsplash.com/photo-1578645635730-3f9b1c4e4b5a?w=800&q=80', // Lumbini
  'https://images.unsplash.com/photo-1506905925346-21bda3d1dfcd?w=800&q=80', // Mountains / Koshi
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80', // Terai / Madhesh
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80', // Hills / Sudurpashchim
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80', // Karnali
];

/** Theme-aligned gradients (primary navy + accent orange) */
const PROVINCE_COLORS: readonly string[] = [
  'from-primary-500/90',
  'from-primary-600/90',
  'from-accent-500/90',
  'from-accent-600/90',
  'from-primary-400/90',
  'from-primary-700/90',
  'from-accent-600/90',
];

function getProvinceStyle(index: number) {
  return {
    image: PROVINCE_IMAGES[index] ?? PROVINCE_IMAGES[0],
    color: PROVINCE_COLORS[index] ?? 'from-primary-500/80',
  };
}

export default function ProvinceExplorer() {
  const topRow = PROVINCES.slice(0, 4);
  const bottomRow = PROVINCES.slice(4, 7);

  return (
    <section className="py-20 bg-muted/50">
      <div className="container px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-primary font-medium text-sm uppercase tracking-wider">
            Explore by Region
          </span>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mt-2 mb-4">
            Homestays by Province
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Nepal is divided into seven beautiful provinces, each offering unique cultural
            experiences and breathtaking landscapes.
          </p>
        </motion.div>

        {/* Top Row: 4 tall cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {topRow.map((province, index) => (
            <ProvinceCard
              key={province.id}
              province={province}
              index={index}
              aspect="tall"
            />
          ))}
        </div>

        {/* Bottom Row: 3 wide cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
          {bottomRow.map((province, index) => (
            <ProvinceCard
              key={province.id}
              province={province}
              index={4 + index}
              aspect="wide"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

type ProvinceCardProps = {
  province: Province;
  index: number;
  aspect: 'tall' | 'wide';
};

function ProvinceCard({ province, index, aspect }: ProvinceCardProps) {
  const { image, color } = getProvinceStyle(index);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -8 }}
    >
      <Link
        to={`/search?${getProvinceSearchParam(province.slug)}`}
        className={`group block relative overflow-hidden rounded-2xl cursor-pointer ${aspect === 'tall' ? 'aspect-[4/5]' : 'aspect-[16/10]'}`}
      >
        <img
          src={image}
          alt={province.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className={`absolute inset-0 bg-gradient-to-t ${color} to-transparent opacity-90`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-6">
          {aspect === 'tall' && (
            <div className="flex items-center gap-2 text-white/80 text-sm mb-2">
              <MapPin className="w-4 h-4 shrink-0" />
              <span>Explore homestays</span>
            </div>
          )}
          <h3 className="font-serif text-2xl font-bold text-white mb-3">
            {province.name} Province
          </h3>
          {aspect === 'tall' ? (
            <span className="flex items-center gap-2 text-white font-medium opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
              Explore <ChevronRight className="w-4 h-4" />
            </span>
          ) : (
            <span className="flex items-center gap-2 text-white/90 text-sm">
              Explore <ChevronRight className="w-4 h-4" />
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
