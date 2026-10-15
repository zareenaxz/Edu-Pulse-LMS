/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F4F6FD',
          100: '#E9ECFB',
          500: '#3843D0',
          600: '#2A33B2',
          700: '#1F268A',
          dark: '#0F1338',
        }
      }
    },
  },
  plugins: [],
}