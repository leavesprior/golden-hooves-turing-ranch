'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'

// Location in the pre-Columbian world
export interface Location {
  id: string
  name: string
  description: string
  culturalZone: string  // Which culture's territory
  connectedTo: string[]
  x: number  // Map coordinates
  y: number
  travelTime: number  // Hours to reach from connected locations
  dangerLevel: 'safe' | 'moderate' | 'dangerous'
  encounterTypes: string[]
}

export interface LocationState {
  currentLocationId: string
  discoveredLocations: string[]
  visitedLocations: string[]
  culturalZone: string
  travelBudget: number  // Actions remaining for travel
  totalTravelTime: number
}

interface LocationContextValue {
  state: LocationState

  // Location actions
  travelTo: (locationId: string) => { success: boolean; timeSpent: number; newDiscoveries: string[] }
  discoverLocation: (locationId: string) => void
  markVisited: (locationId: string) => void
  setCurrentLocation: (locationId: string) => void

  // Location queries
  getCurrentLocation: () => Location | undefined
  getLocation: (id: string) => Location | undefined
  getConnectedLocations: () => Location[]
  isLocationDiscovered: (id: string) => boolean
  isLocationVisited: (id: string) => boolean

  // Cultural zone
  getCulturalZone: () => string
  setCulturalZone: (zone: string) => void

  // Travel budget
  getTravelBudget: () => number
  spendTravelBudget: (amount: number) => boolean
  replenishTravelBudget: (amount: number) => void
  setTravelBudget: (amount: number) => void

  // Helpers
  getAllLocations: () => Location[]
  clearProgress: () => void
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined)

// Pre-Columbian location network
const LOCATIONS: Location[] = [
  {
    id: 'cahokia',
    name: 'Cahokia Mounds',
    description: 'Great mound city of the Mississippian culture.',
    culturalZone: 'mississippian',
    connectedTo: ['trade_route_1', 'river_crossing'],
    x: 50,
    y: 40,
    travelTime: 0,
    dangerLevel: 'safe',
    encounterTypes: ['trader', 'elder']
  },
  {
    id: 'trade_route_1',
    name: 'Northern Trade Route',
    description: 'Path connecting distant cultures.',
    culturalZone: 'neutral',
    connectedTo: ['cahokia', 'norse_settlement'],
    x: 30,
    y: 20,
    travelTime: 8,
    dangerLevel: 'moderate',
    encounterTypes: ['trader', 'traveler']
  },
  {
    id: 'norse_settlement',
    name: 'Vinland Settlement',
    description: 'Norse outpost in the new world.',
    culturalZone: 'norse',
    connectedTo: ['trade_route_1', 'coastal_path'],
    x: 10,
    y: 10,
    travelTime: 12,
    dangerLevel: 'safe',
    encounterTypes: ['skald', 'warrior']
  },
  {
    id: 'coastal_path',
    name: 'Pacific Coast',
    description: 'Rocky shores of the western ocean.',
    culturalZone: 'chumash',
    connectedTo: ['norse_settlement', 'chumash_village'],
    x: 5,
    y: 50,
    travelTime: 16,
    dangerLevel: 'dangerous',
    encounterTypes: ['shaman', 'trader']
  },
  {
    id: 'chumash_village',
    name: 'Island of the Blue Dolphins',
    description: 'Coastal settlement of the Chumash people.',
    culturalZone: 'chumash',
    connectedTo: ['coastal_path', 'southern_trail'],
    x: 10,
    y: 70,
    travelTime: 6,
    dangerLevel: 'safe',
    encounterTypes: ['priestess', 'trader']
  },
  {
    id: 'southern_trail',
    name: 'Continental Passage',
    description: 'Ancient route to the southern empires.',
    culturalZone: 'neutral',
    connectedTo: ['chumash_village', 'incan_outpost'],
    x: 40,
    y: 80,
    travelTime: 20,
    dangerLevel: 'dangerous',
    encounterTypes: ['trader', 'warrior']
  },
  {
    id: 'incan_outpost',
    name: 'Cusco Outpost',
    description: 'Northern reach of the Incan empire.',
    culturalZone: 'incan',
    connectedTo: ['southern_trail', 'mountain_temple'],
    x: 70,
    y: 90,
    travelTime: 10,
    dangerLevel: 'moderate',
    encounterTypes: ['quipucamayoc', 'priestess']
  },
  {
    id: 'mountain_temple',
    name: 'High Temple',
    description: 'Sacred site in the mountains.',
    culturalZone: 'incan',
    connectedTo: ['incan_outpost'],
    x: 85,
    y: 85,
    travelTime: 8,
    dangerLevel: 'dangerous',
    encounterTypes: ['priestess', 'shaman']
  },
  {
    id: 'river_crossing',
    name: 'Great River Crossing',
    description: 'Where waterways meet.',
    culturalZone: 'neutral',
    connectedTo: ['cahokia', 'hidden_site'],
    x: 60,
    y: 30,
    travelTime: 4,
    dangerLevel: 'moderate',
    encounterTypes: ['trader', 'traveler']
  },
  {
    id: 'hidden_site',
    name: 'Lost City',
    description: 'Ancient ruins of unknown origin.',
    culturalZone: 'unknown',
    connectedTo: ['river_crossing'],
    x: 80,
    y: 20,
    travelTime: 14,
    dangerLevel: 'dangerous',
    encounterTypes: ['shaman', 'elder']
  }
]

const initialState: LocationState = {
  currentLocationId: 'cahokia',
  discoveredLocations: ['cahokia'],
  visitedLocations: ['cahokia'],
  culturalZone: 'mississippian',
  travelBudget: 20,
  totalTravelTime: 0
}

const STORAGE_KEY = 'bobr_prologue_locations'

export function LocationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LocationState>(() => {
    if (typeof window === 'undefined') return initialState
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        return JSON.parse(saved) as LocationState
      }
    } catch {}
    return initialState
  })

  // Travel to a location
  const travelTo = useCallback((locationId: string): { success: boolean; timeSpent: number; newDiscoveries: string[] } => {
    const current = LOCATIONS.find(loc => loc.id === state.currentLocationId)
    const target = LOCATIONS.find(loc => loc.id === locationId)

    if (!current || !target) {
      return { success: false, timeSpent: 0, newDiscoveries: [] }
    }

    // Check if connected
    if (!current.connectedTo.includes(locationId)) {
      return { success: false, timeSpent: 0, newDiscoveries: [] }
    }

    const timeSpent = target.travelTime
    const newDiscoveries: string[] = []

    // Check travel budget
    if (timeSpent > state.travelBudget) {
      return { success: false, timeSpent: 0, newDiscoveries: [] }
    }

    // Update state
    setState(prev => {
      const discovered = [...prev.discoveredLocations]
      const visited = [...prev.visitedLocations]

      // Discover the target location
      if (!discovered.includes(locationId)) {
        discovered.push(locationId)
        newDiscoveries.push(locationId)
      }

      // Discover connected locations (fog of war reveal)
      target.connectedTo.forEach(connectedId => {
        if (!discovered.includes(connectedId)) {
          discovered.push(connectedId)
          newDiscoveries.push(connectedId)
        }
      })

      // Mark as visited
      if (!visited.includes(locationId)) {
        visited.push(locationId)
      }

      return {
        ...prev,
        currentLocationId: locationId,
        discoveredLocations: discovered,
        visitedLocations: visited,
        culturalZone: target.culturalZone,
        travelBudget: prev.travelBudget - timeSpent,
        totalTravelTime: prev.totalTravelTime + timeSpent
      }
    })

    return { success: true, timeSpent, newDiscoveries }
  }, [state.currentLocationId, state.travelBudget])

  // Discover a location without visiting
  const discoverLocation = useCallback((locationId: string) => {
    setState(prev => {
      if (prev.discoveredLocations.includes(locationId)) return prev
      return {
        ...prev,
        discoveredLocations: [...prev.discoveredLocations, locationId]
      }
    })
  }, [])

  // Mark location as visited
  const markVisited = useCallback((locationId: string) => {
    setState(prev => {
      if (prev.visitedLocations.includes(locationId)) return prev
      return {
        ...prev,
        visitedLocations: [...prev.visitedLocations, locationId]
      }
    })
  }, [])

  // Set current location directly
  const setCurrentLocation = useCallback((locationId: string) => {
    const location = LOCATIONS.find(loc => loc.id === locationId)
    if (!location) return

    setState(prev => ({
      ...prev,
      currentLocationId: locationId,
      culturalZone: location.culturalZone
    }))
  }, [])

  // Get current location
  const getCurrentLocation = useCallback((): Location | undefined => {
    return LOCATIONS.find(loc => loc.id === state.currentLocationId)
  }, [state.currentLocationId])

  // Get location by ID
  const getLocation = useCallback((id: string): Location | undefined => {
    return LOCATIONS.find(loc => loc.id === id)
  }, [])

  // Get connected locations
  const getConnectedLocations = useCallback((): Location[] => {
    const current = LOCATIONS.find(loc => loc.id === state.currentLocationId)
    if (!current) return []

    return current.connectedTo
      .map(id => LOCATIONS.find(loc => loc.id === id))
      .filter((loc): loc is Location => loc !== undefined)
  }, [state.currentLocationId])

  // Check if location is discovered
  const isLocationDiscovered = useCallback((id: string): boolean => {
    return state.discoveredLocations.includes(id)
  }, [state.discoveredLocations])

  // Check if location is visited
  const isLocationVisited = useCallback((id: string): boolean => {
    return state.visitedLocations.includes(id)
  }, [state.visitedLocations])

  // Get cultural zone
  const getCulturalZone = useCallback((): string => {
    return state.culturalZone
  }, [state.culturalZone])

  // Set cultural zone
  const setCulturalZone = useCallback((zone: string) => {
    setState(prev => ({
      ...prev,
      culturalZone: zone
    }))
  }, [])

  // Get travel budget
  const getTravelBudget = useCallback((): number => {
    return state.travelBudget
  }, [state.travelBudget])

  // Spend travel budget
  const spendTravelBudget = useCallback((amount: number): boolean => {
    if (amount > state.travelBudget) return false

    setState(prev => ({
      ...prev,
      travelBudget: prev.travelBudget - amount
    }))

    return true
  }, [state.travelBudget])

  // Replenish travel budget
  const replenishTravelBudget = useCallback((amount: number) => {
    setState(prev => ({
      ...prev,
      travelBudget: prev.travelBudget + amount
    }))
  }, [])

  // Set travel budget
  const setTravelBudget = useCallback((amount: number) => {
    setState(prev => ({
      ...prev,
      travelBudget: amount
    }))
  }, [])

  // Get all locations
  const getAllLocations = useCallback((): Location[] => {
    return [...LOCATIONS]
  }, [])

  // Clear progress
  const clearProgress = useCallback(() => {
    setState(initialState)
  }, [])

  // Persist location state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {}
  }, [state])

  const value: LocationContextValue = {
    state,
    travelTo,
    discoverLocation,
    markVisited,
    setCurrentLocation,
    getCurrentLocation,
    getLocation,
    getConnectedLocations,
    isLocationDiscovered,
    isLocationVisited,
    getCulturalZone,
    setCulturalZone,
    getTravelBudget,
    spendTravelBudget,
    replenishTravelBudget,
    setTravelBudget,
    getAllLocations,
    clearProgress
  }

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  )
}

export function useLocation() {
  const context = useContext(LocationContext)
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider')
  }
  return context
}
