/**
 * React Hook for Game State
 * Provides reactive access to the TM Tape-based game state
 */

import { useState, useEffect, useCallback } from 'react';
import { GameStateManager, getGameStateManager, GameState } from '@/lib/gameState';

export function useGameStateV2() {
  const [manager] = useState(() => getGameStateManager());
  const [gameState, setGameState] = useState<GameState>(() => manager.getState());

  // Poll for state changes (simple reactive approach)
  useEffect(() => {
    const interval = setInterval(() => {
      const newState = manager.getState();
      setGameState(newState);
    }, 100);

    return () => clearInterval(interval);
  }, [manager]);

  const startGame = useCallback(() => {
    manager.startGame();
    const welcomeDialogues = [
      "Welcome to Back of Beyond Ranch, partner! I'm Buck, the ranch owner. This here's the finest sanctuary in all of Gold Country!",
      "We've got horses, donkeys, sheep, and more critters than you can count. Your karma coins show how much good you're doin' around here.",
      "Help us with daily chores - feed the animals, repair fences, rotate pastures. The more you help, the more karma you earn!",
      "And when you're ready for the real deal, come visit us at our actual ranch in the Sierra Nevada. We've got luxury cabins waitin' for ya!"
    ];
    
    manager.showDialogue('BUCK - RANCH OWNER', welcomeDialogues[0]);
  }, [manager]);

  const handleAction = useCallback((action: string) => {
    const actions: Record<string, { karma: number; name: string }> = {
      feed: { karma: 5, name: 'Animals fed! They look happy and healthy!' },
      repair: { karma: 3, name: 'Fence repaired! Ranch is secure!' },
      rotate: { karma: 4, name: 'Pasture rotated! Livestock impact balanced!' },
      explore: { karma: 2, name: 'Found hidden gold nuggets while exploring!' },
    };

    const actionData = actions[action];
    if (actionData) {
      manager.completeActivity(actionData.name, actionData.karma);

      // Random chance for special dialogue
      if (Math.random() > 0.7) {
        const specialDialogues = [
          "Great work, partner! The animals really appreciate your help. You're a natural rancher!",
          "That's the spirit! This ranch runs smooth thanks to folks like you. Keep it up!",
          "Mighty fine work! You know, we could use someone like you at the real ranch too!",
        ];
        manager.showDialogue(
          'BUCK - RANCH OWNER',
          specialDialogues[Math.floor(Math.random() * specialDialogues.length)]
        );
      }
    }
  }, [manager]);

  const closeDialogue = useCallback(() => {
    manager.closeDialogue();
  }, [manager]);

  const resetGame = useCallback(() => {
    manager.reset();
  }, [manager]);

  return {
    gameState,
    startGame,
    handleAction,
    closeDialogue,
    resetGame,
    manager, // Expose manager for advanced operations
  };
}
