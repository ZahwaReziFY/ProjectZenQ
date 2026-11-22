/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  // Preflight (reset CSS Tailwind) dimatiin biar gak bentrok sama CSS mockup
  corePlugins: { preflight: false },
  theme: {
    extend: {
      // Warna diambil dari variabel CSS mockup (src/styles/mockup.css -> :root)
      colors: {
        brand: 'var(--brand)',
        'brand-d': 'var(--brand-d)',
        muted: 'var(--muted)',
        soft: 'var(--soft)',
        danger: 'var(--red)',
        success: 'var(--green)',
      },
    },
  },
  plugins: [],
};
