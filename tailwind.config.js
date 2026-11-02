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
          50: '#F5F8F5',
          100: '#E8F1E9',
          200: '#D2E3D4',
          300: '#ADCBB1',
          400: '#83B089',
          500: '#5F9566', // Primary soft sage
          600: '#4B7A51',
          700: '#3D6242',
          800: '#344F38',
          900: '#2C4230',
          950: '#142316',
        },
        warm: {
          50: '#FAF9F6',
          100: '#F5F3EE',
          200: '#EAE6DD',
          300: '#DCD5C6',
        },
        pastel: {
          blue: {
            bg: '#F0F7FF',
            border: '#DBEAFE',
            text: '#1E40AF',
            bar: '#60A5FA',
          },
          emerald: {
            bg: '#F0FDF4',
            border: '#DCFCE7',
            text: '#166534',
            bar: '#4ADE80',
          },
          amber: {
            bg: '#FFFBEB',
            border: '#FEF3C7',
            text: '#92400E',
            bar: '#FBBF24',
          },
          purple: {
            bg: '#FAF5FF',
            border: '#F3E8FF',
            text: '#6B21A8',
            bar: '#A855F7',
          },
          rose: {
            bg: '#FFF1F2',
            border: '#FFE4E6',
            text: '#9F1239',
            bar: '#FB7185',
          },
        },
      },
      boxShadow: {
        'soft-xs': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'soft-sm': '0 2px 8px -2px rgba(0, 0, 0, 0.04), 0 1px 4px -1px rgba(0, 0, 0, 0.02)',
        'soft-md': '0 6px 16px -4px rgba(0, 0, 0, 0.04), 0 2px 6px -2px rgba(0, 0, 0, 0.02)',
        'soft-lg': '0 12px 28px -6px rgba(0, 0, 0, 0.05), 0 4px 10px -2px rgba(0, 0, 0, 0.03)',
      },
      fontFamily: {
        sans: [
          'Plus Jakarta Sans',
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
