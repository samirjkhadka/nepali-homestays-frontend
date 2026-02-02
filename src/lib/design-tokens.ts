/**
 * Design Tokens for Nepali Homestays
 * Colors derived from brand assets: Nepali_homestays_final_logo.svg
 * Primary: #0F233E (navy), Accent: #FB6F08 / #FFA101 (orange/amber)
 */

export const colors = {
  /** Brand navy from logo (mountains, text) */
  primary: {
    50: '#E8EBF0',
    100: '#C5CDDA',
    200: '#9EABC0',
    300: '#7789A6',
    400: '#4A6286',
    500: '#0F233E', // Main brand navy from logo
    600: '#0D1E36',
    700: '#0B192E',
    800: '#091426',
    900: '#070F1E',
  },
  /** Muted blue-gray complement to navy */
  secondary: {
    50: '#F5F6F8',
    100: '#E8EBF0',
    200: '#C5CDDA',
    300: '#9EABC0',
    400: '#7789A6',
    500: '#5A6F8F',
    600: '#4A6286',
    700: '#3D5170',
    800: '#2F4059',
    900: '#212F43',
  },
  /** Orange/amber from logo (mountain base, gradients) */
  accent: {
    50: '#FFF4ED',
    100: '#FFE4D1',
    200: '#FFC9A3',
    300: '#FFAE75',
    400: '#FF9347',
    500: '#FB6F08', // Logo orange
    600: '#E56407',
    700: '#C95506',
    800: '#AD4705',
    900: '#923A04',
  },
  /** Amber/gold from logo gradients (#FFA101) */
  accentAlt: {
    500: '#FFA101',
    600: '#FEA501',
    700: '#FF8B00',
    800: '#FF6F01',
  },
} as const;

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
  '4xl': '5rem',
  '5xl': '6rem',
} as const;

export const typography = {
  heading: {
    h1: { fontSize: '3rem', lineHeight: '3.5rem', fontWeight: '700' },
    h2: { fontSize: '2.25rem', lineHeight: '2.75rem', fontWeight: '600' },
    h3: { fontSize: '1.875rem', lineHeight: '2.25rem', fontWeight: '600' },
    h4: { fontSize: '1.5rem', lineHeight: '2rem', fontWeight: '600' },
    h5: { fontSize: '1.25rem', lineHeight: '1.75rem', fontWeight: '600' },
  },
  body: {
    lg: { fontSize: '1.125rem', lineHeight: '1.75rem', fontWeight: '400' },
    base: { fontSize: '1rem', lineHeight: '1.5rem', fontWeight: '400' },
    sm: { fontSize: '0.875rem', lineHeight: '1.25rem', fontWeight: '400' },
    xs: { fontSize: '0.75rem', lineHeight: '1rem', fontWeight: '400' },
  },
} as const;

export const borderRadius = {
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.5rem',
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
} as const;

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

/** Gradients from logo (orange/amber and navy) */
export const gradients = {
  nepal: 'linear-gradient(135deg, #0F233E 0%, #4A6286 50%, #FB6F08 100%)',
  hero: 'linear-gradient(to right, rgba(15, 35, 62, 0.95), rgba(75, 98, 134, 0.85))',
  logo: 'linear-gradient(135deg, #FF6F01 0%, #FF8B00 0.43%, #FEA501 100%)',
  accent: 'linear-gradient(135deg, #FB6F08 0%, #FFA101 100%)',
  mountain: 'linear-gradient(180deg, #0F233E 0%, #4A6286 50%, #FFA101 100%)',
} as const;

export function withOpacity(color: string, opacity: number): string {
  return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
}

export function responsive<T>(
  sm: T,
  md?: T,
  lg?: T,
  xl?: T
): { sm: T; md?: T; lg?: T; xl?: T } {
  return { sm, md, lg, xl };
}

/** Asset paths (publicDir is assets, so these are at root) */
export const assets = {
  favicon: '/favicon.ico',
  logo: '/Nepali_homestays_final_logo.svg',
  logoWithBg: '/Nepali homestays with background.png',
  logoNoBg: '/Nepali_homestays_without_bg.png',
} as const;
