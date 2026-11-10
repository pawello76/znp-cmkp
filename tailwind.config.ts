import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#1D3557', light: '#E8EEF6' },
        accent: { DEFAULT: '#B3261E', light: '#FBE7E7' },
        ink: { DEFAULT: '#16202E', soft: '#3C4653', muted: '#566170' },
        line: { DEFAULT: '#DDE1E6', strong: '#B8C0CB' },
        page: '#F3F5F8',
        ok: { DEFAULT: '#1E6B3A', light: '#E6F2EA' },
        warn: { DEFAULT: '#7A4A00', light: '#FBF0DC' },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
