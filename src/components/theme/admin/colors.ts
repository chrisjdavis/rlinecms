import { cva } from 'class-variance-authority'

export const background = cva('', {
  variants: {
    tone: {
      primary: 'bg-background',
      secondary: 'bg-secondary',
      muted: 'bg-muted',
      accent: 'bg-accent',
      card: 'bg-card'
    },
    hover: {
      true: 'hover:bg-accent/50'
    }
  },
  defaultVariants: {
    tone: 'primary',
    hover: false
  }
})

export const textColor = cva('', {
  variants: {
    tone: {
      primary: 'text-foreground',
      secondary: 'text-secondary-foreground',
      muted: 'text-muted-foreground',
      accent: 'text-accent-foreground'
    }
  },
  defaultVariants: {
    tone: 'primary'
  }
})

export const border = cva('', {
  variants: {
    tone: {
      primary: 'border-border',
      secondary: 'border-secondary',
      muted: 'border-muted',
      accent: 'border-accent'
    },
    width: {
      thin: 'border',
      medium: 'border-2',
      thick: 'border-4'
    }
  },
  defaultVariants: {
    tone: 'primary',
    width: 'thin'
  }
}) 