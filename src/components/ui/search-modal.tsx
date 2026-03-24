"use client"

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import debounce from 'lodash/debounce'
import { MagnifyingGlassIcon } from '@radix-ui/react-icons'

interface SearchResult {
  type: 'post' | 'page'
  title: string
  slug: string
  excerpt: string
  createdAt: string
}

interface SearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DEBOUNCE_MS = 300

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const debouncedSearch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([])
        return
      }

      setIsLoading(true)
      
      fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
        .then(response => {
          if (!response.ok) throw new Error('Search failed')
          return response.json()
        })
        .then(data => {
          setResults(data.results || [])
        })
        .catch(error => {
          console.error('Search failed:', error)
          setResults([])
        })
        .finally(() => {
          setIsLoading(false)
        })
    },
    [] // Only setResults and setIsLoading are stable setState functions, so no dependencies needed
  )

  useEffect(() => {
    const handler = debounce(debouncedSearch, DEBOUNCE_MS)
    handler(query)
    
    return () => {
      handler.cancel()
    }
  }, [query, debouncedSearch])

  const handleResultClick = (result: SearchResult) => {
    onOpenChange(false)
    router.push(`/${result.type}s/${result.slug}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none bg-transparent">
        <DialogTitle className="sr-only">Search Content</DialogTitle>
        
        <div className="flex items-center border-2 !p-4 bg-white border-black">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 ml-0 mr-4" />
          <Input
            placeholder="Search posts, tags and authors"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-1 rounded-none px-3 py-3 !pl-2 text-base focus-visible:ring-0 placeholder:text-gray-400"
            autoFocus
          />
        </div>

        {query && (
          <div className="max-h-[60vh] bg-white !mt-2 border-2 border-black overflow-auto">            
            {results.map((result) => (
              <button
                key={`${result.type}-${result.slug}`}
                className="w-full text-left !p-4 hover:bg-gray-50 transition-colors"
                onClick={() => handleResultClick(result)}
              >
                <h3 className="font-medium !my-1 text-base">{result.title}</h3>
                {result.excerpt && (
                  <p className="mt-1 text-sm text-gray-500 line-clamp-1">
                    {result.excerpt}
                  </p>
                )}
              </button>
            ))}

            {isLoading ? (
              <div className="p-4 text-center text-sm text-gray-500">
                Searching...
              </div>
            ) : results.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                No results found
              </div>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 