/**
 * Game State System - Layer 2
 * Built on top of TM Tape foundation
 * Manages all game state including player progress, karma, NPCs, and world state
 */

import { TMTape, TapeFactory } from './tmTape';
import { toast } from 'sonner';

// Core game state structure
export interface GameState {
  // Player data
  player: {
    name: string;
    karmaCoins: number;
    position: { x: number; y: number; map: string };
    inventory: InventoryItem[];
    activeQuests: Quest[];
    completedQuests: string[];
  };
  
  // World state
  world: {
    currentMap: string;
    timeOfDay: 'dawn' | 'day' | 'dusk' | 'night';
    ranchActivitiesCompleted: number;
    clueGameUnlocked: boolean;
    discoveredLocations: string[];
  };
  
  // NPC state
  npcs: Record<string, NPCState>;
  
  // Dialogue state
  dialogue: {
    currentSpeaker: string | null;
    currentText: string | null;
    dialogueHistory: DialogueEntry[];
  };
  
  // Progress milestones
  milestones: {
    firstActivityComplete: boolean;
    threeActivitiesComplete: boolean;
    clueGameStarted: boolean;
    discountCodeRevealed: boolean;
    discountCode: string;
    totalDiscountPercent: number;
  };
  
  // Meta
  gameStarted: boolean;
  lastSaveTimestamp: number;
  totalPlayTime: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  type: 'quest' | 'consumable' | 'key';
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  objectives: QuestObjective[];
  rewards: QuestReward[];
}

export interface QuestObjective {
  id: string;
  description: string;
  completed: boolean;
  progress: number;
  target: number;
}

export interface QuestReward {
  type: 'karma' | 'item' | 'discount';
  value: number | string;
}

export interface NPCState {
  id: string;
  name: string;
  position: { x: number; y: number; map: string };
  mood: 'happy' | 'neutral' | 'sad' | 'excited';
  lastInteraction: number;
  dialogueStage: number;
  relationshipLevel: number;
}

export interface DialogueEntry {
  timestamp: number;
  speaker: string;
  text: string;
}

/**
 * Game State Manager
 * Orchestrates all game state using TM Tape
 */
export class GameStateManager {
  private tape: TMTape<GameState>;
  private startTime: number;

  constructor() {
    this.tape = TapeFactory.createGameStateTape() as TMTape<GameState>;
    this.startTime = Date.now();
    
    // Initialize if no state exists
    if (!this.tape.read()) {
      this.initialize();
    }
  }

  /**
   * Initialize fresh game state
   */
  private initialize(): void {
    const initialState: GameState = {
      player: {
        name: 'Sierra Shadow',
        karmaCoins: 0,
        position: { x: 0, y: 0, map: 'ranch-main' },
        inventory: [],
        activeQuests: [],
        completedQuests: [],
      },
      world: {
        currentMap: 'ranch-main',
        timeOfDay: 'day',
        ranchActivitiesCompleted: 0,
        clueGameUnlocked: false,
        discoveredLocations: ['ranch-main'],
      },
      npcs: this.initializeNPCs(),
      dialogue: {
        currentSpeaker: null,
        currentText: null,
        dialogueHistory: [],
      },
      milestones: {
        firstActivityComplete: false,
        threeActivitiesComplete: false,
        clueGameStarted: false,
        discountCodeRevealed: false,
        discountCode: '',
        totalDiscountPercent: 0,
      },
      gameStarted: false,
      lastSaveTimestamp: Date.now(),
      totalPlayTime: 0,
    };

    this.tape.write(initialState);
  }

  /**
   * Initialize NPCs
   */
  private initializeNPCs(): Record<string, NPCState> {
    return {
      'leif-pryor': {
        id: 'leif-pryor',
        name: 'Leif Pryor',
        position: { x: 10, y: 10, map: 'ranch-main' },
        mood: 'happy',
        lastInteraction: 0,
        dialogueStage: 0,
        relationshipLevel: 0,
      },
      'buck': {
        id: 'buck',
        name: 'Buck - Ranch Owner',
        position: { x: 15, y: 15, map: 'ranch-main' },
        mood: 'excited',
        lastInteraction: 0,
        dialogueStage: 0,
        relationshipLevel: 0,
      },
    };
  }

  /**
   * Get current game state
   */
  getState(): GameState {
    const state = this.tape.read();
    if (!state) {
      this.initialize();
      return this.tape.read()!;
    }
    return state;
  }

  /**
   * Update game state (atomic operation)
   */
  updateState(updater: (state: GameState) => Partial<GameState>): void {
    const currentState = this.getState();
    const updates = updater(currentState);
    
    const newState = {
      ...currentState,
      ...updates,
      lastSaveTimestamp: Date.now(),
      totalPlayTime: currentState.totalPlayTime + (Date.now() - this.startTime),
    };

    this.tape.write(newState);
  }

  /**
   * Award karma coins
   */
  awardKarma(amount: number, reason: string): void {
    this.updateState(state => {
      const newKarma = state.player.karmaCoins + amount;
      const updates: Partial<GameState> = {
        player: {
          ...state.player,
          karmaCoins: newKarma,
        },
      };

      // Check milestones
      if (newKarma >= 6 && !state.world.clueGameUnlocked) {
        updates.world = {
          ...state.world,
          clueGameUnlocked: true,
        };
        
        toast.success('🎮 NEW MYSTERY UNLOCKED!', {
          description: 'Shadow of the Golden Frog clue game is now available!',
          duration: 5000,
        });
      }

      if (newKarma >= 10 && !state.milestones.discountCodeRevealed) {
        updates.milestones = {
          ...state.milestones,
          discountCodeRevealed: true,
          discountCode: 'KARMA7OFF',
          totalDiscountPercent: 7,
        };
        
        toast.success('🎉 7% DISCOUNT CODE UNLOCKED!', {
          description: 'Use code KARMA7OFF when booking your stay!',
          duration: 8000,
        });
      }

      toast.success(reason, {
        description: `+${amount} Karma Coins earned!`,
        duration: 3000,
      });

      return updates;
    });
  }

  /**
   * Start game
   */
  startGame(): void {
    this.updateState(state => ({
      gameStarted: true,
    }));
  }

  /**
   * Show dialogue
   */
  showDialogue(speaker: string, text: string): void {
    this.updateState(state => ({
      dialogue: {
        currentSpeaker: speaker,
        currentText: text,
        dialogueHistory: [
          ...state.dialogue.dialogueHistory,
          { timestamp: Date.now(), speaker, text },
        ],
      },
    }));
  }

  /**
   * Close dialogue
   */
  closeDialogue(): void {
    this.updateState(state => ({
      dialogue: {
        ...state.dialogue,
        currentSpeaker: null,
        currentText: null,
      },
    }));
  }

  /**
   * Complete ranch activity
   */
  completeActivity(activityName: string, karmaReward: number): void {
    this.updateState(state => {
      const newCount = state.world.ranchActivitiesCompleted + 1;
      const updates: Partial<GameState> = {
        world: {
          ...state.world,
          ranchActivitiesCompleted: newCount,
        },
      };

      // Check for 3 activities milestone
      if (newCount >= 3 && !state.milestones.threeActivitiesComplete) {
        updates.milestones = {
          ...state.milestones,
          threeActivitiesComplete: true,
        };
        
        toast.success('🎯 MILESTONE REACHED!', {
          description: 'Random quest system unlocked! Adventure awaits!',
          duration: 5000,
        });
      }

      return updates;
    });

    // Award karma separately to trigger its own milestones
    this.awardKarma(karmaReward, `${activityName} completed!`);
  }

  /**
   * Reset game
   */
  reset(): void {
    this.tape.clear();
    this.initialize();
    toast.success('Game reset! Starting fresh adventure...');
  }

  /**
   * Get tape statistics
   */
  getStats() {
    return this.tape.getStats();
  }

  /**
   * Rollback state (for debugging)
   */
  rollback(steps: number = 1): void {
    this.tape.rollback(steps);
    toast.info(`State rolled back ${steps} step(s)`);
  }
}

// Singleton instance
let gameStateManager: GameStateManager | null = null;

export function getGameStateManager(): GameStateManager {
  if (!gameStateManager) {
    gameStateManager = new GameStateManager();
  }
  return gameStateManager;
}
