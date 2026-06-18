import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2xl": "1.25rem",
      },
      boxShadow: {
        // Jobie uslubidagi yumshoq, past-kontrastli soyalar
        soft: "0 2px 10px rgba(17, 20, 45, 0.05)",
        card: "0 8px 28px -12px rgba(17, 20, 45, 0.14)",
        pop: "0 12px 32px -8px rgba(108, 93, 211, 0.30)",
        sheet: "0 -8px 40px -12px rgba(17, 20, 45, 0.25)",
      },
      keyframes: {
        "overlay-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "overlay-out": { from: { opacity: "1" }, to: { opacity: "0" } },
        // Mobil: pastdan ko'tariladigan sheet
        "sheet-in": {
          from: { transform: "translateY(100%)", opacity: "0.6" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "sheet-out": {
          from: { transform: "translateY(0)", opacity: "1" },
          to: { transform: "translateY(100%)", opacity: "0" },
        },
        // Desktop: markazda yumshoq paydo bo'lish (transform'ga tegmaydi — markazlash saqlanadi)
        "dialog-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "dialog-out": { from: { opacity: "1" }, to: { opacity: "0" } },
      },
      animation: {
        "overlay-in": "overlay-in 160ms ease-out",
        "overlay-out": "overlay-out 140ms ease-in",
        "sheet-in": "sheet-in 280ms cubic-bezier(0.32, 0.72, 0, 1)",
        "sheet-out": "sheet-out 200ms ease-in",
        "dialog-in": "dialog-in 160ms ease-out",
        "dialog-out": "dialog-out 120ms ease-in",
      },
    },
  },
  plugins: [],
};

export default config;
