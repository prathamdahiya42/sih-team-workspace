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
        background: '#FAFAFA',
        foreground: '#1A1A1A',
        saffron: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#FF9933', // Core Saffron
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
          DEFAULT: '#FF9933',
        },
        sihgreen: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#138808', // Core India Green
          600: '#0F6D06',
          700: '#0B5205',
          800: '#073703',
          900: '#042002',
          DEFAULT: '#138808',
        },
        navy: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#1D4ED8',
          700: '#1E40AF',
          800: '#1E3A8A',
          900: '#000080', // Ashoka Navy
          DEFAULT: '#000080',
        },
        muted: {
          DEFAULT: '#F3F4F6',
          foreground: '#6B7280',
        },
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#1A1A1A',
        },
        border: '#E5E7EB',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.06)',
        'glow-saffron': '0 0 20px -3px rgba(255, 153, 51, 0.3)',
        'glow-green': '0 0 20px -3px rgba(19, 136, 8, 0.25)',
      },
    },
  },
  plugins: [],
};
export default config;
