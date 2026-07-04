module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#111827',
        surfaceSoft: '#1f2937',
        accent: '#8b5cf6',
      },
      boxShadow: {
        glow: '0 20px 50px rgba(139,92,246,0.24)',
      },
    },
  },
  darkMode: 'class',
  plugins: [],
};
