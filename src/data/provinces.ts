/**
 * 7 Provinces of Nepal - for Explore by Province
 * Source: Constitution of Nepal 2015
 */

export type ProvinceSlug =
  | 'bagmati'
  | 'gandaki'
  | 'lumbini'
  | 'koshi'
  | 'madhesh'
  | 'sudurpashchim'
  | 'karnali';

export interface Province {
  id: string;
  name: string;
  slug: ProvinceSlug;
  description?: string;
}

export const PROVINCES: Province[] = [
  { id: '1', name: 'Bagmati', slug: 'bagmati', description: 'Kathmandu Valley, hills and mountains' },
  { id: '2', name: 'Gandaki', slug: 'gandaki', description: 'Pokhara, Annapurna, Mustang' },
  { id: '3', name: 'Lumbini', slug: 'lumbini', description: 'Birthplace of Buddha, Terai' },
  { id: '4', name: 'Koshi', slug: 'koshi', description: 'Eastern hills and mountains' },
  { id: '5', name: 'Madhesh', slug: 'madhesh', description: 'Central and eastern Terai' },
  { id: '6', name: 'Sudurpashchim', slug: 'sudurpashchim', description: 'Far western hills and Terai' },
  { id: '7', name: 'Karnali', slug: 'karnali', description: 'Mid-western mountains' },
];

export function getProvinceBySlug(slug: ProvinceSlug): Province | undefined {
  return PROVINCES.find((p) => p.slug === slug);
}

export function getProvinceSearchParam(slug: ProvinceSlug): string {
  return `province=${encodeURIComponent(slug)}`;
}
