/**
 * Turing Machine Tape System
 * Core state management with self-repair, validation, and persistence
 * 
 * The TM Tape is the foundation - it:
 * 1. Stores all game state immutably
 * 2. Validates state integrity on every read/write
 * 3. Self-repairs corrupted or inconsistent data
 * 4. Persists to localStorage with blockchain-style hashing
 * 5. Provides rollback capability
 */

import { toast } from 'sonner';

// TM Tape cell structure - each state change is a cell
interface TapeCell<T = any> {
  timestamp: number;
  data: T;
  hash: string;
  previousHash: string | null;
}

// TM Tape configuration
interface TapeConfig {
  maxHistory: number;
  storageKey: string;
  enableSelfRepair: boolean;
  enableBlockchainVerification: boolean;
}

/**
 * Core TM Tape class
 * Implements a blockchain-inspired state management system
 */
export class TMTape<T> {
  private cells: TapeCell<T>[] = [];
  private config: TapeConfig;
  private repairAttempts: number = 0;

  constructor(config: Partial<TapeConfig> = {}) {
    this.config = {
      maxHistory: config.maxHistory || 100,
      storageKey: config.storageKey || 'tm-tape-default',
      enableSelfRepair: config.enableSelfRepair !== false,
      enableBlockchainVerification: config.enableBlockchainVerification !== false,
    };
    
    this.loadFromStorage();
  }

  /**
   * Generate blockchain-style hash for verification
   */
  private generateHash(data: T, previousHash: string | null): string {
    const content = JSON.stringify({ data, previousHash, salt: Math.random() });
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Verify tape integrity (blockchain verification)
   */
  private verifyIntegrity(): boolean {
    if (!this.config.enableBlockchainVerification) return true;
    
    for (let i = 1; i < this.cells.length; i++) {
      const cell = this.cells[i];
      const prevCell = this.cells[i - 1];
      
      if (cell.previousHash !== prevCell.hash) {
        console.warn('TM Tape: Integrity violation detected at cell', i);
        return false;
      }
    }
    
    return true;
  }

  /**
   * Self-repair mechanism - fixes corrupted state
   */
  private selfRepair(): void {
    if (!this.config.enableSelfRepair) return;
    
    this.repairAttempts++;
    
    // Find last valid cell
    let lastValidIndex = -1;
    for (let i = this.cells.length - 1; i >= 0; i--) {
      if (i === 0 || this.cells[i].previousHash === this.cells[i - 1].hash) {
        lastValidIndex = i;
        break;
      }
    }
    
    if (lastValidIndex >= 0 && lastValidIndex < this.cells.length - 1) {
      const removedCells = this.cells.length - lastValidIndex - 1;
      this.cells = this.cells.slice(0, lastValidIndex + 1);
      console.log(`TM Tape: Self-repair removed ${removedCells} corrupted cells`);
      
      toast.info('Game state self-repaired', {
        description: `Recovered from ${removedCells} corrupted entries`,
      });
    }
  }

  /**
   * Write new state to tape
   */
  write(data: T): void {
    const previousHash = this.cells.length > 0 
      ? this.cells[this.cells.length - 1].hash 
      : null;
    
    const cell: TapeCell<T> = {
      timestamp: Date.now(),
      data: this.deepClone(data),
      hash: this.generateHash(data, previousHash),
      previousHash,
    };
    
    this.cells.push(cell);
    
    // Maintain max history limit
    if (this.cells.length > this.config.maxHistory) {
      this.cells = this.cells.slice(-this.config.maxHistory);
    }
    
    // Verify and repair if needed
    if (!this.verifyIntegrity()) {
      this.selfRepair();
    }
    
    this.saveToStorage();
  }

  /**
   * Read current state from tape
   */
  read(): T | null {
    if (this.cells.length === 0) return null;
    
    // Verify integrity before reading
    if (!this.verifyIntegrity() && this.config.enableSelfRepair) {
      this.selfRepair();
    }
    
    return this.deepClone(this.cells[this.cells.length - 1].data);
  }

  /**
   * Rollback to previous state
   */
  rollback(steps: number = 1): T | null {
    if (this.cells.length <= steps) {
      console.warn('TM Tape: Cannot rollback beyond tape start');
      return this.read();
    }
    
    this.cells = this.cells.slice(0, -steps);
    this.saveToStorage();
    
    return this.read();
  }

  /**
   * Get tape history
   */
  getHistory(limit?: number): TapeCell<T>[] {
    const history = [...this.cells];
    return limit ? history.slice(-limit) : history;
  }

  /**
   * Clear tape
   */
  clear(): void {
    this.cells = [];
    this.saveToStorage();
  }

  /**
   * Persist to localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.config.storageKey, JSON.stringify({
        cells: this.cells,
        repairAttempts: this.repairAttempts,
      }));
    } catch (e) {
      console.error('TM Tape: Failed to save to storage', e);
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.config.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.cells = parsed.cells || [];
        this.repairAttempts = parsed.repairAttempts || 0;
        
        // Verify integrity after loading
        if (!this.verifyIntegrity() && this.config.enableSelfRepair) {
          this.selfRepair();
        }
      }
    } catch (e) {
      console.error('TM Tape: Failed to load from storage', e);
      this.cells = [];
    }
  }

  /**
   * Deep clone utility
   */
  private deepClone<U>(obj: U): U {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Get tape statistics
   */
  getStats() {
    return {
      cellCount: this.cells.length,
      repairAttempts: this.repairAttempts,
      isHealthy: this.verifyIntegrity(),
      oldestTimestamp: this.cells[0]?.timestamp || null,
      newestTimestamp: this.cells[this.cells.length - 1]?.timestamp || null,
    };
  }
}

/**
 * Factory for creating specialized tapes
 */
export class TapeFactory {
  static createGameStateTape() {
    return new TMTape({
      storageKey: 'golden-hooves-game-state',
      maxHistory: 100,
      enableSelfRepair: true,
      enableBlockchainVerification: true,
    });
  }

  static createKarmaEconomyTape() {
    return new TMTape({
      storageKey: 'golden-hooves-karma-economy',
      maxHistory: 200,
      enableSelfRepair: true,
      enableBlockchainVerification: true,
    });
  }

  static createClueProgressTape() {
    return new TMTape({
      storageKey: 'golden-hooves-clue-progress',
      maxHistory: 50,
      enableSelfRepair: true,
      enableBlockchainVerification: true,
    });
  }
}
