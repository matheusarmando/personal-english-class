import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1F2A44",
        paper: "#F7F3EC",
        accent: "#B5842A",
        accentSoft: "#EFE3C8",
        line: "#DDD3BE",
      },
      fontFamily: {
        display: ["Source Serif 4", "serif"],
        body: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
