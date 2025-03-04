/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f1f9',
          100: '#cce3f3',
          200: '#99c7e6',
          300: '#66abd9',
          400: '#338fcc',
          500: '#3498db', // Bright blue
          600: '#2980b9',
          700: '#1f6592',
          800: '#164a6b',
          900: '#0d2f45',
          950: '#0a1f2e',
        },
        secondary: {
          50: '#e7f5f2',
          100: '#d0ebe5',
          200: '#a1d7cb',
          300: '#72c3b1',
          400: '#43af97',
          500: '#1abc9c', // Teal
          600: '#159c81',
          700: '#107d67',
          800: '#0b5d4d',
          900: '#063e33',
          950: '#042e26',
        },
        dark: {
          50: '#e9ecef',
          100: '#d3d9df',
          200: '#a7b3bf',
          300: '#7b8d9f',
          400: '#4f677f',
          500: '#2c3e50', // Deep blue-gray
          600: '#243342',
          700: '#1c2834',
          800: '#151e27',
          900: '#0e1419',
          950: '#090d10',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
        nav: '0 2px 4px rgba(0, 0, 0, 0.04)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(to right, #3498db, #2c3e50)',
        'gradient-secondary': 'linear-gradient(to right, #1abc9c, #16a085)',
        'gradient-danger': 'linear-gradient(to right, #e74c3c, #c0392b)',
      },
    },
  },
  plugins: [],
}