import Phaser from "phaser";
import { engine } from "../../runtime/engine";
import { listRunsLocal } from "../../runtime/persistence";
import { syncProgressFromStorage } from "../../runtime/progress_bridge";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    // Load assets here if needed
  }

  create() {
    // Load most recent saved state if available
    const runs = listRunsLocal();
    if (runs.length > 0) {
      const latest = runs[runs.length - 1];
      if (latest.snapshot?.state) {
        engine.loadState(latest.snapshot.state);
        console.log("Loaded saved state:", latest.snapshot.state);
      }
    }
    
    // Sync progress from clue game before starting
    syncProgressFromStorage();
    
    // Seed initial market prices and start TM timers
    import("../../runtime/tm").then(({ writePrice, tick, recomputePrices }) => {
      writePrice("feed", 10);
      writePrice("fence_kit", 25);
      writePrice("stargaze_pack", 15);
      writePrice("hay_bale", 15);
      writePrice("grain_mix", 20);
      writePrice("mineral_block", 25);
      writePrice("treats", 10);
      writePrice("medicine_kit", 40);
      writePrice("bedding", 12);
      
      // Hook TM tick at 10 Hz
      this.time.addEvent({ delay: 100, loop: true, callback: tick });
      // Recompute prices every 5s
      this.time.addEvent({ delay: 5000, loop: true, callback: recomputePrices });
    });
    
    this.scene.start("OverworldScene");
  }
}
