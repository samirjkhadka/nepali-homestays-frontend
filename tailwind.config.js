/** @type { import('tailwindcss').Config } */
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
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          50: '#E8EBF0',
          100: '#C5CDDA',
          200: '#9EABC0',
          300: '#7789A6',
          400: '#4A6286',
          500: '#0F233E',
          600: '#0D1E36',
          700: '#0B192E',
          800: '#091426',
          900: '#070F1E',
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
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
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        accent: {
          50: '#FFF4ED',
          100: '#FFE4D1',
          200: '#FFC9A3',
          300: '#FFAE75',
          400: '#FF9347',
          500: '#FB6F08',
          600: '#E56407',
          700: '#C95506',
          800: '#AD4705',
          900: '#923A04',
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
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
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        terracotta: {
          DEFAULT: "hsl(var(--terracotta))",
          light: "hsl(var(--terracotta-light))",
        },
        forest: {
          DEFAULT: "hsl(var(--forest))",
          light: "hsl(var(--forest-light))",
        },
        saffron: {
          DEFAULT: "hsl(var(--saffron))",
          light: "hsl(var(--saffron-light))",
        },
        cream: "hsl(var(--cream))",
        "warm-white": "hsl(var(--warm-white))",
        "mountain-blue": "hsl(var(--mountain-blue))",
        "earth-brown": "hsl(var(--earth-brown))",
      },
      
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
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
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      backgroundImage: {
        'gradient-nepal': 'linear-gradient(135deg, #0F233E 0%, #4A6286 50%, #FB6F08 100%)',
        'gradient-hero': 'linear-gradient(to right, rgba(15, 35, 62, 0.95), rgba(75, 98, 134, 0.85))',
        'gradient-logo': 'linear-gradient(135deg, #FF6F01 0%, #FF8B00 43%, #FEA501 100%)',
        'gradient-accent': 'linear-gradient(135deg, #FB6F08 0%, #FFA101 100%)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
