/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--color-primary, 250 204 21) / <alpha-value>)',
          dark: 'rgb(var(--color-primary-dark, 202 138 4) / <alpha-value>)',
          light: 'rgb(var(--color-primary-light, 253 224 71) / <alpha-value>)',
        },
        accent: 'rgb(var(--color-accent, 234 179 8) / <alpha-value>)',
        surface: {
          light: '#FAFAF5',
          dark: '#0A0A0A',
          card: '#FFFFFF',
          'card-dark': '#141414',
        },
      },
      backgroundImage: {
        'gradient-primary':
          'var(--gradient-primary, linear-gradient(135deg, #FACC15 0%, #EAB308 55%, #CA8A04 100%))',
        'gradient-accent':
          'var(--gradient-accent, linear-gradient(135deg, #111111 0%, #1a1a1a 40%, #FACC15 100%))',
      },
      boxShadow: {
        glass: '0 8px 32px rgb(250 204 21 / 0.12)',
        card: '0 1px 2px rgba(0,0,0,0.05), 0 4px 16px rgb(250 204 21 / 0.1)',
        elevated: '0 8px 28px rgb(250 204 21 / 0.22)',
        'btn-yellow': '3px 3px 0 0 #000',
        'btn-black': '3px 3px 0 0 #FACC15',
      },
    },
  },
  plugins: [],
};
