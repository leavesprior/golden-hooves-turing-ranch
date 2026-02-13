'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

// Inventory item with state flags
export interface InventoryItem {
  id: string
  name: string
  description: string
  stateFlags: Record<string, boolean>  // wet, heated, inscribed, broken, combined, etc.
  acquiredAt: number
}

// Puzzle transformation rule
export interface PuzzleTransformation {
  id: string
  requiredItems: string[]  // Item IDs that must be present
  requiredFlags: Record<string, string[]>  // { itemId: [requiredFlags] }
  result: {
    removeItems?: string[]  // Items to remove
    addItems?: { id: string; name: string; description: string; flags: Record<string, boolean> }[]
    modifyFlags?: Record<string, Record<string, boolean>>  // { itemId: { flag: value } }
    solutionId?: string  // Puzzle solution that gets marked as solved
  }
  description: string
}

// Puzzle chain (multi-step Rube Goldberg puzzles)
export interface PuzzleChain {
  id: string
  name: string
  steps: string[]  // Transformation IDs in order
  currentStep: number
  completed: boolean
}

export interface PuzzleState {
  inventory: InventoryItem[]
  transformations: PuzzleTransformation[]
  puzzlesSolved: string[]
  currentPuzzleChain: string | null
  chainProgress: number
}

interface PuzzleContextValue {
  state: PuzzleState

  // Inventory management
  addItem: (name: string, description: string, initialFlags?: Record<string, boolean>) => InventoryItem
  removeItem: (itemId: string) => void
  getItem: (itemId: string) => InventoryItem | undefined
  hasItem: (itemId: string) => boolean
  getAllItems: () => InventoryItem[]

  // State flag management
  setItemFlag: (itemId: string, flag: string, value: boolean) => void
  getItemFlag: (itemId: string, flag: string) => boolean
  getItemFlags: (itemId: string) => Record<string, boolean>

  // Transformations
  registerTransformation: (transformation: PuzzleTransformation) => void
  checkTransformations: () => PuzzleTransformation[]
  applyTransformation: (transformationId: string) => boolean

  // Puzzles
  markPuzzleSolved: (puzzleId: string) => void
  isPuzzleSolved: (puzzleId: string) => boolean
  getSolvedCount: () => number

  // Puzzle chains
  startPuzzleChain: (chainId: string, steps: string[], name: string) => void
  advanceChain: () => boolean
  getCurrentChainStep: () => number
  isChainComplete: () => boolean
  getCurrentChain: () => PuzzleChain | null

  // Helpers
  clearInventory: () => void
  clearPuzzleProgress: () => void
}

const PuzzleContext = createContext<PuzzleContextValue | undefined>(undefined)

const initialState: PuzzleState = {
  inventory: [],
  transformations: [],
  puzzlesSolved: [],
  currentPuzzleChain: null,
  chainProgress: 0,
}

const STORAGE_KEY = 'bobr_prologue_puzzles'

export function PuzzleProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PuzzleState>(() => {
    if (typeof window === 'undefined') return initialState
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        return JSON.parse(saved) as PuzzleState
      }
    } catch {}
    return initialState
  })

  const [activeChains, setActiveChains] = useState<Record<string, PuzzleChain>>({})

  // Add item to inventory
  const addItem = useCallback((name: string, description: string, initialFlags: Record<string, boolean> = {}): InventoryItem => {
    const item: InventoryItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      stateFlags: initialFlags,
      acquiredAt: Date.now()
    }

    setState(prev => ({
      ...prev,
      inventory: [...prev.inventory, item]
    }))

    return item
  }, [])

  // Remove item from inventory
  const removeItem = useCallback((itemId: string) => {
    setState(prev => ({
      ...prev,
      inventory: prev.inventory.filter(item => item.id !== itemId)
    }))
  }, [])

  // Get item by ID
  const getItem = useCallback((itemId: string): InventoryItem | undefined => {
    return state.inventory.find(item => item.id === itemId)
  }, [state.inventory])

  // Check if item exists in inventory
  const hasItem = useCallback((itemId: string): boolean => {
    return state.inventory.some(item => item.id === itemId)
  }, [state.inventory])

  // Get all items
  const getAllItems = useCallback((): InventoryItem[] => {
    return [...state.inventory]
  }, [state.inventory])

  // Set item state flag
  const setItemFlag = useCallback((itemId: string, flag: string, value: boolean) => {
    setState(prev => ({
      ...prev,
      inventory: prev.inventory.map(item =>
        item.id === itemId
          ? { ...item, stateFlags: { ...item.stateFlags, [flag]: value } }
          : item
      )
    }))

    // Check if this flag change triggers any transformations
    checkTransformations()
  }, [])

  // Get item state flag
  const getItemFlag = useCallback((itemId: string, flag: string): boolean => {
    const item = state.inventory.find(item => item.id === itemId)
    return item?.stateFlags[flag] || false
  }, [state.inventory])

  // Get all item flags
  const getItemFlags = useCallback((itemId: string): Record<string, boolean> => {
    const item = state.inventory.find(item => item.id === itemId)
    return item?.stateFlags || {}
  }, [state.inventory])

  // Register a transformation rule
  const registerTransformation = useCallback((transformation: PuzzleTransformation) => {
    setState(prev => ({
      ...prev,
      transformations: [...prev.transformations, transformation]
    }))
  }, [])

  // Check which transformations can currently be applied
  const checkTransformations = useCallback((): PuzzleTransformation[] => {
    const applicable: PuzzleTransformation[] = []

    for (const transformation of state.transformations) {
      // Check if all required items are present
      const hasAllItems = transformation.requiredItems.every(itemId =>
        state.inventory.some(item => item.id === itemId)
      )

      if (!hasAllItems) continue

      // Check if all required flags are set
      const hasAllFlags = Object.entries(transformation.requiredFlags).every(([itemId, requiredFlags]) => {
        const item = state.inventory.find(i => i.id === itemId)
        if (!item) return false
        return requiredFlags.every(flag => item.stateFlags[flag] === true)
      })

      if (hasAllFlags) {
        applicable.push(transformation)
      }
    }

    return applicable
  }, [state.transformations, state.inventory])

  // Apply a transformation
  const applyTransformation = useCallback((transformationId: string): boolean => {
    const transformation = state.transformations.find(t => t.id === transformationId)
    if (!transformation) return false

    // Verify transformation is applicable
    const applicable = checkTransformations()
    if (!applicable.some(t => t.id === transformationId)) return false

    setState(prev => {
      let newInventory = [...prev.inventory]
      let newPuzzlesSolved = [...prev.puzzlesSolved]

      // Remove items
      if (transformation.result.removeItems) {
        newInventory = newInventory.filter(item =>
          !transformation.result.removeItems!.includes(item.id)
        )
      }

      // Add items
      if (transformation.result.addItems) {
        const newItems: InventoryItem[] = transformation.result.addItems.map(itemData => ({
          id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: itemData.name,
          description: itemData.description,
          stateFlags: itemData.flags,
          acquiredAt: Date.now()
        }))
        newInventory = [...newInventory, ...newItems]
      }

      // Modify flags
      if (transformation.result.modifyFlags) {
        newInventory = newInventory.map(item => {
          const flagMods = transformation.result.modifyFlags![item.id]
          if (flagMods) {
            return {
              ...item,
              stateFlags: { ...item.stateFlags, ...flagMods }
            }
          }
          return item
        })
      }

      // Mark puzzle as solved
      if (transformation.result.solutionId) {
        newPuzzlesSolved = [...newPuzzlesSolved, transformation.result.solutionId]
      }

      return {
        ...prev,
        inventory: newInventory,
        puzzlesSolved: newPuzzlesSolved
      }
    })

    return true
  }, [state.transformations, checkTransformations])

  // Mark puzzle as solved
  const markPuzzleSolved = useCallback((puzzleId: string) => {
    setState(prev => ({
      ...prev,
      puzzlesSolved: [...prev.puzzlesSolved, puzzleId]
    }))
  }, [])

  // Check if puzzle is solved
  const isPuzzleSolved = useCallback((puzzleId: string): boolean => {
    return state.puzzlesSolved.includes(puzzleId)
  }, [state.puzzlesSolved])

  // Get solved puzzle count
  const getSolvedCount = useCallback((): number => {
    return state.puzzlesSolved.length
  }, [state.puzzlesSolved])

  // Start a puzzle chain
  const startPuzzleChain = useCallback((chainId: string, steps: string[], name: string) => {
    const chain: PuzzleChain = {
      id: chainId,
      name,
      steps,
      currentStep: 0,
      completed: false
    }

    setActiveChains(prev => ({
      ...prev,
      [chainId]: chain
    }))

    setState(prev => ({
      ...prev,
      currentPuzzleChain: chainId,
      chainProgress: 0
    }))
  }, [])

  // Advance the current chain
  const advanceChain = useCallback((): boolean => {
    if (!state.currentPuzzleChain) return false

    const chain = activeChains[state.currentPuzzleChain]
    if (!chain) return false

    if (chain.currentStep >= chain.steps.length - 1) {
      // Chain complete
      setActiveChains(prev => ({
        ...prev,
        [chain.id]: { ...chain, completed: true }
      }))

      setState(prev => ({
        ...prev,
        currentPuzzleChain: null,
        chainProgress: 0
      }))

      return true
    }

    // Advance to next step
    setActiveChains(prev => ({
      ...prev,
      [chain.id]: { ...chain, currentStep: chain.currentStep + 1 }
    }))

    setState(prev => ({
      ...prev,
      chainProgress: prev.chainProgress + 1
    }))

    return false
  }, [state.currentPuzzleChain, activeChains])

  // Get current chain step
  const getCurrentChainStep = useCallback((): number => {
    return state.chainProgress
  }, [state.chainProgress])

  // Check if chain is complete
  const isChainComplete = useCallback((): boolean => {
    if (!state.currentPuzzleChain) return false
    const chain = activeChains[state.currentPuzzleChain]
    return chain?.completed || false
  }, [state.currentPuzzleChain, activeChains])

  // Get current chain
  const getCurrentChain = useCallback((): PuzzleChain | null => {
    if (!state.currentPuzzleChain) return null
    return activeChains[state.currentPuzzleChain] || null
  }, [state.currentPuzzleChain, activeChains])

  // Clear inventory
  const clearInventory = useCallback(() => {
    setState(prev => ({
      ...prev,
      inventory: []
    }))
  }, [])

  // Clear puzzle progress
  const clearPuzzleProgress = useCallback(() => {
    setState(prev => ({
      ...prev,
      puzzlesSolved: [],
      currentPuzzleChain: null,
      chainProgress: 0
    }))
    setActiveChains({})
  }, [])

  // Persist puzzle state to localStorage whenever it changes
  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {}
  }, [state])

  const value: PuzzleContextValue = {
    state,
    addItem,
    removeItem,
    getItem,
    hasItem,
    getAllItems,
    setItemFlag,
    getItemFlag,
    getItemFlags,
    registerTransformation,
    checkTransformations,
    applyTransformation,
    markPuzzleSolved,
    isPuzzleSolved,
    getSolvedCount,
    startPuzzleChain,
    advanceChain,
    getCurrentChainStep,
    isChainComplete,
    getCurrentChain,
    clearInventory,
    clearPuzzleProgress
  }

  return (
    <PuzzleContext.Provider value={value}>
      {children}
    </PuzzleContext.Provider>
  )
}

export function usePuzzle() {
  const context = useContext(PuzzleContext)
  if (!context) {
    throw new Error('usePuzzle must be used within a PuzzleProvider')
  }
  return context
}
