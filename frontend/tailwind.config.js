/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#FF6B00",
        "primary-hover": "#E85F00",
        bg: "var(--c-bg)",
        surface: "var(--c-surface)",
        "surface-hover": "var(--c-surface-hover)",
        border: "var(--c-border)",
        "border-light": "var(--c-border-l)",
        text: "var(--c-text)",
        muted: "var(--c-muted)",
        "muted-dark": "var(--c-muted-d)",
        success: "var(--c-success)",
        "success-bg": "var(--c-success-bg)",
        error: "var(--c-error)",
        "error-bg": "var(--c-error-bg)",
      },
    },
  },
  plugins: [],
}
