/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fefce8', 100: '#fef9c3', 200: '#fef08a',
          300: '#fde047', 400: '#facc15', 500: '#eab308',
          600: '#c9a85c', 700: '#a17c2d', 800: '#854d0e', 900: '#713f12',
          950: '#431407',
        },
        gold: {
          100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d',
          400: '#fbbf24', 500: '#c9a85c', 600: '#a17c2d',
        },
        dark: {
          50:  '#e8e8f2', 100: '#c4c4d4', 200: '#9a9ab2',
          300: '#707090', 400: '#5a5a72', 500: '#3a3a50',
          600: '#252535', 700: '#17171f', 800: '#111119',
          900: '#0d0d17', 950: '#08080f',
        },
        teal: {
          300: '#5eead4', 400: '#2dd4bf', 500: '#14b8a6',
          600: '#0d9488', 700: '#0f766e',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card':      '0 1px 3px rgba(0,0,0,0.4)',
        'card-hover':'0 8px 32px rgba(0,0,0,0.5)',
        'gold':      '0 0 24px rgba(201,168,92,0.35)',
        'gold-sm':   '0 0 12px rgba(201,168,92,0.25)',
        'blue':      '0 0 24px rgba(59,130,246,0.3)',
        'teal':      '0 0 24px rgba(20,184,166,0.3)',
        'modal':     '0 32px 80px rgba(0,0,0,0.7)',
        'inner':     'inset 0 1px 3px rgba(0,0,0,0.4)',
      },
      borderRadius: {
        'xl':  '0.875rem',
        '2xl': '1.125rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      backgroundImage: {
        'shimmer': 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.06) 50%, transparent 60%)',
      },
      animation: {
        'fade-up':    'fadeUp 0.55s cubic-bezier(0.22,1,0.36,1) both',
        'fade-in':    'fadeIn 0.4s ease both',
        'scale-in':   'scaleIn 0.35s cubic-bezier(0.175,0.885,0.32,1.275) both',
        'float':      'float 4s ease-in-out infinite',
        'float-slow': 'floatSlow 6s ease-in-out infinite',
        'bounce-sm':  'float 1.8s ease-in-out infinite',
        'shimmer':    'shimmer 2s linear infinite',
        'spin-slow':  'rotateSlow 8s linear infinite',
        'pulse-ring': 'pulse-ring 2s ease-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn:   { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        float:    { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        floatSlow:{ '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        shimmer:  { '0%': { backgroundPosition: '-200% center' }, '100%': { backgroundPosition: '200% center' } },
        scaleIn:  { '0%': { opacity: '0', transform: 'scale(0.88)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        rotateSlow:{ 'to': { transform: 'rotate(360deg)' } },
        'pulse-ring': {
          '0%':   { transform: 'scale(0.95)', opacity: '0.6' },
          '70%':  { transform: 'scale(1.15)', opacity: '0' },
          '100%': { transform: 'scale(1.15)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
