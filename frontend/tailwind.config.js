/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'surface-canvas': '#F7F8F5',
        'card-warm': '#FCFBF8',
        'card-border': '#D9E0E8',
        'railway-navy': '#102A43',
        'railway-blue': '#1E5AA8',
        'midnight-start': '#071A2F',
        'midnight-end': '#102A43',
        'railway-green': '#16805C',
        'railway-green-light': '#EAF6F0',
        'railway-amber': '#D9901A',
        'railway-amber-light': '#FFF7E6',
        'railway-red': '#B42332',
        'railway-red-light': '#FFF0F1',
        'signal-violet': '#7456B8',
        navy: {
          800: '#102A43',
          900: '#071A2F',
        },
        rail: {
          blue: '#1E5AA8',
          light: '#FCFBF8',
        }
      },
      fontFamily: {
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
