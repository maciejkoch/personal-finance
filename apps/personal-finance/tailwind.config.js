const { createGlobPatternsForDependencies } = require('@nx/angular/tailwind');
const { join } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('../../tailwind.preset.js')],
  content: [
    join(__dirname, 'src/**/!(*.stories|*.spec).{ts,html}'),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  daisyui: {
    themes: [
      {
        pf: {
          primary: '#d97706',
          secondary: '#0ea5e9',
          accent: '#f3f4f6',
          neutral: '#f97316',
          'base-100': '#111827',
          info: '#1d4ed8',
          success: '#00ff00',
          warning: '#f97316',
          error: '#FF7A7A',
        },
      },
    ],
  },
  plugins: [require('@tailwindcss/typography'), require('daisyui')],
};
