import { type Config } from "tailwindcss"

export const theme = {
  extend: {
    fontFamily: {
      quicksand: ['Quicksand', 'sans-serif'],
    },
    borderRadius: {
      lg: 'var(--radius)',
      md: 'calc(var(--radius) - 2px)',
      sm: 'calc(var(--radius) - 4px)',
    },
    keyframes: {
      "pop-in": {
        "0%": { transform: "scale(0.95)", opacity: "0" },
        "100%": { transform: "scale(1)", opacity: "1" },
      }
    },
    animation: {
      "pop-in": "pop-in 0.2s ease-out",
    }
  },
} satisfies Config["theme"] 