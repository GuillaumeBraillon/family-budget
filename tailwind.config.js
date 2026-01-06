/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./index.tsx", "./App.tsx", "./components/**/*.{js,ts,jsx,tsx}", "./hooks/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Couleurs personnalisées si besoin
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      cursor: {
        pointer: "pointer",
        grab: "grab",
        grabbing: "grabbing",
        move: "move",
        default: "default",
      },
    },
  },
  plugins: [],
};
