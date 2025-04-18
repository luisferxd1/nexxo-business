/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        'custom-blue': '#000000',
        'custom-cyan': '#004aad',
        'custom-white': 'white',
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = {
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none', // Oculta la barra en Internet Explorer y Edge
          'scrollbar-width': 'none', // Oculta la barra en Firefox
          '&::-webkit-scrollbar': {
            display: 'none', // Oculta la barra en Chrome, Safari y Opera
          },
        },
      };
      addUtilities(newUtilities);
    },
  ],
};