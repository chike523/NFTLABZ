import { useState, useCallback, useMemo } from 'react'

export interface UseSelectionProps {
  initialItems?: number[]
  maxSelection?: number
}

export interface UseSelectionReturn {
  selectedIds: number[]
  isSelected: (id: number) => boolean
  isAllSelected: boolean
  isSomeSelected: boolean
  selectAll: () => void
  deselectAll: () => void
  toggleSelect: (id: number) => void
  toggleSelectMultiple: (ids: number[]) => void
  selectMultiple: (ids: number[]) => void
  clearSelection: () => void
}

export function useSelection({ 
  initialItems = [],
  maxSelection
}: UseSelectionProps = {}): UseSelectionReturn {
  const [selectedIds, setSelectedIds] = useState<number[]>(initialItems)

  const isSelected = useCallback((id: number) => selectedIds.includes(id), [selectedIds])

  const isAllSelected = useMemo(() => {
    // This is a placeholder - actual implementation depends on total items count
    // Will be properly implemented when integrated with data
    return false
  }, [])

  const isSomeSelected = useMemo(() => selectedIds.length > 0, [selectedIds])

  const selectAll = useCallback(() => {
    // Placeholder - will be implemented when integrated with data
  }, [])

  const deselectAll = useCallback(() => {
    setSelectedIds([])
  }, [])

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((selectedId) => selectedId !== id)
      } else {
        if (maxSelection && prev.length >= maxSelection) {
          return prev
        }
        return [...prev, id]
      }
    })
  }, [maxSelection])

  const toggleSelectMultiple = useCallback((ids: number[]) => {
    setSelectedIds((prev) => {
      const allSelected = ids.every(id => prev.includes(id))
      
      if (allSelected) {
        // Deselect all if all are selected
        return prev.filter(id => !ids.includes(id))
      } else {
        // Select all if not all are selected
        const newIds = ids.filter(id => !prev.includes(id))
        if (maxSelection && prev.length + newIds.length > maxSelection) {
          return prev
        }
        return [...prev, ...newIds]
      }
    })
  }, [maxSelection])

  const selectMultiple = useCallback((ids: number[]) => {
    setSelectedIds((prev) => {
      const newIds = ids.filter(id => !prev.includes(id))
      if (maxSelection && prev.length + newIds.length > maxSelection) {
        return prev
      }
      return [...prev, ...newIds]
    })
  }, [maxSelection])

  const clearSelection = useCallback(() => {
    setSelectedIds([])
  }, [])

  return {
    selectedIds,
    isSelected,
    isAllSelected,
    isSomeSelected,
    selectAll,
    deselectAll,
    toggleSelect,
    toggleSelectMultiple,
    selectMultiple,
    clearSelection,
  }
}
