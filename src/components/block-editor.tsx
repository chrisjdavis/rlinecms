"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, GripVertical, Copy, Trash2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import DOMPurify from "dompurify"
import { ImageUpload } from "@/components/image-upload"
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import "@/app/_components/theme/styles.css"

export type BlockType = 'text' | 'heading' | 'code' | 'image' | 'html' | 'quote'

export type ImageContent = {
  url: string
  alt: string
}

export type BlockContent = string | ImageContent

export interface Block {
  id: string
  type: BlockType
  content: BlockContent
  order: number
}

export function isImageContent(content: BlockContent): content is ImageContent {
  return typeof content === "object" && content !== null && "url" in content && "alt" in content
}

export interface BlockEditorProps {
  initialContent: Record<string, Block>
  onChange: (content: Record<string, Block>) => void
  contentKey?: string // Unique identifier for the content, e.g., post id or slug
  renderToolbarExtra?: React.ReactNode
}

function SortableBlock({ block, onUpdate, onRemove, onDuplicate }: {
  block: Block
  onUpdate: (id: string, content: BlockContent) => void
  onRemove: (id: string) => void
  onDuplicate: (block: Block) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, width: '100%' }}
      className={cn(
        "rounded-lg border p-4 w-full max-w-full",
        isDragging && "border-primary"
      )}
    >
      <div className="flex items-start gap-2 w-full max-w-full">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab p-2 hover:bg-muted rounded-md"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 w-full max-w-full">
          {block.type === "text" && typeof block.content === "string" && (
            <Tabs defaultValue="write" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="write">Write</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              <TabsContent value="write">
                <textarea
                  className="w-full min-h-[500px] resize-y font-mono"
                  value={block.content}
                  onChange={(e) => onUpdate(block.id, e.target.value)}
                  placeholder="Enter markdown text..."
                />
              </TabsContent>
              <TabsContent value="preview" className="min-h-[500px]">
                <div className="font-serif prose max-w-none">
                  <ReactMarkdown>{block.content}</ReactMarkdown>
                </div>
              </TabsContent>
            </Tabs>
          )}
          {block.type === "image" && isImageContent(block.content) && (
            <div className="space-y-2">
              {block.content.url ? (
                <div className="relative">
                  <Image
                    src={block.content.url}
                    alt={block.content.alt}
                    width={800}
                    height={600}
                    className="max-h-48 mx-auto rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (isImageContent(block.content)) {
                        onUpdate(block.id, { url: "", alt: block.content.alt })
                      }
                    }}
                    className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <ImageUpload
                  onUpload={(url) => {
                    if (isImageContent(block.content)) {
                      onUpdate(block.id, {
                        url,
                        alt: block.content.alt
                      })
                    }
                  }}
                />
              )}
              <input
                type="text"
                className="w-full"
                value={isImageContent(block.content) ? block.content.alt : ""}
                onChange={(e) => {
                  if (isImageContent(block.content)) {
                    onUpdate(block.id, {
                      url: block.content.url,
                      alt: e.target.value
                    })
                  }
                }}
                placeholder="Alt text"
              />
            </div>
          )}
          {(block.type === "code" || block.type === "quote") && typeof block.content === "string" && (
            <textarea
              className="w-full min-h-[500px] resize-y font-mono"
              value={block.content}
              onChange={(e) => onUpdate(block.id, e.target.value)}
              placeholder={`Enter ${block.type}...`}
            />
          )}
          {block.type === "html" && typeof block.content === "string" && (
            <Tabs defaultValue="write" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="write">Write</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              <TabsContent value="write">
                <textarea
                  className="w-full min-h-[500px] resize-y font-mono"
                  value={block.content}
                  onChange={(e) => onUpdate(block.id, e.target.value)}
                  placeholder="Enter HTML content..."
                />
              </TabsContent>
              <TabsContent value="preview">
                <div 
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: DOMPurify.sanitize(block.content)
                  }} 
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDuplicate(block)}
            className="h-8 w-8 p-0"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(block.id)}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export function BlockEditor({ initialContent, onChange, contentKey, renderToolbarExtra }: BlockEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(() =>
    Object.entries(initialContent)
      .map(([id, block]) => ({ ...block, id }))
      .sort((a, b) => a.order - b.order)
  );

  useEffect(() => {
    setBlocks(
      Object.entries(initialContent)
        .map(([id, block]) => ({ ...block, id }))
        .sort((a, b) => a.order - b.order)
    );
  }, [contentKey, initialContent]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleBlocksChange = (newBlocks: Block[]) => {
    setBlocks(newBlocks);
    onChange(newBlocks.reduce((acc, block) => ({ ...acc, [block.id]: block }), {}));
  };

  function addBlock(type: BlockType) {
    const newBlock: Block = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content: type === "image" ? { url: "", alt: "" } : "",
      order: blocks.length,
    }
    const updatedBlocks = [...blocks, newBlock]
    handleBlocksChange(updatedBlocks)
  }

  function updateBlock(id: string, content: BlockContent) {
    const updatedBlocks = blocks.map((block) =>
      block.id === id ? { ...block, content } : block
    )
    // Only update if the content actually changed (deep equality for string/object)
    const block = blocks.find((block) => block.id === id)
    if (block) {
      if (typeof block.content === 'string' && typeof content === 'string' && block.content === content) return;
      if (typeof block.content === 'object' && typeof content === 'object' && JSON.stringify(block.content) === JSON.stringify(content)) return;
    }
    handleBlocksChange(updatedBlocks)
  }

  function removeBlock(id: string) {
    const updatedBlocks = blocks.filter((block) => block.id !== id)
    handleBlocksChange(updatedBlocks)
  }

  function duplicateBlock(block: Block) {
    const newBlock: Block = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: block.type,
      content: block.type === "image" && isImageContent(block.content) 
        ? { url: block.content.url, alt: block.content.alt }
        : block.content,
      order: blocks.length,
    }
    const updatedBlocks = [...blocks, newBlock]
    handleBlocksChange(updatedBlocks)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((block) => block.id === active.id)
      const newIndex = blocks.findIndex((block) => block.id === over.id)

      const updatedBlocks = arrayMove(blocks, oldIndex, newIndex)
      // Update the order of all blocks
      const blocksWithOrder = updatedBlocks.map((block, index) => ({
        ...block,
        order: index,
      }))
      handleBlocksChange(blocksWithOrder)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => addBlock("text")}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Markdown
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => addBlock("image")}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Image
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => addBlock("code")}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Code
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => addBlock("quote")}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Quote
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => addBlock("html")}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add HTML
        </Button>
        <div className="flex-1" />
        {renderToolbarExtra}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={blocks.map(block => block.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {blocks.map((block) => {
              return (
                <SortableBlock
                  key={block.id}
                  block={block}
                  onUpdate={updateBlock}
                  onRemove={removeBlock}
                  onDuplicate={duplicateBlock}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
} 