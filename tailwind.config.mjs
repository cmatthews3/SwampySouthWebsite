/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        cream: '#F5F1EA',
        ink: '#161E2B',
        moss: {
          DEFAULT: '#4F6A55',
          deep: '#3D5443',
          soft: '#7A8F7E',
        },
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      maxWidth: {
        prose: '38rem',
      },
    },
  },
  plugins: [],
};
