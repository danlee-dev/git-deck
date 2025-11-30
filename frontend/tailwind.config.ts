import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // GitHub-inspired color palette
        github: {
          red: '#d73a49',       // GitHub red/orange
          green: '#28a745',     // GitHub green
          blue: '#0366d6',      // GitHub blue
          gray: {
            50: '#fafbfc',
            100: '#f6f8fa',
            200: '#e1e4e8',
            300: '#d1d5da',
            400: '#959da5',
            500: '#6a737d',
            600: '#586069',
            700: '#444d56',
            800: '#2f363d',
            900: '#24292e',
          },
        },
      },
      fontFamily: {
        sans: [
          'Pretendard Variable',
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'Roboto',
          'Helvetica Neue',
          'Segoe UI',
          'Apple SD Gothic Neo',
          'Noto Sans KR',
          'Malgun Gothic',
          'Apple Color Emoji',
          'Segoe UI Emoji',
          'Segoe UI Symbol',
          'sans-serif',
        ],
      },
      letterSpacing: {
        tighter: '-0.025em', // -2.5%
      },
      fontSize: {
        // Refined, not too large
        'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '-0.025em' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '-0.025em' }],
        'base': ['0.9375rem', { lineHeight: '1.5rem', letterSpacing: '-0.025em' }], // 15px
        'lg': ['1rem', { lineHeight: '1.75rem', letterSpacing: '-0.025em' }],
        'xl': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.025em' }],
        '2xl': ['1.25rem', { lineHeight: '2rem', letterSpacing: '-0.025em' }],
        '3xl': ['1.5rem', { lineHeight: '2.25rem', letterSpacing: '-0.025em' }],
      },
    },
  },
  plugins: [],
};

export default config;
