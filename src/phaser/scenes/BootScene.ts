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
    
    // Seed initial market prices
    import("../../runtime/tm").then(({ writePrice }) => {
      writePrice("feed", 10);
      writePrice("fence_kit", 25);
      writePrice("stargaze_pack", 15);
      writePrice("hay_bale", 15);
      writePrice("grain_mix", 20);
      writePrice("mineral_block", 25);
      writePrice("treats", 10);
      writePrice("medicine_kit", 40);
      writePrice("bedding", 12);
    });
    
    this.scene.start("OverworldScene");
  }
}
