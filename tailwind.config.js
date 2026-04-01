/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        vanta: '#030407',
        navy: '#0A0D14',
        gold: '#E5C07B',
        oat: '#F7F7F5',
      },
    },
  },
  plugins: [],
};
