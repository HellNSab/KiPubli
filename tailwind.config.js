/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-6px)' },
          '40%': { transform: 'translateX(6px)' },
          '60%': { transform: 'translateX(-4px)' },
          '80%': { transform: 'translateX(4px)' },
        },
      },
      animation: {
        shake: 'shake 0.4s ease-in-out',
      },
      colors: {
        ink: '#111110',
        paper: '#FAFAFA',
        muted: '#6B6B68',
        subtle: '#9B9B97',
        accent: '#4F46E5',
        'accent-hover': '#3730A3',
        'accent-light': '#818CF8',
        'accent-tint': '#EEF2FF',
        'dark-bg': '#0F0F0E',
        'dark-card': '#1C1C1A',
        'dark-surface': '#111110',
      },
    },
  },
  plugins: [],
}
