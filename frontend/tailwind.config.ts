import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "#19191B",
        foreground: "#eeeef0",
        primary: {
          DEFAULT: "var(--primary-main)",
          foreground: "var(--primary-text)",
          light: "var(--primary-light)",
          dark: "var(--primary-dark)",
        },
        secondary: {
          DEFAULT: "var(--secondary-main)",
          foreground: "var(--primary-text)",
        },
        destructive: {
          DEFAULT: "var(--error-main)",
          foreground: "var(--primary-text)",
        },
        success: {
          DEFAULT: "var(--success-main)",
        },
        warning: {
          DEFAULT: "var(--warning-main)",
        },
        background: "var(--outer-background)",
        foreground: "var(--primary-text)",
        card: {
          DEFAULT: "var(--inner-background)",
          foreground: "var(--primary-text)",
        },
        chat: {
          input: "var(--chat-input)",
          "bubble-user": "var(--primary-main)",
          "bubble-bot": "var(--inner-background)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar-background)",
        },
        

      },
      backgroundImage: {
        "gradient-primary": "var(--gradient-primary)",
        "gradient-card": "var(--gradient-card)",
        "gradient-header": "var(--gradient-header)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "fade-in": {
          "0%": { 
            opacity: "0", 
            transform: "translateY(10px)" 
          },
          "100%": { 
            opacity: "1", 
            transform: "translateY(0)" 
          }
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.6s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
