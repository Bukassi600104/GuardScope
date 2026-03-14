/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./popup.html",
    "./src/sidebar/sidebar.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'gs-bg': '#0f1117',
        'gs-surface': '#1a1d27',
        'gs-border': '#2a2d3a',
        'gs-text': '#e2e8f0',
        'gs-muted': '#64748b',
        'gs-safe': '#22c55e',
        'gs-low': '#FFB020',
        'gs-medium': '#f97316',
        'gs-high': '#ef4444',
        'gs-critical': '#991b1b',
        'primary': '#ef4343',
      },
    },
  },
  plugins: [],
}
