// Configurazione di Tailwind (Play CDN, copia locale in vendor/): design token del sito.
// Sta in un file a parte, non inline in index.html, così la Content-Security-Policy
// (vercel.json) può vietare gli script inline. Va caricato subito dopo vendor/tailwindcss-*.js.
tailwind.config = {
  future: { hoverOnlyWhenSupported: true },
  theme: {
    extend: {
      colors: {
        bg: "#F5F3EF", bg2: "#ECE8E1", surface: "#FFFFFF",
        ink: "#15171C", inksoft: "#33353D", muted: "#5C5D64", faint: "#8A8B91",
        line: "#E4E0D8", linesoft: "#EEEBE5",
        red: "#E4002B", redcta: "#C20023", reddeep: "#9C001C",
        graphite: "#15171C", bio: "#2E7D5B", biosoft: "#EAF3EE",
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', "sans-serif"],
        sans: ['"Hanken Grotesk"', "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(21,23,28,.04), 0 8px 24px -12px rgba(21,23,28,.12)",
        lift: "0 2px 4px rgba(21,23,28,.04), 0 24px 48px -20px rgba(21,23,28,.22)",
        glass: "0 8px 40px -12px rgba(21,23,28,.18)",
      },
    },
  },
};
