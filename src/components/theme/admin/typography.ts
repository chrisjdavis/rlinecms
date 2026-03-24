import { cva } from 'class-variance-authority'

export const heading = cva('font-heading', {
  variants: {
    level: {
      h1: 'text-3xl font-bold tracking-tight',
      h2: 'text-2xl font-semibold',
      h3: 'text-xl font-medium',
      h4: 'text-lg font-medium',
      h5: 'text-base font-medium',
      h6: 'text-sm font-medium'
    }
  },
  defaultVariants: {
    level: 'h1'
  }
})

export const typography = cva('text-foreground', {
  variants: {
    size: {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl'
    },
    weight: {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold'
    },
    font: {
      sans: 'font-sans',
      serif: 'font-serif',
      mono: 'font-mono'
    }
  },
  defaultVariants: {
    size: 'base',
    weight: 'normal',
    font: 'sans'
  }
}) 