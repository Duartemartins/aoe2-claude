/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aoe: {
          gold: '#d4a017',
          'gold-light': '#e8c547',
          brown: '#8b4513',
          'brown-light': '#a0522d',
          red: '#b22222',
          'red-light': '#cd5c5c',
          dark: '#1a1208',
          darker: '#0f0a04',
          stone: '#2d261b',
          parchment: '#c4a66a',
        }
      }
    },
  },
  plugins: [],
}
