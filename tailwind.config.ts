import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#2B2A33",
        paper: "#FAF9FC",
        accent: "#8874AE",
        accentSoft: "#E2D8F8",
        accentInk: "#665189",
        line: "#E7E6EA",
        good: "#2E9E76",
        warn: "#CC8A2A",
        bad: "#D9503D",
      },
      fontFamily: {
        display: ["Sora", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
