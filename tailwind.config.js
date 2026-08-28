/** @type { import('tailwindcss').Config } */
/**
 * Aligned with nepal-homestay-connect design tokens (HSL in index.css).
 * primary/accent/secondary numeric scales are terracotta / saffron / forest for legacy classnames.
 */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar))',
          foreground: 'hsl(var(--sidebar-foreground))',
          muted: 'hsl(var(--sidebar-muted))',
          border: 'hsl(var(--sidebar-border))',
          hover: 'hsl(var(--sidebar-hover))',
          active: 'hsl(var(--sidebar-active))',
          'active-foreground': 'hsl(var(--sidebar-active-foreground))',
        },
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          50: 'hsl(15 40% 97%)',
          100: 'hsl(15 45% 94%)',
          200: 'hsl(15 40% 88%)',
          300: 'hsl(15 45% 75%)',
          400: 'hsl(15 50% 62%)',
          500: 'hsl(15 60% 48%)',
          600: 'hsl(15 55% 40%)',
          700: 'hsl(15 50% 32%)',
          800: 'hsl(15 45% 24%)',
          900: 'hsl(15 40% 16%)',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
          50: 'hsl(150 20% 96%)',
          100: 'hsl(150 25% 90%)',
          200: 'hsl(150 28% 82%)',
          300: 'hsl(150 30% 68%)',
          400: 'hsl(150 32% 52%)',
          500: 'hsl(150 35% 38%)',
          600: 'hsl(150 32% 32%)',
          700: 'hsl(150 30% 26%)',
          800: 'hsl(150 30% 20%)',
          900: 'hsl(150 32% 14%)',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
          50: 'hsl(42 60% 97%)',
          100: 'hsl(42 70% 92%)',
          200: 'hsl(42 80% 82%)',
          300: 'hsl(42 88% 72%)',
          400: 'hsl(42 90% 62%)',
          500: 'hsl(42 90% 52%)',
          600: 'hsl(40 88% 44%)',
          700: 'hsl(38 85% 36%)',
          800: 'hsl(36 80% 28%)',
          900: 'hsl(34 75% 20%)',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
        terracotta: {
          DEFAULT: 'hsl(var(--terracotta))',
          light: 'hsl(var(--terracotta-light))',
        },
        forest: {
          DEFAULT: 'hsl(var(--forest))',
          light: 'hsl(var(--forest-light))',
        },
        saffron: {
          DEFAULT: 'hsl(var(--saffron))',
          light: 'hsl(var(--saffron-light))',
        },
        cream: 'hsl(var(--cream))',
        'warm-white': 'hsl(var(--warm-white))',
        'mountain-blue': 'hsl(var(--mountain-blue))',
        'earth-brown': 'hsl(var(--earth-brown))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        glow: 'var(--shadow-glow)',
        soft: 'var(--shadow-md)',
        elevated: 'var(--shadow-lg)',
        floating: 'var(--shadow-xl)',
        'primary-glow': 'var(--shadow-primary-glow)',
      },
      backgroundImage: {
        'gradient-warm': 'var(--gradient-warm)',
        'gradient-accent': 'var(--gradient-accent)',
        'gradient-hero-tokens': 'var(--gradient-hero)',
        'gradient-nepal': 'linear-gradient(135deg, #0F233E 0%, #4A6286 50%, #FB6F08 100%)',
        'gradient-hero': 'linear-gradient(135deg, hsl(15 60% 48% / 0.95), hsl(150 35% 25% / 0.85))',
        'gradient-logo': 'linear-gradient(135deg, #FF6F01 0%, #FF8B00 43%, #FEA501 100%)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(40px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-100px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(100px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px hsl(42 90% 55% / 0.3)' },
          '50%': { boxShadow: '0 0 40px hsl(42 90% 55% / 0.5)' },
        },
        'carousel-slide': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.6s ease-out forwards',
        'fade-in-up': 'fade-in-up 0.8s ease-out forwards',
        'slide-in-left': 'slide-in-left 0.6s ease-out forwards',
        'slide-in-right': 'slide-in-right 0.6s ease-out forwards',
        'scale-in': 'scale-in 0.5s ease-out forwards',
        float: 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        carousel: 'carousel-slide 30s linear infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
