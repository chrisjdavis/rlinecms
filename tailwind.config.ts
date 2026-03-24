import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // @ts-expect-error
  safelist: [
  ],
  theme: {
    fontFamily: {
      sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      heading: ['var(--font-heading)', 'system-ui', 'sans-serif'],
      serif: ['var(--font-serif)', 'Georgia', 'serif'],
      mono: ['ui-monospace', 'monospace'],
    },
    extend: {
      typography: {
        DEFAULT: {
          css: {
            'font-family': 'var(--font-sans)',
            '--tw-prose-body': 'var(--font-sans)',
            '--tw-prose-headings': 'var(--font-heading)',
            h1: {
              'font-family': 'var(--font-heading)',
            },
            h2: {
              'font-family': 'var(--font-heading)',
            },
            h3: {
              'font-family': 'var(--font-heading)',
            },
            h4: {
              'font-family': 'var(--font-heading)',
            },
            h5: {
              'font-family': 'var(--font-heading)',
            },
            h6: {
              'font-family': 'var(--font-heading)',
            },
            p: {
              'font-family': 'var(--font-sans)',
            },
            li: {
              'font-family': 'var(--font-sans)',
            },
            blockquote: {
              'font-family': 'var(--font-sans)',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

export default config 