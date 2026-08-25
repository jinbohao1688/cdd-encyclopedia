import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Academic / archival palette: warm ivory, ink, slate-blue accent
        ivory: {
          50: "#fbfaf6",
          100: "#f6f3ea",
          200: "#ede8d8",
          300: "#e0d8c0",
        },
        ink: {
          900: "#1a1a1a",
          800: "#262626",
          700: "#3a3a3a",
          600: "#525252",
          500: "#6b6b6b",
          400: "#8a8a8a",
          300: "#b0b0b0",
          200: "#d4d4d4",
          100: "#e8e8e8",
        },
        // Restrained slate-blue accent (institutional)
        slateblue: {
          50: "#f3f5f7",
          100: "#e3e9ee",
          500: "#5b7a99",
          700: "#3d5570",
          900: "#2a3c50",
        },
      },
      fontFamily: {
        serif: ["Source Serif Pro", "Georgia", "Noto Serif SC", "Songti SC", "serif"],
        sans: ["Inter", "IBM Plex Sans", "-apple-system", "PingFang SC", "Microsoft YaHei", "sans-serif"],
        mono: ["IBM Plex Mono", "Source Code Pro", "monospace"],
      },
      maxWidth: {
        article: "1100px",
        prose: "720px",
      },
    },
  },
  plugins: [],
};

export default config;
