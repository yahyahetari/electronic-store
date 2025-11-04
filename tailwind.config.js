/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        'bg-img': "",
      },
      backdropFilter: {
        'glass': 'blur(10px)',
      },
      backgroundColor: {
        'glass': 'rgba(0, 0, 0, 0.1)',
        'h-glass':'rgba(0, 0, 0, 0.3)',
      },
    },
    
    
  },
  plugins: [
    require('tailwindcss-filters'),
  ],
}
