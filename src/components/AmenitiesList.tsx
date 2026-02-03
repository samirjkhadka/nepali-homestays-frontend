import { motion } from 'framer-motion';
import {
  Wifi,
  Droplet,
  UtensilsCrossed,
  Bath,
  Building2,
  Landmark,
  Gift,
  Music,
  Mountain,
  Binoculars,
  Ship,
  Sprout,
  ChefHat,
  Trees,
  Activity,
  Brain,
  Car,
  Flower2,
  type LucideIcon,
} from 'lucide-react';

export interface AmenitiesListProps {
  amenities: string[];
  /** Facility extras from listing sections (e.g. facility_community_hall_capacity, facility_cultural_program_price_type) */
  sections?: Record<string, string>;
}

const PRICE_TYPE_LABELS: Record<string, string> = {
  per_person: 'Per person',
  per_group: 'Per group',
  other: 'Price on request',
};

type DisplayItem = { id: string; label: string; icon: LucideIcon };

/**
 * Build a user-friendly list of amenities: group water/food/bathroom into single lines,
 * add capacity/price from sections where applicable.
 */
function buildDisplayItems(amenities: string[], sections?: Record<string, string>): DisplayItem[] {
  const set = new Set(amenities);
  const items: DisplayItem[] = [];

  const getFacility = (key: string) => sections?.[`facility_${key}`]?.trim() || '';

  // Water — one line: "Hot & cold water", "Hot water", or "Cold water"
  if (set.has('water_hot') || set.has('water_cold')) {
    const both = set.has('water_hot') && set.has('water_cold');
    const label = both ? 'Hot & cold water' : set.has('water_hot') ? 'Hot water' : 'Cold water';
    items.push({ id: 'water', label, icon: Droplet });
  }

  // Internet
  if (set.has('wifi')) {
    items.push({ id: 'wifi', label: 'Wi‑Fi', icon: Wifi });
  }

  // Food — one line
  if (set.has('food_veg') || set.has('food_nonveg') || set.has('food_both')) {
    const label = set.has('food_both')
      ? 'Vegetarian & non-vegetarian meals'
      : set.has('food_veg')
        ? 'Vegetarian meals'
        : 'Non-vegetarian meals';
    items.push({ id: 'food', label, icon: UtensilsCrossed });
  }

  // Bathroom — one line
  if (set.has('bathroom_private')) {
    items.push({ id: 'bathroom_private', label: 'Private bathroom', icon: Bath });
  } else if (set.has('bathroom_common')) {
    items.push({ id: 'bathroom_common', label: 'Shared bathroom', icon: Bath });
  }

  // Community hall — with optional capacity
  if (set.has('community_hall')) {
    const cap = getFacility('community_hall_capacity');
    const label = cap ? `Community hall (${cap} capacity)` : 'Community hall';
    items.push({ id: 'community_hall', label, icon: Building2 });
  }

  // Community museum
  if (set.has('community_museum')) {
    items.push({ id: 'community_museum', label: 'Community museum', icon: Landmark });
  }

  // Gift shop
  if (set.has('gift_shop')) {
    items.push({ id: 'gift_shop', label: 'Gift shop', icon: Gift });
  }

  // Activities with optional price type/price (one friendly line each)
  const activityKeys: { key: string; label: string; icon: LucideIcon }[] = [
    { key: 'cultural_program', label: 'Cultural program', icon: Music },
    { key: 'hiking', label: 'Hiking', icon: Mountain },
    { key: 'sightseeing', label: 'Sightseeing', icon: Binoculars },
    { key: 'boating', label: 'Boating', icon: Ship },
    { key: 'farming', label: 'Farming experience', icon: Sprout },
    { key: 'cooking', label: 'Cooking experience', icon: ChefHat },
    { key: 'jungle_safari', label: 'Jungle safari', icon: Trees },
    { key: 'yoga', label: 'Yoga', icon: Activity },
    { key: 'meditation', label: 'Meditation', icon: Brain },
  ];
  for (const { key, label, icon } of activityKeys) {
    if (!set.has(key)) continue;
    const priceType = getFacility(`${key}_price_type`);
    const price = getFacility(`${key}_price`);
    const suffix = priceType ? ` (${PRICE_TYPE_LABELS[priceType] || priceType})` : '';
    const priceSuffix = price ? ` — NPR ${price}` : '';
    items.push({ id: key, label: `${label}${suffix}${priceSuffix}`, icon });
  }

  // Simple amenities (single friendly label)
  const simple: { key: string; label: string; icon: LucideIcon }[] = [
    { key: 'parking', label: 'Parking', icon: Car },
    { key: 'kitchen', label: 'Kitchen access', icon: ChefHat },
    { key: 'garden', label: 'Garden', icon: Flower2 },
    { key: 'meals', label: 'Meals included', icon: UtensilsCrossed },
  ];
  for (const { key, label, icon } of simple) {
    if (set.has(key)) items.push({ id: key, label, icon });
  }

  return items;
}

export function AmenitiesList({ amenities, sections }: AmenitiesListProps) {
  const displayItems = buildDisplayItems(amenities ?? [], sections);

  if (!displayItems.length) {
    return (
      <div className="py-8 border-t border-border">
        <h3 className="font-display text-2xl font-semibold text-foreground mb-6">
          What this place offers
        </h3>
        <p className="text-muted-foreground">No amenities listed.</p>
      </div>
    );
  }

  return (
    <div className="py-8 border-t border-border">
      <h3 className="font-display text-2xl font-semibold text-foreground mb-6">
        What this place offers
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {displayItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.04 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
          >
            <item.icon className="w-5 h-5 text-primary flex-shrink-0" />
            <span className="text-foreground text-sm leading-snug">{item.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
