"use client"

import { Button } from "@/components/ui/button"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange?: (page: number) => void
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const handlePrevious = () => {
    if (currentPage > 1 && onPageChange) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages && onPageChange) {
      onPageChange(currentPage + 1)
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="flex justify-center items-center gap-2 sm:gap-4">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="px-3 sm:px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
        >
          Prev
        </Button>
        
        <Button
          variant="default"
          className="px-3 sm:px-6 py-2 bg-primary text-primary-foreground text-sm sm:text-base"
        >
          {currentPage}
        </Button>
        
        <Button
          variant="outline"
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="px-3 sm:px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed border-transparent text-sm sm:text-base"
        >
          Next
        </Button>
      </div>
    </div>
  )
}

