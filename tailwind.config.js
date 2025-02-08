/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        neon: {
          blue: '#00f3ff',
          pink: '#ff00ff',
          green: '#00ff9f',
          purple: '#bf00ff',
          yellow: '#ffff00',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      boxShadow: {
        neon: '0 0 5px theme(colors.neon.blue), 0 0 20px theme(colors.neon.blue)',
        'neon-pink': '0 0 5px theme(colors.neon.pink), 0 0 20px theme(colors.neon.pink)',
        'neon-green': '0 0 5px theme(colors.neon.green), 0 0 20px theme(colors.neon.green)',
        'neon-purple': '0 0 5px theme(colors.neon.purple), 0 0 20px theme(colors.neon.purple)',
      },
      keyframes: {
        glow: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7 },
        },
        'neon-pulse': {
          '0%, 100%': {
            boxShadow: '0 0 5px theme(colors.neon.blue), 0 0 20px theme(colors.neon.blue)',
          },
          '50%': {
            boxShadow: '0 0 10px theme(colors.neon.blue), 0 0 30px theme(colors.neon.blue)',
          },
        },
      },
      animation: {
        glow: 'glow 2s ease-in-out infinite',
        'neon-pulse': 'neon-pulse 2s ease-in-out infinite',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};