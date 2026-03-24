import { cva } from 'class-variance-authority'

export const card = cva('rounded-lg border bg-card text-card-foreground shadow-sm', {
  variants: {
    padding: {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8'
    },
    hover: {
      true: 'hover:shadow-md transition-shadow duration-200'
    }
  },
  defaultVariants: {
    padding: 'md',
    hover: false
  }
})

export const section = cva('', {
  variants: {
    spacing: {
      sm: 'space-y-4',
      md: 'space-y-6',
      lg: 'space-y-8'
    },
    padding: {
      none: '',
      sm: 'py-4',
      md: 'py-6',
      lg: 'py-8'
    }
  },
  defaultVariants: {
    spacing: 'md',
    padding: 'none'
  }
})

export const grid = cva('grid', {
  variants: {
    cols: {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4'
    },
    gap: {
      sm: 'gap-4',
      md: 'gap-6',
      lg: 'gap-8'
    },
    responsive: {
      true: 'md:grid-cols-2 lg:grid-cols-3'
    }
  },
  defaultVariants: {
    cols: 1,
    gap: 'md',
    responsive: false
  }
})

export const flex = cva('flex', {
  variants: {
    direction: {
      row: 'flex-row',
      col: 'flex-col'
    },
    align: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end'
    },
    justify: {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between'
    },
    gap: {
      sm: 'gap-4',
      md: 'gap-6',
      lg: 'gap-8'
    }
  },
  defaultVariants: {
    direction: 'row',
    align: 'start',
    justify: 'start',
    gap: 'md'
  }
}) 