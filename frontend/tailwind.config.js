module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'plus-jakarta': ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        emerald: {
          50: '#f0fdf6',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#1a6b50',
          600: '#0f4c3a',
          700: '#0d3f30',
          800: '#0a3326',
          900: '#07261c',
        },
        glass: {
          bg: 'rgba(255, 255, 255, 0.85)',
          border: 'rgba(0, 0, 0, 0.08)',
          hover: 'rgba(0, 0, 0, 0.04)',
        },
        dark: {
          primary: '#f0f2f5',
          secondary: '#e8ebef',
          card: '#ffffff',
        },
      },
    },
  },
  plugins: [],
}
