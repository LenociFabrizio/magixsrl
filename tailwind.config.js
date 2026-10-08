// Configurazione di Tailwind per generare tailwind.css (npm run build:css): design token del sito.
// Il CSS si genera in locale e si committa: gli hosting non eseguono nessuna build.
// Dopo aver aggiunto o cambiato classi in index.html, script.js o catalog-data.js
// va rigenerato (npm test segnala se tailwind.css non è aggiornato).
module.exports = {
  content: ["./index.html", "./script.js", "./catalog-data.js"],
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
