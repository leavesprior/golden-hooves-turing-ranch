'use client'

import { useState, useCallback, useEffect } from 'react'
import { useOregonTrail } from '../oregonTrailContext'
import { useNarrator } from '../narratorContext'
import { type ActiveEffect, applyConsumable, tickEffects, getConsumableItem, getInstantEffects } from '../data/consumableEffects'

export type { ActiveEffect }

export function useConsumableEffects() {
  const { state, buySupplies, buyFood, repairWagon } = useOregonTrail()
  const { comment } = useNarrator()

  const [activeEffects, setActiveEffects] = useState<ActiveEffect[]>([])
  const [lastTickDay, setLastTickDay] = useState(state.day)

  // Tick consumable effects each travel day (only triggered by day change)
  useEffect(() => {
    if (state.day !== lastTickDay) {
      setLastTickDay(state.day)
      setActiveEffects(prev => {
        if (prev.length === 0) return prev
        const daysPassed = state.day - lastTickDay
        let current = prev
        for (let i = 0; i < daysPassed; i++) {
          current = tickEffects(current)
        }
        return current
      })
    }

  }, [state.day, lastTickDay])

  const handleUseConsumable = useCallback((itemId: string) => {
    const item = getConsumableItem(itemId)
    if (!item) return
    // Update active effects (timed buffs/debuffs)
    const updatedEffects = applyConsumable(itemId, activeEffects, state.day)
    setActiveEffects(updatedEffects)
    // Apply instant effects (heal, morale, cure)
    const instant = getInstantEffects(itemId)
    if (instant.healAmount > 0) {
      buyFood(instant.healAmount, 0, 0, true)
    }
    if (instant.moraleAmount > 0) {
      buyFood(0, instant.moraleAmount, 0, false)
    }
    comment(`Used ${item.emoji} ${item.name}.`, 'observation')
  }, [activeEffects, state.day, buyFood, comment])

  const handleApplyMedicine = useCallback((_memberId: string) => {
    if (state.medicine > 0) {
      buySupplies('medicine', -1, 0) // Consume one medicine kit
      buyFood(15, 5, 0, true) // Heal party + small morale boost
      comment('Medicine applied. The party feels better.', 'observation')
    }
  }, [state.medicine, buySupplies, buyFood, comment])

  const handleRepairWagon = useCallback(() => {
    if (state.spareParts > 0 && state.wagonCondition < 100) {
      repairWagon() // -1 spare part, +25 wagon condition
      comment('Wagon repaired with a spare part. She rides smoother now.', 'observation')
    }
  }, [state.spareParts, state.wagonCondition, repairWagon, comment])

  return {
    activeEffects,
    handleUseConsumable,
    handleApplyMedicine,
    handleRepairWagon,
  }
}
