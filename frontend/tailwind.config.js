/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#F4F6F8",
        fjord: {
          DEFAULT: "#0A2540",
          hover: "#1E3A5F",
          muted: "#071D33",
        },
        slate: {
          border: "#E2E8F0",
          surface: "#F8FAFC",
          subtle: "#F1F5F9",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        "2xs": "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        "xs": "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
      },
      borderRadius: {
        tag: "4px",
      },
    },
  },
  plugins: [],
};
