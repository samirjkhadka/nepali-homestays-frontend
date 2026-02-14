/**
 * Free inclusions (amenities) – multi-select from predefined list.
 * id is the value stored in API (listing_amenities.amenity).
 */
export type AmenityOption = { id: string; label: string; icon: string };

export const AMENITIES_OPTIONS: AmenityOption[] = [
  { id: 'wifi', label: 'WiFi', icon: 'Wifi' },
  { id: 'breakfast', label: 'Breakfast', icon: 'Coffee' },
  { id: 'veg_meals', label: 'Veg Meals', icon: 'Leaf' },
  { id: 'non_veg_meals', label: 'Non-Veg Meals', icon: 'Utensils' },
  { id: 'parking', label: 'Parking', icon: 'Car' },
  { id: 'hot_water', label: 'Hot Water', icon: 'Droplets' },
  { id: 'garden', label: 'Garden', icon: 'Flower2' },
  { id: 'terrace', label: 'Terrace', icon: 'Home' },
  { id: 'mountain_view', label: 'Mountain View', icon: 'Mountain' },
  { id: 'ac', label: 'AC', icon: 'AirVent' },
  { id: 'heater', label: 'Heater', icon: 'Flame' },
  { id: 'washing_machine', label: 'Washing Machine', icon: 'Shirt' },
];

/** Paid add-on unit options for extra services */
export const EXTRA_SERVICE_UNITS = [
  { id: 'per_person', label: 'Per person' },
  { id: 'per_group', label: 'Per group' },
  { id: 'fixed', label: 'Fixed' },
] as const;

export type ExtraServiceUnit = (typeof EXTRA_SERVICE_UNITS)[number]['id'];

export type ExtraServiceFormItem = {
  name: string;
  price_npr: number;
  unit: ExtraServiceUnit;
  description?: string;
};
