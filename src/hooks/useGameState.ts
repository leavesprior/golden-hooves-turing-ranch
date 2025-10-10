import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface GameState {
  karmaCoins: number;
  currentDialogue: { speaker: string; text: string } | null;
  gameStarted: boolean;
  clueGameUnlocked: boolean;
  discountCodeRevealed: boolean;
  discountCode: string;
}

const STORAGE_KEY = 'golden-hooves-quest-save';

const initialDialogues = [
  "Welcome to Back of Beyond Ranch, partner! I'm Buck, the ranch owner. This here's the finest sanctuary in all of Gold Country!",
  "We've got horses, donkeys, sheep, and more critters than you can count. Your karma coins show how much good you're doin' around here.",
  "Help us with daily chores - feed the animals, repair fences, rotate pastures. The more you help, the more karma you earn!",
  "And when you're ready for the real deal, come visit us at our actual ranch in the Sierra Nevada. We've got luxury cabins waitin' for ya!"
];

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      karmaCoins: 0,
      currentDialogue: null,
      gameStarted: false,
      clueGameUnlocked: false,
      discountCodeRevealed: false,
      discountCode: '',
    };
  });

  const [dialogueIndex, setDialogueIndex] = useState(0);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
  }, [gameState]);

  const startGame = () => {
    setGameState(prev => ({ ...prev, gameStarted: true }));
    showNextDialogue();
  };

  const showNextDialogue = () => {
    if (dialogueIndex < initialDialogues.length) {
      setGameState(prev => ({
        ...prev,
        currentDialogue: {
          speaker: 'BUCK - RANCH OWNER',
          text: initialDialogues[dialogueIndex]
        }
      }));
      setDialogueIndex(prev => prev + 1);
    } else {
      setGameState(prev => ({ ...prev, currentDialogue: null }));
    }
  };

  const handleAction = (action: string) => {
    const rewards: Record<string, { coins: number; message: string }> = {
      feed: { coins: 5, message: 'Animals fed! They look happy and healthy!' },
      repair: { coins: 3, message: 'Fence repaired! Ranch is secure!' },
      rotate: { coins: 4, message: 'Pasture rotated! Livestock impact balanced!' },
      explore: { coins: 2, message: 'Found hidden gold nuggets while exploring!' },
    };

    const reward = rewards[action];
    if (reward) {
      const newKarmaCoins = gameState.karmaCoins + reward.coins;
      const updates: Partial<GameState> = {
        karmaCoins: newKarmaCoins
      };

      // Check for 6 karma milestone - unlock clue game
      if (newKarmaCoins >= 6 && !gameState.clueGameUnlocked) {
        updates.clueGameUnlocked = true;
        toast.success('🎮 NEW MYSTERY UNLOCKED!', {
          description: 'Shadow of the Golden Frog clue game is now available!',
          duration: 5000,
        });
      }

      // Check for 10 karma milestone - reveal discount code
      if (newKarmaCoins >= 10 && !gameState.discountCodeRevealed) {
        updates.discountCodeRevealed = true;
        updates.discountCode = 'KARMA7OFF';
        toast.success('🎉 7% DISCOUNT CODE UNLOCKED!', {
          description: 'Use code KARMA7OFF when booking your stay!',
          duration: 8000,
        });
      }
      
      setGameState(prev => ({
        ...prev,
        ...updates
      }));
      
      toast.success(reward.message, {
        description: `+${reward.coins} Karma Coins earned!`,
        duration: 3000,
      });

      // Random chance for special dialogue
      if (Math.random() > 0.7) {
        const specialDialogues = [
          "Great work, partner! The animals really appreciate your help. You're a natural rancher!",
          "That's the spirit! This ranch runs smooth thanks to folks like you. Keep it up!",
          "Mighty fine work! You know, we could use someone like you at the real ranch too!",
        ];
        setGameState(prev => ({
          ...prev,
          currentDialogue: {
            speaker: 'BUCK - RANCH OWNER',
            text: specialDialogues[Math.floor(Math.random() * specialDialogues.length)]
          }
        }));
      }
    }
  };

  const closeDialogue = () => {
    setGameState(prev => ({ ...prev, currentDialogue: null }));
  };

  const resetGame = () => {
    localStorage.removeItem(STORAGE_KEY);
    setGameState({
      karmaCoins: 0,
      currentDialogue: null,
      gameStarted: false,
      clueGameUnlocked: false,
      discountCodeRevealed: false,
      discountCode: '',
    });
    setDialogueIndex(0);
    toast.success('Game reset! Starting fresh adventure...');
  };

  return {
    gameState,
    startGame,
    handleAction,
    closeDialogue,
    resetGame,
  };
};
