/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2d62ff',
          light: '#5a7fff',
          dark: '#1a4acc',
        },
        background: '#f6f7fb',
        surface: '#ffffff',
        text: {
          DEFAULT: '#0b1220',
          secondary: '#5a6274',
        },
        border: '#e5e7ef',
      },
      borderRadius: {
        DEFAULT: '14px',
        sm: '10px',
        lg: '16px',
      },
      boxShadow: {
        DEFAULT: '0 2px 8px rgba(0, 0, 0, 0.08)',
        md: '0 4px 12px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}
