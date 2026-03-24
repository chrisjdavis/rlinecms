import Image from 'next/image'
import ReactMarkdown, { type Components } from 'react-markdown'
import sanitizeHtml from 'sanitize-html'
import parse, { DOMNode, Element } from 'html-react-parser'
import { Highlight, themes } from 'prism-react-renderer'
import type { ReactNode } from 'react'
import type { Block, ImageContent } from './contentTypes'

const sanitizeOptions = {
  allowedTags: [
    'p',
    'div',
    'span',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'li',
    'a',
    'strong',
    'em',
    'blockquote',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'img',
    'br',
    'pre',
    'code',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target'],
    img: ['src', 'alt', 'title'],
    code: ['class'],
    pre: ['class'],
    '*': ['class'],
  },
  textFilter(text: string): string {
    return text.replace(/\\"/g, '"')
  },
}

function cleanupNestedLinks(html: string): string {
  html = html.replace(/href=\\"(.*?)\\"/g, 'href="$1"')
  let cleaned = html
  const linkPattern = /<a[^>]*>.*?<\/a>/g
  cleaned = cleaned.replace(linkPattern, (match) => {
    if (match.includes('<a')) {
      return match.replace(/<[^>]+>/g, '')
    }
    return match
  })
  return cleaned
}

function decodeHTMLEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&#x2F;': '/',
    '&#x2d;': '-',
    '&ndash;': '–',
    '&mdash;': '—',
    '&copy;': '©',
    '&reg;': '®',
    '&trade;': '™',
  }
  return text.replace(/&[#\w]+;/g, (entity) => entities[entity] || entity)
}

export function isHtml(str: string): boolean {
  const htmlRegex = /<[a-z][\s\S]*>/i
  return htmlRegex.test(str)
}

function CodeBlock({
  content,
  language = 'typescript',
}: {
  content: string
  language?: string
}) {
  const cleanContent = content
    .replace(/<\/?pre>/g, '')
    .replace(/<\/?code>/g, '')
    .trim()

  return (
    <Highlight theme={themes.nightOwl} code={cleanContent} language={language}>
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre
          className="minimal-code-block overflow-x-auto rounded-md my-8 text-sm"
          style={style}
        >
          <code className={`${className} block p-4`}>
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                <span className="inline-block w-8 text-white/40 select-none">
                  {i + 1}
                </span>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </code>
        </pre>
      )}
    </Highlight>
  )
}

function MarkdownContent({ content }: { content: string }) {
  const components: Components = {
    code(props) {
      const match = /language-(\w+)/.exec(props.className || '')
      const language = match ? match[1] : 'text'
      const code = String(props.children).trim()
      const isInline = !code.includes('\n')
      if (isInline) {
        return (
          <code className="minimal-inline-code rounded px-1 py-0.5 text-[0.9em]">
            {code}
          </code>
        )
      }
      return <CodeBlock content={code} language={language} />
    },
  }
  return <ReactMarkdown components={components}>{content}</ReactMarkdown>
}

export function renderContent(content: unknown, type: string): ReactNode {
  if (!content) return null
  const stringContent = String(content)

  if (type === 'html' || isHtml(stringContent)) {
    const cleanedHtml = cleanupNestedLinks(stringContent)
    const sanitizedHtml = sanitizeHtml(cleanedHtml, sanitizeOptions)
    return parse(sanitizedHtml, {
      replace: (domNode: DOMNode) => {
        if (
          domNode instanceof Element &&
          'name' in domNode &&
          'attribs' in domNode &&
          'children' in domNode
        ) {
          if (domNode.name === 'code') {
            const codeContent =
              domNode.children?.[0] && 'data' in domNode.children[0]
                ? domNode.children[0].data
                : ''
            if (
              domNode.parent &&
              'name' in domNode.parent &&
              domNode.parent.name === 'pre'
            ) {
              let language = 'text'
              const classAttr = domNode.attribs?.class || ''
              const languageMatch =
                classAttr.match(/language-(\w+)/) ||
                classAttr.match(/brush:\s*(\w+)/)
              if (languageMatch) {
                language = languageMatch[1]
              }
              return (
                <CodeBlock content={String(codeContent).trim()} language={language} />
              )
            }
            return (
              <code className="minimal-inline-code rounded px-1 py-0.5 text-[0.9em]">
                {codeContent}
              </code>
            )
          }
        }
        return undefined
      },
    })
  }

  if (type === 'markdown') {
    return <MarkdownContent content={stringContent} />
  }

  return decodeHTMLEntities(stringContent)
}

function toImageContent(content: unknown): ImageContent {
  if (typeof content === 'string') {
    try {
      const p = JSON.parse(content) as { url?: string; alt?: string }
      return { url: p.url || '', alt: p.alt }
    } catch {
      return { url: content, alt: '' }
    }
  }
  if (content && typeof content === 'object' && 'url' in content) {
    return content as ImageContent
  }
  return { url: '', alt: '' }
}

export function renderBlock(block: Block): ReactNode {
  const blockType = block.type?.toLowerCase()

  switch (blockType) {
    case 'text': {
      const textContent = block.content as string
      if (isHtml(textContent)) {
        const cleanedHtml = cleanupNestedLinks(textContent)
        const sanitizedHtml = sanitizeHtml(cleanedHtml, sanitizeOptions)
        return (
          <div
            className="theme-minimal-prose font-serif prose prose-stone max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          />
        )
      }
      return (
        <div className="theme-minimal-prose font-serif prose prose-stone max-w-none">
          <MarkdownContent content={textContent} />
        </div>
      )
    }
    case 'markdown':
      return (
        <div className="theme-minimal-prose font-serif prose prose-stone max-w-none">
          <MarkdownContent content={block.content as string} />
        </div>
      )
    case 'heading':
      return (
        <h2 className="font-heading text-2xl font-medium tracking-tight mt-12 mb-4 text-stone-900">
          {block.content as string}
        </h2>
      )
    case 'code':
      return (
        <CodeBlock
          content={block.content as string}
          language={block.language || 'text'}
        />
      )
    case 'html': {
      const htmlContent = block.content as string
      const cleanedHtml = cleanupNestedLinks(htmlContent)
      const sanitizedHtml = sanitizeHtml(cleanedHtml, sanitizeOptions)
      return (
        <div
          className="theme-minimal-prose font-serif prose prose-stone max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
      )
    }
    case 'image': {
      const imageContent = toImageContent(block.content)
      if (!imageContent.url) return null
      return (
        <figure className="my-10">
          <Image
            src={imageContent.url}
            alt={imageContent.alt || ''}
            width={1200}
            height={800}
            className="w-full h-auto rounded-sm"
          />
          {imageContent.alt && (
            <figcaption className="mt-3 text-center text-sm text-stone-500 font-serif">
              {imageContent.alt}
            </figcaption>
          )}
        </figure>
      )
    }
    case 'quote':
      return (
        <blockquote className="border-l-2 border-stone-300 pl-5 my-8 italic font-serif text-stone-700 leading-relaxed">
          {String(block.content)}
        </blockquote>
      )
    default:
      return null
  }
}
