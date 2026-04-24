/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#a660a3',
        'primary-soft': '#bb85b8',
        success: '#009734',
        'success-bg': '#dcfce7',
        muted: '#757575',
        'text-main': '#495057',
      },
      fontFamily: {
        sans: ['Noto Sans TC', 'Noto Sans JP', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '32px',
      },
    },
  },
  plugins: [],
}

