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
          DEFAULT: 'rgb(var(--color-primary, 124 58 237) / <alpha-value>)',
          dark: 'rgb(var(--color-primary-dark, 109 40 217) / <alpha-value>)',
          light: 'rgb(var(--color-primary-light, 139 92 246) / <alpha-value>)',
        },
        accent: 'rgb(var(--color-accent, 59 130 246) / <alpha-value>)',
        surface: { light: '#F8FAFC', dark: '#0F172A', card: '#FFFFFF', 'card-dark': '#1E293B' },
      },
      backgroundImage: {
        'gradient-primary':
          'var(--gradient-primary, linear-gradient(135deg, rgb(124, 58, 237) 0%, rgb(236, 72, 153) 100%))',
        'gradient-accent':
          'var(--gradient-accent, linear-gradient(135deg, rgb(124, 58, 237) 0%, rgb(59, 130, 246) 100%))',
      },
      boxShadow: {
        glass: '0 8px 32px rgb(var(--color-primary, 124 58 237) / 0.12)',
        card: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgb(var(--color-primary, 124 58 237) / 0.08)',
        elevated: '0 8px 30px rgb(var(--color-primary, 124 58 237) / 0.15)',
      },
    },
  },
  plugins: [],
};
