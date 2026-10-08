import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

// Palette ricavata dal logo Bambù: nero inchiostro, verde bambù e i quattro
// colori delle icone (libro arancio, matita magenta, forbici verdi, regalo blu).
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1rem", sm: "1.5rem", lg: "2rem" },
      screens: { "2xl": "1320px" },
    },
    extend: {
      colors: {
        ink: {
          DEFAULT: "#1d1d1f",
          soft: "#3a3a3f",
          muted: "#6b6b72",
          faint: "#9a9aa1",
        },
        paper: {
          DEFAULT: "#fafaf7",
          warm: "#f4f2ec",
          line: "#e9e6de",
        },
        brand: {
          50: "#eef7ee",
          100: "#d9eed9",
          200: "#b6ddb6",
          300: "#86c587",
          400: "#5db846",
          500: "#3f9142",
          600: "#2f7a36",
          700: "#27652d",
          800: "#214f26",
          900: "#1b3f20",
        },
        orange: { DEFAULT: "#f08a24", soft: "#fff1e3", ink: "#a85407" },
        magenta: { DEFAULT: "#d6197c", soft: "#fde8f2", ink: "#b0005f" },
        sky: { DEFAULT: "#1a8fd6", soft: "#e6f3fc", ink: "#0b6aa6" },
        leaf: { DEFAULT: "#5bb947", soft: "#eaf6e6", ink: "#2f7a36" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(29,29,31,0.04), 0 4px 16px -6px rgba(29,29,31,0.10)",
        lift: "0 2px 4px rgba(29,29,31,0.05), 0 18px 40px -14px rgba(29,29,31,0.22)",
        ring: "0 0 0 4px rgba(63,145,66,0.18)",
      },
      keyframes: {
        "slide-in-right": { from: { transform: "translateX(100%)" }, to: { transform: "translateX(0)" } },
        "slide-in-left": { from: { transform: "translateX(-100%)" }, to: { transform: "translateX(0)" } },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "pop-in": {
          from: { opacity: "0", transform: "translateY(8px) scale(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
      },
      animation: {
        "slide-in-right": "slide-in-right 0.28s cubic-bezier(0.2,0.8,0.2,1)",
        "slide-in-left": "slide-in-left 0.28s cubic-bezier(0.2,0.8,0.2,1)",
        "fade-in": "fade-in 0.2s ease-out",
        "pop-in": "pop-in 0.22s cubic-bezier(0.2,0.8,0.2,1)",
        marquee: "marquee 40s linear infinite",
      },
    },
  },
  plugins: [forms({ strategy: "class" })],
};

export default config;
