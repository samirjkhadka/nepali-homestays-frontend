import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, ChevronRight } from 'lucide-react';
import { PROVINCES } from '@/data/provinces';
import type { Province, ProvinceSlug } from '@/data/provinces';
import { api } from '@/lib/api';

/** Nepal/region imagery - one per province (Unsplash) */
const PROVINCE_IMAGES = [
  'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80',
  'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&q=80',
  'https://images.unsplash.com/photo-1578645635730-3f9b1c4e4b5a?w=800&q=80',
  'https://images.unsplash.com/photo-1506905925346-21bda3d1dfcd?w=800&q=80',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
];

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
  const [provinces, setProvinces] = useState<Province[]>(PROVINCES);

  useEffect(() => {
    api
      .get<Array<{ id: number | string; name: string; slug?: string }>>('/api/provinces')
      .then((res) => {
        if (!Array.isArray(res.data) || !res.data.length) return;
        const mapped: Province[] = res.data.map((p, i) => {
          const fallback = PROVINCES.find((x) => String(x.id) === String(p.id)) ?? PROVINCES[i];
          return {
            id: String(p.id),
            name: p.name || fallback?.name || `Province ${p.id}`,
            slug: (p.slug as ProvinceSlug) || fallback?.slug || 'bagmati',
            description: fallback?.description,
          };
        });
        setProvinces(mapped);
      })
      .catch(() => {});
  }, []);

  const topRow = provinces.slice(0, 4);
  const bottomRow = provinces.slice(4, 7);

  return (
    <section className="py-20 bg-muted/50">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-primary font-medium text-sm uppercase tracking-wider">Explore by Region</span>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mt-2 mb-4">
            Homestays by Province
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Nepal is divided into seven beautiful provinces, each offering unique cultural experiences and breathtaking landscapes.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {topRow.map((province, index) => (
            <ProvinceCard key={province.id} province={province} index={index} aspect="tall" />
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
          {bottomRow.map((province, index) => (
            <ProvinceCard key={province.id} province={province} index={4 + index} aspect="wide" />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProvinceCard({
  province,
  index,
  aspect,
}: {
  province: Province;
  index: number;
  aspect: 'tall' | 'wide';
}) {
  const { image, color } = getProvinceStyle(index);
  const search = province.slug;

  return (
    <Link to={`/search?province=${encodeURIComponent(search)}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.05 }}
        className={`group relative overflow-hidden rounded-2xl ${aspect === 'tall' ? 'aspect-[3/4]' : 'aspect-[16/10]'}`}
      >
        <img src={image} alt={province.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
        <div className={`absolute inset-0 bg-gradient-to-t ${color} to-transparent`} />
        <div className="absolute inset-0 flex flex-col justify-end p-5 text-white">
          <div className="mb-1 flex items-center gap-1 text-sm opacity-90">
            <MapPin className="h-4 w-4" />
            Province
          </div>
          <h3 className="font-display text-xl font-bold">{province.name}</h3>
          <span className="mt-2 inline-flex items-center gap-1 text-sm opacity-0 transition-opacity group-hover:opacity-100">
            Explore <ChevronRight className="h-4 w-4" />
          </span>
        </div>
      </motion.div>
    </Link>
  );
}
