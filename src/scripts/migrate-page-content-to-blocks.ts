import { prisma } from "@/lib/prisma"
import { Block } from "@/components/block-editor"
import { blockRepository } from '@/lib/repositories/blockRepository'

async function migratePageContentToBlocks() {
  const pages = await prisma.page.findMany({
    where: {
      blocks: { none: {} },
      NOT: { content: {} }, // content is not empty
    },
  })

  for (const page of pages) {
    if (!page.content || typeof page.content !== 'object') continue
    const blocks = Object.values(page.content).map((block, idx) => {
      const b = block as unknown as Block;
      return {
        id: b.id,
        type: b.type,
        content: typeof b.content === 'object' ? b.content : b.content,
        order: b.order ?? idx,
        pageId: page.id,
      }
    })
    if (blocks.length === 0) continue
    await prisma.$transaction([
      ...blocks.map((block) =>
        blockRepository.create(block)
      ),
      prisma.page.update({
        where: { id: page.id },
        data: { content: {} },
      }),
    ])
  }
}

migratePageContentToBlocks().catch((e) => {
  console.error(e)
  process.exit(1)
}) 