/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        muted: "#5b6678",
        panel: "#ffffff",
        line: "#dce3ee",
        brand: "#1456d9",
        teal: "#0f766e",
        amber: "#b45309",
        rose: "#be123c",
      },
      boxShadow: {
        soft: "0 18px 50px rgba(23, 32, 51, 0.08)",
      },
    },
  },
  plugins: [],
};

