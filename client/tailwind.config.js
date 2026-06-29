/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        rise: '#ef4444',
        fall: '#3b82f6',
      },
    },
  },
  plugins: [],
};
