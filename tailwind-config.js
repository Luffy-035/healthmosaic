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
          50: '#f0fbf8',
          100: '#d0f5eb',
          200: '#a3ecd6',
          300: '#6ddcbc',
          400: '#3cc39e',
          500: '#20a583',
          600: '#188369',
          700: '#166955',
          800: '#155445',
          900: '#14463a',
          950: '#0b2922',
        },
        secondary: {
          50: '#f5f7fa',
          100: '#ebeef3',
          200: '#d2dae5',
          300: '#adbbd0',
          400: '#8097b5',
          500: '#607b9b',
          600: '#4a6283',
          700: '#3c506b',
          800: '#34455c',
          900: '#2f3c4f',
          950: '#111827',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
