import Phaser from "phaser";
import { engine } from "../../runtime/engine";

interface GridCell {
  type: 'empty' | 'grass' | 'sheep' | 'emu' | 'donkey' | 'fence' | 'barn';
  plantedAt: number;
  harvestAt: number;
  ready: boolean;
  withered: boolean;
}

export class RanchMapScene extends Phaser.Scene {
  private info!: HTMLElement;
  private grids: Phaser.GameObjects.Rectangle[] = [];
  private gridCells: GridCell[] = [];
  private gridSprites: (Phaser.GameObjects.Sprite | null)[] = [];
  private updateTimer?: Phaser.Time.TimerEvent;
  
  constructor() {
    super("RanchMapScene");
  }

  create() {
    this.cameras.main.setBackgroundColor("#2a4a2a");
    this.info = document.getElementById("hud")!;
    
    // Initialize 4x4 grid
    for (let i = 0; i < 16; i++) {
      this.gridCells.push({
        type: 'empty',
        plantedAt: 0,
        harvestAt: 0,
        ready: false,
        withered: false
      });
      this.gridSprites.push(null);
    }

    // Title
    this.add.text(40, 20, "🗺️ RANCH MAP — Farmville Style!", {
      fontFamily: "monospace",
      fontSize: "18px",
      color: "#f0e68c",
      fontStyle: "bold"
    });

    this.add.text(40, 50, "Click grids to plant/manage | SPACE to harvest ready | ESC to return", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#cde3ff"
    });

    // Background
    this.add.rectangle(480, 320, 960, 540, 0x5a8c4e);
    
    // Sierra backdrop
    this.add.rectangle(480, 100, 800, 80, 0x8b7355);
    this.add.text(400, 85, "⛰️ Sierra Nevada", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#e0d0c0"
    });

    // Render 4x4 grid for Farmville-style management
    const startX = 300;
    const startY = 180;
    const cellSize = 100;

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const index = row * 4 + col;
        const x = startX + col * cellSize;
        const y = startY + row * cellSize;
        
        const grid = this.add.rectangle(x, y, 90, 90, 0x4a7c59, 0.8)
          .setStrokeStyle(2, 0x654321)
          .setInteractive();
        
        grid.on('pointerdown', () => this.handleGridClick(index, x, y));
        this.grids[index] = grid;
        
        // Label
        this.add.text(x - 40, y - 40, `[${index}]`, {
          fontFamily: "monospace",
          fontSize: "10px",
          color: "#9ad1ff"
        });
      }
    }

    // Timer for growth updates (every 30 seconds for demo, 1 hour in production)
    this.updateTimer = this.time.addEvent({
      delay: 30000, // 30 seconds
      callback: () => this.updateGrowth(),
      loop: true
    });

    // Random storm event (6 hours)
    this.time.addEvent({
      delay: 360000, // 6 minutes for demo
      callback: () => this.triggerStorm(),
      loop: true
    });

    // Tutorial popup
    const tutorial = this.add.text(480, 270, "🌟 Welcome to your ranch! Click any grid to start planting! 🌟", {
      fontFamily: "monospace",
      fontSize: "18px",
      color: "#f0e68c",
      backgroundColor: "#00000088",
      padding: { x: 15, y: 10 }
    }).setOrigin(0.5).setDepth(100);

    this.time.delayedCall(5000, () => tutorial.destroy());

    // Keyboard controls
    this.input.keyboard!.removeAllListeners();
    this.input.keyboard!.on("keydown-SPACE", () => this.harvestReady());
    this.input.keyboard!.on("keydown-ESC", () => this.scene.start("OverworldScene"));
    this.input.keyboard!.on("keydown-H", () => this.showHelp());

    this.updateHUD();
  }

  private handleGridClick(index: number, x: number, y: number) {
    const cell = this.gridCells[index];
    
    if (cell.ready) {
      // Harvest
      this.harvestCell(index);
      return;
    }

    if (cell.type !== 'empty' && !cell.withered) {
      this.flash("Cell occupied. Wait for harvest or clear it.");
      return;
    }

    // Plant menu with demo timers (30s = 1hr, 60s = 2hr, etc.)
    const options = [
      { type: 'grass', label: '🌱 Grass (30s)', time: 30000 },
      { type: 'sheep', label: '🐑 Sheep (60s)', time: 60000 },
      { type: 'emu', label: '🦤 Emu (90s)', time: 90000 },
      { type: 'donkey', label: '🫏 Donkey (guard)', time: 0 },
      { type: 'fence', label: '🚧 Fence', time: 0 },
      { type: 'barn', label: '🏠 Barn', time: 0 }
    ];

    // Show options
    options.forEach((opt, i) => {
      const btn = this.add.text(x - 40, y + 50 + i * 25, opt.label, {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#ffffff",
        backgroundColor: "#00000088",
        padding: { x: 4, y: 2 }
      }).setInteractive();

      btn.on('pointerdown', () => {
        this.plantCell(index, opt.type as any, x, y, opt.time);
        btn.destroy();
        options.forEach((_, j) => {
          if (j !== i) {
            const otherBtn = this.children.getByName(`opt-${index}-${j}`);
            otherBtn?.destroy();
          }
        });
      });
      btn.setName(`opt-${index}-${i}`);
    });
  }

  private plantCell(index: number, type: GridCell['type'], x: number, y: number, growTime: number) {
    const now = Date.now();
    this.gridCells[index] = {
      type,
      plantedAt: now,
      harvestAt: now + growTime,
      ready: growTime === 0,
      withered: false
    };

    // Visual update
    this.grids[index].setFillStyle(0x6b8f5e);
    
    // Add sprite
    const emoji = type === 'grass' ? '🌱' : type === 'sheep' ? '🐑' : type === 'emu' ? '🦤' : type === 'donkey' ? '🫏' : '🚧';
    const sprite = this.add.text(x, y, emoji, {
      fontSize: "32px"
    }).setOrigin(0.5);
    
    if (this.gridSprites[index]) {
      this.gridSprites[index]?.destroy();
    }
    this.gridSprites[index] = sprite as any;

    // Record karma
    engine.earnKarma(2, `planted_${type}`);
    this.flash(`Planted ${type}!`);
    this.updateHUD();
  }

  private harvestCell(index: number) {
    const cell = this.gridCells[index];
    if (!cell.ready) return;

    const rewards: Record<string, number> = {
      grass: 5,
      sheep: 10,
      emu: 15,
      donkey: 8,
      fence: 3
    };

    const karma = rewards[cell.type] || 5;
    engine.earnKarma(karma, `harvest_${cell.type}`);
    engine.earnCoins(karma, `harvest_${cell.type}`);

    // Check for 20 karma transition
    const gs = engine.getGameState();
    if (gs.player.karma >= 20) {
      this.flash("🎉 20 Karma reached! Unlocking expanded map...");
      this.time.delayedCall(2000, () => {
        // Stay on this scene but show expansion message
        this.add.text(480, 270, "🌟 MAP EXPANDED! 🌟", {
          fontFamily: "monospace",
          fontSize: "24px",
          color: "#f0e68c",
          backgroundColor: "#00000088"
        }).setOrigin(0.5);
      });
    }

    // Clear cell
    this.gridCells[index] = {
      type: 'empty',
      plantedAt: 0,
      harvestAt: 0,
      ready: false,
      withered: false
    };
    this.grids[index].setFillStyle(0x4a7c59);
    this.gridSprites[index]?.destroy();
    this.gridSprites[index] = null;

    this.flash(`Harvested! +${karma} Karma & Coins`);
    this.updateHUD();
  }

  private harvestReady() {
    let harvested = 0;
    this.gridCells.forEach((cell, index) => {
      if (cell.ready) {
        this.harvestCell(index);
        harvested++;
      }
    });

    if (harvested === 0) {
      this.flash("No cells ready to harvest.");
    }
  }

  private updateGrowth() {
    const now = Date.now();
    let readyCount = 0;

    this.gridCells.forEach((cell, index) => {
      if (cell.type !== 'empty' && !cell.ready && cell.harvestAt > 0) {
        if (now >= cell.harvestAt) {
          cell.ready = true;
          this.grids[index].setFillStyle(0xf0e68c);
          this.add.text(
            this.grids[index].x,
            this.grids[index].y - 50,
            "✅",
            { fontSize: "20px", color: "#8ef5a2" }
          ).setOrigin(0.5);
          readyCount++;
        }
      }

      // Withering check (2x harvest time = wither)
      if (cell.ready && !cell.withered && now > cell.harvestAt + (cell.harvestAt - cell.plantedAt)) {
        cell.withered = true;
        this.grids[index].setFillStyle(0x8b6f47);
        this.add.text(
          this.grids[index].x,
          this.grids[index].y,
          "💀",
          { fontSize: "20px" }
        ).setOrigin(0.5);
      }
    });

    if (readyCount > 0) {
      this.flash(`${readyCount} cells ready for harvest!`);
    }
  }

  private triggerStorm() {
    const randomIndex = Phaser.Math.Between(0, 15);
    const cell = this.gridCells[randomIndex];
    
    if (cell.type !== 'empty' && cell.type !== 'fence') {
      this.add.text(480, 270, "⛈️ STORM! Fence damaged!", {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#ff6666",
        backgroundColor: "#00000088"
      }).setOrigin(0.5);

      this.grids[randomIndex].setFillStyle(0xff6666);
      cell.withered = true;
    }
  }

  private showHelp() {
    const helpText = [
      "🗺️ FARMVILLE-STYLE RANCH MAP",
      "━━━━━━━━━━━━━━━━━━━",
      "• Click grids to plant",
      "• 🌱 Grass: 30s demo, +5 karma",
      "• 🐑 Sheep: 60s demo, +10 karma",
      "• 🦤 Emu: 90s demo, +15 karma",
      "• 🫏 Donkey: Guard sheep, +8 karma",
      "• 🚧 Fence: Protection, +3 karma",
      "• 🏠 Barn: Storage, +5 karma",
      "• SPACE: Harvest all ready",
      "• ESC: Return to overworld",
      "• H: This help menu",
      "",
      "TIP: Plant donkeys to protect sheep!"
    ];

    const help = this.add.text(480, 270, helpText.join("\n"), {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#cde3ff",
      backgroundColor: "#00000088",
      padding: { x: 10, y: 10 },
      align: "left"
    }).setOrigin(0.5);

    this.time.delayedCall(5000, () => help.destroy());
  }

  private updateHUD() {
    const gs = engine.getGameState();
    const readyCells = this.gridCells.filter(c => c.ready).length;
    const activeCells = this.gridCells.filter(c => c.type !== 'empty').length;

    this.info.textContent = [
      "🗺️ FARMVILLE-STYLE RANCH MAP",
      `💰 Karma: ${gs.player.karma} | Coins: ${gs.player.coins}`,
      `🌾 Active Plots: ${activeCells}/16 | ✅ Ready: ${readyCells}`,
      `🎯 Activities Completed: ${gs.activitiesCompleted || 0}`,
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      "CONTROLS: Click=Plant | SPACE=Harvest | H=Help | ESC=Exit",
      gs.player.karma >= 20 ? "🎉 20+ Karma! Keep growing your ranch!" : "🌱 Earn 20 karma to unlock more features!"
    ].join("\n");
  }

  private flash(m: string) {
    const flash = this.add.text(480, 50, m, {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#f0e68c",
      backgroundColor: "#00000088",
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5);

    this.time.delayedCall(3000, () => flash.destroy());
  }

  shutdown() {
    this.updateTimer?.destroy();
  }
}
