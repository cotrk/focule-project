/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Focule Brand Colors
        focule: {
          cyan: '#00F0FF',
          purple: '#BD00FF',
          primary: '#00F0FF',
          'primary-light': '#33F3FF',
          accent: '#BD00FF',
          // Dark Theme Colors
          'bg-primary': '#0B0B0D',
          'bg-secondary': '#121214',
          'bg-tertiary': '#161618',
          'card-bg': '#161618',
          surface: '#1F1F23',
          border: '#27272a',
          'border-subtle': 'rgba(255, 255, 255, 0.05)',
          // Typography Colors
          heading: '#FFFFFF',
          'text-primary': '#E5E5E5',
          'text-secondary': '#B8B8C0',
          'text-muted': '#8B8B94',
        }
      },
      fontFamily: {
        'montserrat': ['Montserrat', 'sans-serif'],
        'lato': ['Lato', 'sans-serif'],
        'nunito': ['Nunito Sans', 'sans-serif'],
      },
      animation: {
        'gradient-x': 'gradient-x 15s ease infinite',
        'gradient-y': 'gradient-y 15s ease infinite',
        'gradient-xy': 'gradient-xy 15s ease infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'gradient-y': {
          '0%, 100%': {
            'background-size': '400% 400%',
            'background-position': 'center top'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'center center'
          }
        },
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          }
        },
        'gradient-xy': {
          '0%, 100%': {
            'background-size': '400% 400%',
            'background-position': 'left center'
          },
          '25%': {
            'background-size': '400% 400%',
            'background-position': 'right center'
          },
          '50%': {
            'background-size': '400% 400%',
            'background-position': 'right bottom'
          },
          '75%': {
            'background-size': '400% 400%',
            'background-position': 'left bottom'
          }
        }
      }
    },
  },
  plugins: [],
}

