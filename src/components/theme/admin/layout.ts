import { cva } from 'class-variance-authority'

export const adminLayout = {
  root: 'min-h-screen bg-background',
  sidebar: {
    wrapper: 'fixed inset-y-0 left-0 z-30 hidden w-64 transform transition-transform duration-200 ease-in-out lg:block bg-card',
    header: 'h-14 border-b px-4 flex items-center justify-between',
    nav: 'flex-1 space-y-1 p-4',
    link: {
      base: 'flex items-center rounded-md px-3 py-2 text-sm font-medium',
      active: 'bg-primary text-primary-foreground',
      inactive: 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
    }
  },
  main: {
    wrapper: 'flex flex-col lg:pl-64',
    header: 'sticky top-0 z-10 h-14 border-b bg-background px-4 lg:px-6 flex items-center gap-4',
    content: 'flex-1 p-4 lg:p-6'
  }
}

export const adminContainer = cva('container mx-auto', {
  variants: {
    maxWidth: {
      sm: 'max-w-screen-sm',
      md: 'max-w-screen-md',
      lg: 'max-w-screen-lg',
      xl: 'max-w-screen-xl',
      '2xl': 'max-w-screen-2xl',
      full: 'max-w-full'
    },
    padding: {
      none: '',
      sm: 'px-4',
      md: 'px-6',
      lg: 'px-8'
    }
  },
  defaultVariants: {
    maxWidth: 'xl',
    padding: 'md'
  }
}) 