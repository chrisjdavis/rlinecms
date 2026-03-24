export type BlockType = 'text' | 'heading' | 'code' | 'image'

export interface ImageContent {
  url: string
  alt: string
}

export interface Block {
  type: BlockType
  content: string | ImageContent
  order: number
} 