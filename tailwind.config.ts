import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5f8ff",
          100: "#e8efff",
          200: "#cddcff",
          300: "#a1bfff",
          400: "#6e9aff",
          500: "#3e74ff",
          600: "#1f56f5",
          700: "#1742c2",
          800: "#13359a",
          900: "#112d7d"
        }
      },
      boxShadow: {
        card: "0 2px 14px rgba(0,0,0,.06)"
      },
      borderRadius: {
        xl: "14px",
        "2xl": "20px"
      }
    }
  },
  plugins: [],
} satisfies Config;
