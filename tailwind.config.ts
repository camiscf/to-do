import type { Config } from 'tailwindcss'

export default {
  content: ["./app/routes/_index.jsx", "./app/routes/login._index.jsx"],
  theme: {
    extend: {
      fontFamily: {
        'roboto': ['Roboto', 'sans-serif']
      },
    },
  },
  plugins: [],
} satisfies Config

