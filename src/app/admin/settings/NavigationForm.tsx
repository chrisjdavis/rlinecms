'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { GripVertical, X } from 'lucide-react'

export type NavLocation = 'HEADER' | 'FOOTER'

export interface NavigationItem {
  id: string
  label: string
  url: string
  location: NavLocation
  order: number
  settingsId?: string
  createdAt?: Date
  updatedAt?: Date
}

interface Page {
  id: string
  title: string
  slug: string
}

interface NavigationFormProps {
  items: NavigationItem[]
  pages: Page[]
  onSave: (items: NavigationItem[]) => Promise<void>
}

interface NavigationItemInput {
  id: string
  label: string
  url: string
  location: NavLocation
  order: number
}

export function NavigationForm({ items: initialItems, pages, onSave }: NavigationFormProps) {
  const [items, setItems] = useState<NavigationItemInput[]>(initialItems)
  const [isLoading, setIsLoading] = useState(false)

  const addItem = (location: NavLocation) => {
    const newItem: NavigationItemInput = {
      id: `temp-${Date.now()}`,
      label: '',
      url: '',
      location,
      order: items.filter(i => i.location === location).length
    }
    setItems([...items, newItem])
  }

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const updateItem = (id: string, field: keyof NavigationItemInput, value: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const handlePageSelect = (id: string, pageId: string) => {
    const page = pages.find(p => p.id === pageId)
    if (page) {
      setItems(items.map(item => 
        item.id === id 
          ? { 
              ...item, 
              label: page.title,
              url: `/${page.slug}`
            } 
          : item
      ))
    }
  }

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const location = result.source.droppableId as NavLocation
    const itemsInLocation = items.filter(i => i.location === location)
    const [reorderedItem] = itemsInLocation.splice(result.source.index, 1)
    itemsInLocation.splice(result.destination.index, 0, reorderedItem)

    // Update order for all items in this location
    const updatedItemsInLocation = itemsInLocation.map((item, index) => ({
      ...item,
      order: index
    }))

    // Merge with items from other location
    const otherItems = items.filter(i => i.location !== location)
    setItems([...otherItems, ...updatedItemsInLocation])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate items
      const invalidItems = items.filter(item => !item.label || !item.url)
      if (invalidItems.length > 0) {
        throw new Error('All navigation items must have a label and URL')
      }

      // Normalize order for each location
      const normalizedItems = ['HEADER', 'FOOTER'].flatMap((location) => {
        const locationItems = items
          .filter(item => item.location === location)
          .sort((a, b) => a.order - b.order)
          .map((item, idx) => ({ ...item, order: idx }));
        return locationItems;
      });

      await onSave(normalizedItems as NavigationItem[])
      toast.success('Navigation saved', {
        description: 'Your navigation settings have been updated successfully.'
      })
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to save navigation settings'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const renderNavigationList = (location: NavLocation) => {
    const locationItems = items.filter(item => item.location === location)
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-medium">{location === 'HEADER' ? 'Header' : 'Footer'} Navigation</h4>
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={() => addItem(location)}
          >
            Add Item
          </Button>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId={location}>
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {locationItems.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="flex items-center gap-2 bg-background p-2 rounded-md border"
                      >
                        <div {...provided.dragHandleProps} className="cursor-move">
                          <GripVertical className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <Select
                          value=""
                          onValueChange={(value) => handlePageSelect(item.id, value)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select a page" />
                          </SelectTrigger>
                          <SelectContent>
                            {pages.map((page) => (
                              <SelectItem key={page.id} value={page.id}>
                                {page.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Label"
                          value={item.label}
                          onChange={(e) => updateItem(item.id, 'label', e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          placeholder="URL"
                          value={item.url}
                          onChange={(e) => updateItem(item.id, 'url', e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-8">
        {renderNavigationList('HEADER')}
        {renderNavigationList('FOOTER')}
      </div>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save Navigation'}
      </Button>
    </form>
  )
} 