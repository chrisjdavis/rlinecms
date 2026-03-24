"use client"

import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

interface ArticleProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
}

export function Article({ children, className, ...props }: ArticleProps) {
  return (
    <article className={cn(className)} {...props}>
      {children}
    </article>
  )
}

interface ContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function Content({ children, className, ...props }: ContentProps) {
  return (
    <div className={cn("content", className)} {...props}>
      {children}
    </div>
  )
}

interface ArticleParagraphProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode
}

export function ArticleParagraph({ children, className, ...props }: ArticleParagraphProps) {
  const { theme } = useTheme()
  const paragraphStyles = theme?.components?.article?.paragraph

  return (
    <p
      className={cn(className)}
      style={{
        marginTop: paragraphStyles?.marginTop,
        marginBottom: paragraphStyles?.marginBottom,
      }}
      {...props}
    >
      {children}
    </p>
  )
} 