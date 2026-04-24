import type { ProvinceSlug } from './provinces';

/**
 * Nepal map paths use geographic province numbers 1–7 (Koshi → Sudurpashchim).
 * Search uses `?province=<slug>`; these slugs must match `/api/provinces`.
 */
export const NEPAL_MAP_GEO_ID_TO_SEARCH_SLUG: Record<number, ProvinceSlug> = {
  1: 'koshi',
  2: 'madhesh',
  3: 'bagmati',
  4: 'gandaki',
  5: 'lumbini',
  6: 'karnali',
  7: 'sudurpashchim',
};
