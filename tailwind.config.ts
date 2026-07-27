import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#22262B",
        paper: "#FBF7F0",
        accent: "#E85D4C",
        accentSoft: "#FCE1D9",
        accent2: "#1C8C82",
        line: "#E8E1D3",
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
