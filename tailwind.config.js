/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#F4F7F4',
          100: '#E7EFE8',
          200: '#CFE0D1',
          300: '#A9C7AC',
          400: '#7EAA83',
          500: '#5B8C62', // Primary sage accent
          600: '#46724C',
          700: '#395C3D',
          800: '#2F4A32',
          900: '#273E29',
          950: '#122014',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
