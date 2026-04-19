/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        // ── Laptop range ────────────────────────────────────────────────────
        // base (0–639px)  : mobile
        // sm   (640px+)   : small devices
        // md   (768px+)   : tablets
        // lg   (1024px+)  : small laptops, XGA (1024×768)
        // xl   (1280px+)  : covers 1280×720, 1280×800, 1366×768, 1440×900
        // 2xl  (1536px+)  : covers 1600×900 and up to FHD boundary

        // ── Large / high-res screens ─────────────────────────────────────────
        '3xl': '1900px',   // Full HD      1920×1080  (test at 1900px)
        '4xl': '2400px',   // Quad HD/2K   2560×1440  (test at 2400px)
        '5xl': '2900px',   // Retina QHD+  2880×1800  (test at 2900px)
        '6xl': '3300px',   // QHD+ / 3K    3200×1800  (test at 3300px)
        '7xl': '3800px',   // 4K UHD       3840×2160  (test at 3800px)
        '8xl': '4100px',   // DCI 4K       4096×2160  (test at 4100px)
      },
    },
  },
  plugins: [],
}
