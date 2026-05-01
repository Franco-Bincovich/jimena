/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#FF6B00",
        "primary-hover": "#E85F00",
        bg: "#111111",
        surface: "#171717",
        "surface-hover": "#1E1E1E",
        border: "#222222",
        "border-light": "#2A2A2A",
        text: "#F0F0F0",
        muted: "#888888",
        "muted-dark": "#555555",
        success: "#5CB85C",
        "success-bg": "#0A2A0A",
        error: "#E07070",
        "error-bg": "#2A0F0F",
      },
    },
  },
  plugins: [],
}
