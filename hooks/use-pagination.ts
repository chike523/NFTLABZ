import { useState, useMemo } from 'react'

export interface UsePaginationProps<T> {
  items: T[]
  itemsPerPage?: number
  initialPage?: number
}

export interface PaginationResult<T> {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  paginatedItems: T[]
  startIndex: number
  endIndex: number
  hasNextPage: boolean
  hasPrevPage: boolean
  goToPage: (page: number) => void
  nextPage: () => void
  prevPage: () => void
  setItemsPerPage: (itemsPerPage: number) => void
}

export function usePagination<T>({
  items,
  itemsPerPage: initialItemsPerPage = 10,
  initialPage = 1,
}: UsePaginationProps<T>): PaginationResult<T> {
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage)

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(items.length / itemsPerPage)),
    [items.length, itemsPerPage]
  )

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return items.slice(startIndex, endIndex)
  }, [items, currentPage, itemsPerPage])

  const startIndex = useMemo(
    () => (currentPage - 1) * itemsPerPage + 1,
    [currentPage, itemsPerPage]
  )

  const endIndex = useMemo(
    () => Math.min(currentPage * itemsPerPage, items.length),
    [currentPage, itemsPerPage, items.length]
  )

  const hasNextPage = currentPage < totalPages
  const hasPrevPage = currentPage > 1

  const goToPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages))
    setCurrentPage(validPage)
  }

  const nextPage = () => {
    if (hasNextPage) {
      setCurrentPage((prev) => prev + 1)
    }
  }

  const prevPage = () => {
    if (hasPrevPage) {
      setCurrentPage((prev) => prev - 1)
    }
  }

  const handleSetItemsPerPage = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
  }

  return {
    currentPage,
    totalPages,
    totalItems: items.length,
    itemsPerPage,
    paginatedItems,
    startIndex,
    endIndex,
    hasNextPage,
    hasPrevPage,
    goToPage,
    nextPage,
    prevPage,
    setItemsPerPage: handleSetItemsPerPage,
  }
}
