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
    // Register Level 2 scenes
    const { Level2MapScene } = require("./Level2MapScene");
    const { Level2NodeScene } = require("./Level2NodeScene");
    const { Level2ArrestScene } = require("./Level2ArrestScene");
    
    this.scene.add("Level2MapScene", Level2MapScene, false);
    this.scene.add("Level2NodeScene", Level2NodeScene, false);
    this.scene.add("Level2ArrestScene", Level2ArrestScene, false);
    
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
    
    this.scene.start("OverworldScene");
  }
}
