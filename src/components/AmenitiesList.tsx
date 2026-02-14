import { motion } from 'framer-motion';
import {
  Wifi,
  Coffee,
  Leaf,
  Utensils,
  Car,
  Droplets,
  Flower2,
  Home,
  Mountain,
  AirVent,
  Flame,
  Shirt,
  Droplet,
  Bath,
  Building2,
  Landmark,
  Gift,
  Music,
  Binoculars,
  Ship,
  Sprout,
  ChefHat,
  Trees,
  Activity,
  Brain,
  type LucideIcon,
} from 'lucide-react';
import { AMENITIES_OPTIONS } from '@/data/amenities';

const NEW_AMENITY_ICONS: Record<string, LucideIcon> = {
  wifi: Wifi,
  breakfast: Coffee,
  veg_meals: Leaf,
  non_veg_meals: Utensils,
  parking: Car,
  hot_water: Droplets,
  garden: Flower2,
  terrace: Home,
  mountain_view: Mountain,
  ac: AirVent,
  heater: Flame,
  washing_machine: Shirt,
};

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
 * Build a user-friendly list of amenities. New predefined list (wifi, breakfast, etc.) first;
 * then legacy facility groups for backward compatibility.
 */
function buildDisplayItems(amenities: string[], sections?: Record<string, string>): DisplayItem[] {
  const set = new Set(amenities);
  const items: DisplayItem[] = [];

  // New predefined amenities (free inclusions)
  for (const opt of AMENITIES_OPTIONS) {
    if (!set.has(opt.id)) continue;
    const icon = NEW_AMENITY_ICONS[opt.id];
    if (icon) items.push({ id: opt.id, label: opt.label, icon });
  }

  // Legacy: skip if we already added all from set (new list only)
  const legacySet = new Set(amenities.filter((a) => !AMENITIES_OPTIONS.some((o) => o.id === a)));
  if (legacySet.size === 0) return items;

  const getFacility = (key: string) => sections?.[`facility_${key}`]?.trim() || '';

  // Legacy: Water — one line: "Hot & cold water", "Hot water", or "Cold water"
  if (legacySet.has('water_hot') || legacySet.has('water_cold')) {
    const both = legacySet.has('water_hot') && legacySet.has('water_cold');
    const label = both ? 'Hot & cold water' : legacySet.has('water_hot') ? 'Hot water' : 'Cold water';
    items.push({ id: 'water', label, icon: Droplet });
  }

  if (legacySet.has('wifi')) items.push({ id: 'wifi', label: 'Wi‑Fi', icon: Wifi });
  if (legacySet.has('food_veg') || legacySet.has('food_nonveg') || legacySet.has('food_both')) {
    const label = legacySet.has('food_both') ? 'Vegetarian & non-vegetarian meals' : legacySet.has('food_veg') ? 'Vegetarian meals' : 'Non-vegetarian meals';
    items.push({ id: 'food', label, icon: Utensils });
  }
  if (legacySet.has('bathroom_private')) items.push({ id: 'bathroom_private', label: 'Private bathroom', icon: Bath });
  else if (legacySet.has('bathroom_common')) items.push({ id: 'bathroom_common', label: 'Shared bathroom', icon: Bath });
  if (legacySet.has('community_hall')) {
    const cap = getFacility('community_hall_capacity');
    items.push({ id: 'community_hall', label: cap ? `Community hall (${cap} capacity)` : 'Community hall', icon: Building2 });
  }
  if (legacySet.has('community_museum')) items.push({ id: 'community_museum', label: 'Community museum', icon: Landmark });
  if (legacySet.has('gift_shop')) items.push({ id: 'gift_shop', label: 'Gift shop', icon: Gift });
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
    if (!legacySet.has(key)) continue;
    const priceType = getFacility(`${key}_price_type`);
    const price = getFacility(`${key}_price`);
    const suffix = priceType ? ` (${PRICE_TYPE_LABELS[priceType] || priceType})` : '';
    const priceSuffix = price ? ` — NPR ${price}` : '';
    items.push({ id: key, label: `${label}${suffix}${priceSuffix}`, icon });
  }
  const simple: { key: string; label: string; icon: LucideIcon }[] = [
    { key: 'parking', label: 'Parking', icon: Car },
    { key: 'kitchen', label: 'Kitchen access', icon: ChefHat },
    { key: 'garden', label: 'Garden', icon: Flower2 },
    { key: 'meals', label: 'Meals included', icon: Utensils },
  ];
  for (const { key, label, icon } of simple) {
    if (legacySet.has(key)) items.push({ id: key, label, icon });
  }

  return items;
}

export function AmenitiesList({ amenities, sections }: AmenitiesListProps) {
  const displayItems = buildDisplayItems(amenities ?? [], sections);

  if (!displayItems.length) {
    return (
      <div className="py-8 border-t border-border">
        <h3 className="font-display text-2xl font-semibold text-foreground mb-6">
          Amenities
        </h3>
        <p className="text-muted-foreground">No amenities listed.</p>
      </div>
    );
  }

  return (
    <div className="py-8 border-t border-border">
      <h3 className="font-display text-2xl font-semibold text-foreground mb-6">
        Amenities
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
