/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#D4AF37',
          50: '#F8F3E6',
          100: '#F1E7CE',
          200: '#E8D9A5',
          300: '#DECB7C',
          400: '#D9BD53',
          500: '#D4AF37',
          600: '#B8962A',
          700: '#8F7421',
          800: '#665318',
          900: '#3D3210',
        },
      },
    },
  },
  plugins: [],
}
