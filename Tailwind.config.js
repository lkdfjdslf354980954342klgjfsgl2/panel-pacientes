/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1C2B39',
        paper: '#F7F4EE',
        rose: { DEFAULT: '#B7405E', deep: '#8F2F49', tint: '#F4E3E8' },
        teal: { DEFAULT: '#4C7A72', tint: '#E6EFEC' },
        coral: { DEFAULT: '#D9714B', tint: '#FBEAE2' },
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
