/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        display: ['Fraunces', 'serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#8C477C',
          dark: '#6D365F',
          light: '#B26AA2',
          50: '#FCF7FB',
          100: '#F5EAF2',
          200: '#E9D4E3',
          300: '#D9B3CD',
          400: '#C387B6',
          500: '#A85A97',
          600: '#8C477C',
          700: '#6D365F',
          800: '#532A49',
          900: '#3B1D34',
        },
        accent: {
          DEFAULT: '#D16B53',
          dark: '#A74E3B',
          light: '#E8B2A4',
          50: '#FFF5F1',
          100: '#FEE7E0',
          200: '#FBCDBE',
          300: '#F4A88F',
          400: '#E68467',
          500: '#D16B53',
          600: '#B45742',
          700: '#914639',
          800: '#713731',
          900: '#532923',
        },
        secondary: {
          DEFAULT: '#3D8B75',
          dark: '#2F6B59',
          light: '#83B9A7',
        },
        surface: {
          DEFAULT: '#FFFDFC',
          raised: '#FFFFFF',
          muted: '#F7F1EE',
          border: '#E6DCD5',
        },
        dark: {
          DEFAULT: '#241B1D',
          light: '#4C3B3D',
          lighter: '#7C6B6D',
        },
      },
      boxShadow: {
        card: '0 18px 48px -24px rgba(36, 27, 29, 0.2), 0 10px 24px -18px rgba(36, 27, 29, 0.16)',
        'card-hover': '0 24px 64px -28px rgba(36, 27, 29, 0.24), 0 18px 36px -24px rgba(36, 27, 29, 0.18)',
        premium: '0 32px 80px -36px rgba(36, 27, 29, 0.32), 0 16px 36px -24px rgba(140, 71, 124, 0.18)',
        'glow-purple': '0 0 40px rgba(140, 71, 124, 0.28)',
        'glow-pink': '0 0 40px rgba(209, 107, 83, 0.2)',
        'inner-glow': 'inset 0 0 60px rgba(140, 71, 124, 0.08)',
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      animation: {
        slideInRight: 'slideInRight 0.3s ease-out',
        fadeIn: 'fadeIn 0.5s ease-out',
        fadeInUp: 'fadeInUp 0.6s ease-out forwards',
        scaleIn: 'scaleIn 0.4s ease-out',
        shimmer: 'shimmer 2s infinite',
        float: 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        '.glass': {
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(12px)',
          '-webkit-backdrop-filter': 'blur(12px)',
        },
        '.glass-dark': {
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(12px)',
          '-webkit-backdrop-filter': 'blur(12px)',
        },
      });
    },
  ],
};
