/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'light-bg': '#fafaf8',
        'light-text': '#1a1a1a',
        'dark-bg': '#1a1a1a',
        'dark-text': '#e8e6e3',
        'accent': '#d97706',
      },
      fontFamily: {
        'serif': ['Georgia', 'Merriweather', 'serif'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}
