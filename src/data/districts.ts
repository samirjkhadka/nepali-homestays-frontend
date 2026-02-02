/**
 * Districts by province (Nepal). Used for search filters.
 * Source: Government of Nepal administrative divisions.
 */
import type { ProvinceSlug } from './provinces';

export const DISTRICTS_BY_PROVINCE: Record<ProvinceSlug, string[]> = {
  bagmati: ['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Kavrepalanchok', 'Dhading', 'Nuwakot', 'Rasuwa', 'Sindhupalchok', 'Dolakha', 'Ramechhap', 'Sindhuli', 'Chitwan', 'Makwanpur'],
  gandaki: ['Gorkha', 'Lamjung', 'Tanahun', 'Syangja', 'Kaski', 'Manang', 'Mustang', 'Myagdi', 'Parbat', 'Baglung', 'Nawalpur', 'Parasi'],
  lumbini: ['Rupandehi', 'Kapilvastu', 'Nawalparasi East', 'Palpa', 'Arghakhanchi', 'Gulmi', 'Rolpa', 'Pyuthan', 'Dang', 'Banke', 'Bardiya'],
  koshi: ['Morang', 'Sunsari', 'Jhapa', 'Dhankuta', 'Terhathum', 'Sankhuwasabha', 'Bhojpur', 'Solukhumbu', 'Okhaldhunga', 'Khotang', 'Udayapur', 'Saptari', 'Siraha'],
  madhesh: ['Sarlahi', 'Mahottari', 'Dhanusha', 'Siraha', 'Saptari', 'Bara', 'Parsa', 'Rautahat'],
  sudurpashchim: ['Kailali', 'Kanchanpur', 'Dadeldhura', 'Baitadi', 'Darchula', 'Bajhang', 'Bajura', 'Achham', 'Doti'],
  karnali: ['Humla', 'Mugu', 'Dolpa', 'Jumla', 'Kalikot', 'Dailekh', 'Jajarkot', 'Rukum West', 'Salyan', 'Surkhet'],
};

/** Homestay type: Individual or Community only */
export const HOMESTAY_TYPES = ['individual', 'community'] as const;
export type HomestayType = (typeof HOMESTAY_TYPES)[number];

/** Listing category: rural, urban, eco, cultural, farmstay (separate from type) */
export const HOMESTAY_CATEGORIES = ['rural', 'urban', 'eco', 'cultural', 'farmstay'] as const;
export type HomestayCategory = (typeof HOMESTAY_CATEGORIES)[number];

export const WARD_NUMBERS = Array.from({ length: 40 }, (_, i) => i + 1);

/** Facilities with sub-options: when user selects a group (e.g. Bathroom), show sub-options (Common / Private) */
export type FacilityOption = { id: string; label: string };
export type FacilityGroup = {
  id: string;
  label: string;
  type: 'single' | 'multi';
  options: FacilityOption[];
  /** If Yes only: when selected show capacity input (Community Hall) */
  hasCapacity?: boolean;
  /** If Yes only: when selected show price type (Per person / Per group / Other) and price (activities) */
  hasPriceType?: boolean;
};

export const PRICE_TYPE_OPTIONS = [
  { id: 'per_person', label: 'Per person' },
  { id: 'per_group', label: 'Per group' },
  { id: 'other', label: 'Other' },
] as const;

export const FACILITY_GROUPS: FacilityGroup[] = [
  { id: 'water', label: 'Water', type: 'multi', options: [{ id: 'water_hot', label: 'Hot' }, { id: 'water_cold', label: 'Cold' }] },
  { id: 'internet', label: 'Internet', type: 'single', options: [{ id: 'wifi', label: 'Yes' }] },
  { id: 'food', label: 'Food', type: 'single', options: [{ id: 'food_veg', label: 'Vegetarian' }, { id: 'food_nonveg', label: 'Non-vegetarian' }, { id: 'food_both', label: 'Veg & Non-veg' }] },
  { id: 'bathroom', label: 'Bathroom', type: 'single', options: [{ id: 'bathroom_common', label: 'Common' }, { id: 'bathroom_private', label: 'Private' }] },
  { id: 'community_hall', label: 'Community Hall', type: 'single', options: [{ id: 'community_hall', label: 'Yes' }], hasCapacity: true },
  { id: 'community_museum', label: 'Community Museum', type: 'single', options: [{ id: 'community_museum', label: 'Yes' }] },
  { id: 'gift_shop', label: 'Gift Shop', type: 'single', options: [{ id: 'gift_shop', label: 'Yes' }] },
  { id: 'cultural_program', label: 'Cultural Program', type: 'single', options: [{ id: 'cultural_program', label: 'Yes' }], hasPriceType: true },
  { id: 'hiking', label: 'Hiking', type: 'single', options: [{ id: 'hiking', label: 'Yes' }], hasPriceType: true },
  { id: 'sightseeing', label: 'Sight-Seeing', type: 'single', options: [{ id: 'sightseeing', label: 'Yes' }], hasPriceType: true },
  { id: 'boating', label: 'Boating', type: 'single', options: [{ id: 'boating', label: 'Yes' }], hasPriceType: true },
  { id: 'farming', label: 'Farming', type: 'single', options: [{ id: 'farming', label: 'Yes' }], hasPriceType: true },
  { id: 'cooking', label: 'Cooking', type: 'single', options: [{ id: 'cooking', label: 'Yes' }], hasPriceType: true },
  { id: 'jungle_safari', label: 'Jungle Safari', type: 'single', options: [{ id: 'jungle_safari', label: 'Yes' }], hasPriceType: true },
  { id: 'yoga', label: 'Yoga', type: 'single', options: [{ id: 'yoga', label: 'Yes' }], hasPriceType: true },
  { id: 'meditation', label: 'Meditation', type: 'single', options: [{ id: 'meditation', label: 'Yes' }], hasPriceType: true },
  { id: 'parking', label: 'Parking', type: 'single', options: [{ id: 'parking', label: 'Yes' }] },
  { id: 'kitchen', label: 'Kitchen', type: 'single', options: [{ id: 'kitchen', label: 'Yes' }] },
  { id: 'garden', label: 'Garden', type: 'single', options: [{ id: 'garden', label: 'Yes' }] },
  { id: 'meals', label: 'Meals included', type: 'single', options: [{ id: 'meals', label: 'Yes' }] },
];

/** Flat list of all amenity IDs (for APIs that expect amenity strings) */
export const AMENITY_OPTIONS = FACILITY_GROUPS.flatMap((g) => g.options);
