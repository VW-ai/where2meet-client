import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    fontSize: {
      'xs': ['1rem', { lineHeight: '1.5rem' }],          // was 0.75rem (12px) -> now 16px
      'sm': ['1.125rem', { lineHeight: '1.75rem' }],     // was 0.875rem (14px) -> now 18px
      'base': ['1.25rem', { lineHeight: '1.875rem' }],   // was 1rem (16px) -> now 20px
      'lg': ['1.5rem', { lineHeight: '2rem' }],          // was 1.125rem (18px) -> now 24px
      'xl': ['1.75rem', { lineHeight: '2.25rem' }],      // was 1.25rem (20px) -> now 28px
      '2xl': ['2rem', { lineHeight: '2.5rem' }],         // was 1.5rem (24px) -> now 32px
      '3xl': ['2.5rem', { lineHeight: '2.75rem' }],      // was 1.875rem (30px) -> now 40px
      '4xl': ['3rem', { lineHeight: '3rem' }],           // was 2.25rem (36px) -> now 48px
      '5xl': ['3.75rem', { lineHeight: '1' }],           // was 3rem (48px) -> now 60px
      '6xl': ['4.5rem', { lineHeight: '1' }],            // was 3.75rem (60px) -> now 72px
      '7xl': ['5.5rem', { lineHeight: '1' }],            // was 4.5rem (72px) -> now 88px
      '8xl': ['7rem', { lineHeight: '1' }],              // was 6rem (96px) -> now 112px
      '9xl': ['9rem', { lineHeight: '1' }],              // was 8rem (128px) -> now 144px
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-afacad-flux)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
