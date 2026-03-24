import { Layout } from './Layout'
import type { ThemePagePropsLocal, Block, BlockType } from '../contentTypes'
import { renderBlock, renderContent, isHtml } from '../renderBlocks'

export default function PageLayout({
  site,
  page,
  navigation,
}: ThemePagePropsLocal & {
  navigation?: {
    header: { label: string; url: string }[]
    footer: { label: string; url: string }[]
  }
}) {
  return (
    <Layout site={site} navigation={navigation}>
      <article>
        <header className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-heading font-medium tracking-tight text-stone-900">
            {page.title}
          </h1>
          {page.createdAt && (
            <p className="mt-4 text-xs uppercase tracking-widest text-[var(--minimal-muted)] font-sans">
              {new Date(page.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          )}
        </header>

        {typeof page.content === 'string' ? (
          <div className="theme-minimal-prose font-serif prose prose-stone max-w-none">
            {renderContent(
              page.content,
              isHtml(page.content) ? 'html' : 'markdown'
            )}
          </div>
        ) : Array.isArray(page.content) ? (
          <div className="space-y-2">
            {page.content.map((block) => (
              <div key={block.id}>{renderBlock(block)}</div>
            ))}
          </div>
        ) : (
          typeof page.content === 'object' &&
          page.content !== null && (
            <div className="space-y-2">
              {Object.entries(page.content).map(([id, block]) => {
                const blockData = block as Partial<Block>
                const blockWithId: Block = {
                  id: blockData.id || id,
                  type: (blockData.type || 'text') as BlockType,
                  content: (blockData.content ?? '') as Block['content'],
                  order: blockData.order || 0,
                  language: blockData.language,
                }
                return (
                  <div key={id}>{renderBlock(blockWithId)}</div>
                )
              })}
            </div>
          )
        )}
      </article>
    </Layout>
  )
}
