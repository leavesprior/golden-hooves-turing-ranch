import Phaser from "phaser";
import { engine } from "../../runtime/engine";
import { listRunsLocal } from "../../runtime/persistence";

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
    
    this.scene.start("OverworldScene");
  }
}
