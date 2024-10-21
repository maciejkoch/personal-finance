/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        'pf-background': 'rgba(var(--background) / <alpha-value>)',
        'pf-foreground': 'rgb(var(--foreground) / <alpha-value>)',
        'pf-border': 'rgb(var(--border) / <alpha-value>)',
        'pf-primary': 'rgb(var(--primary) / <alpha-value>)',
      },
    },
  },
  plugins: [],
};
