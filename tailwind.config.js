/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('nativewind/preset')],
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        // Artico Fonts
        'artico': ['Artico-Black', 'sans-serif'],
        'artico-bold': ['Artico-Bold', 'sans-serif'],
        'artico-medium': ['Artico-Medium', 'sans-serif'],
        'artico-black-italic': ['Artico-BlackItalic', 'sans-serif'],
        
        // ManRope Fonts
        'manrope': ['ManRope-Regular', 'sans-serif'],
        'manrope-extralight': ['ManRope-ExtraLight', 'sans-serif'],
        'manrope-light': ['ManRope-Light', 'sans-serif'],
        'manrope-medium': ['ManRope-Medium', 'sans-serif'],
        'manrope-semibold': ['ManRope-SemiBold', 'sans-serif'],
        'manrope-bold': ['ManRope-Bold', 'sans-serif'],
        'manrope-extrabold': ['ManRope-ExtraBold', 'sans-serif'],
        
        // BebasNeue Fonts
        'bebas': ['BebasNeue-Regular', 'sans-serif'],
      },
      colors: {
        primary: '#45AF31',
        secondary: '#525252',
        success: '#45AF31',
        warning: '#FF9800',
        error: '#F44336',
        background: {
          default: '#F5F5F5',
          paper: '#FFFFFF',
        },
        text: {
          primary: '#212121',
          secondary: '#757575',
          placeholder: "#A8A8A8",
          grays100: "#322D2D",
          grays80: "#5B5757",

        },
        gray: {
          100: '#F5F5F5',
          200: '#EEEEEE',
          300: '#E0E0E0',
          400: '#BDBDBD',
          500: '#9E9E9E',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#212121',
        },
      },
      fontSize: {
        'xs': 12,
        'sm': 14,
        'base': 16,
        'lg': 18,
        'xl': 20,
        '2xl': 24,
        '3xl': 30,
        '4xl': 36,
      },
      spacing: {
        'xs': 4,
        'sm': 8,
        'md': 16,
        'lg': 24,
        'xl': 32,
        '2xl': 48,
        '3xl': 64,
        // Global padding values
        'screen': 24, // Standard screen padding
        'screen-sm': 16, // Smaller screen padding
        'screen-lg': 32, // Larger screen padding
      },
    },
  },
  plugins: [],
} 