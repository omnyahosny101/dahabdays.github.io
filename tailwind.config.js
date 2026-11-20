/** Dahab Days brand tokens — mirrors the "Dahab Days brand identity" design system */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#15284B",    // the two full phases + DAHAB
        abyss: "#0E1A33",   // night-dive navy for deep bands
        sea: "#15284B",     // alias of navy (used by components)
        royal: "#2A35B8",   // storefront letters
        sky: "#2EA3E3",     // Days Sky — third phase + DAYS
        lagoon: "#2EA3E3",  // alias of sky
        sun: "#F6C71E",     // Crescent Gold
        red: "#D3202F",     // Diving Center Red — the one primary action
        coral: "#D3202F",   // alias of red
        foam: "#EAF6FD",    // surface-sky
        sand: "#FBF5E9",    // surface-sand
        dune: "#F6C71E",
        ink: "#15284B",
        muted: "#4A5872"
      },
      fontFamily: {
        display: ['"Montserrat"', "system-ui", "sans-serif"],
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
        hand: ['"Caveat"', '"Segoe Print"', "cursive"],
        arabic: ['"Alexandria"', '"Noto Kufi Arabic"', "system-ui", "sans-serif"]
      },
      borderRadius: { d: "28px 999px 999px 28px" },
      boxShadow: { card: "0 1px 2px rgba(21,40,75,.06), 0 14px 34px -14px rgba(21,40,75,.35)" }
    }
  },
  plugins: []
};
