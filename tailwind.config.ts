import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cactus: {
          50: '#f0faf4',
          100: '#d1f0de',
          200: '#a3e1bd',
          300: '#6dc99a',
          400: '#40916c',
          500: '#2d6a4f',
          600: '#1b4332',
          700: '#143328',
          800: '#0d221a',
          900: '#07110d',
        },
      },
    },
  },
  plugins: [],
};

export default config;
