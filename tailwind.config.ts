import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        card: "var(--card)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        border: "var(--border)",
        accent: "var(--accent)",
        "accent-dark": "var(--accent-dark)",
        "accent-bg": "var(--accent-bg)",
        hp: "var(--hp)",
        sp: "var(--sp)",
        "sp-bg": "var(--sp-bg)",
        mp: "var(--mp)",
        "mp-bg": "var(--mp-bg)",
        warn: "var(--warn)",
        "warn-bg": "var(--warn-bg)",
        good: "var(--good)",
        "good-bg": "var(--good-bg)",
      },
      borderRadius: {
        card: "14px",
      },
    },
  },
  plugins: [],
};

export default config;
