"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MagnifyingGlassIcon } from '@radix-ui/react-icons'
import { SearchModal } from '@/components/ui/search-modal'

export function SearchTrigger() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => setIsOpen(true)}
        className="hover:bg-transparent cursor-pointer text-md font-semibold text-gray-500 hover:text-black h-auto w-auto p-0 inline-flex items-center"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <MagnifyingGlassIcon className="h-5 w-5 pointer-events-none" />
        <span className="sr-only">Search</span>
      </Button>
      <SearchModal open={isOpen} onOpenChange={setIsOpen} />
    </>
  )
} 