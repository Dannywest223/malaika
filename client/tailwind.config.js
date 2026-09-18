/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx}'],
    theme: {
      extend: {
        fontFamily: {
          display: ['"Playfair Display"', 'serif'],
          body: ['Inter', 'sans-serif'],
        },
        colors: {
          rose: {
            glow: '#ff4d9e',
            soft: '#ff9ec7',
            deep: '#2a0a2f',
            darker: '#1a0a1f',
          },
          gold: '#ffd166',
        },
        boxShadow: {
          glow: '0 0 30px rgba(255,77,158,0.5)',
          soft: '0 8px 32px rgba(255,77,158,0.2)',
        },
      },
    },
    plugins: [],
  }