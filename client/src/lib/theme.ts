import { type Config } from "tailwindcss"

export const theme = {
  extend: {
    fontFamily: {
      sans: ['Quicksand', 'sans-serif'],
      display: ['Caveat', 'cursive'],
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
      },
      "float": {
        "0%, 100%": { transform: "translateY(0)" },
        "50%": { transform: "translateY(-5px)" },
      },
      "wiggle": {
        "0%, 100%": { transform: "rotate(0) scale(1.1)" },
        "25%": { transform: "rotate(-3deg) scale(1.1)" },
        "75%": { transform: "rotate(3deg) scale(1.1)" },
      }
    },
    animation: {
      "pop-in": "pop-in 0.2s ease-bounce",
      "float": "float 3s ease-in-out infinite",
      "wiggle": "wiggle 0.5s ease-in-out",
    }
  },
} satisfies Config["theme"] 