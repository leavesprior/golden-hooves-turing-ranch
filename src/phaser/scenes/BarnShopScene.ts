import Phaser from "phaser";
import { engine } from "../../runtime/engine";
import { saveRunLocal } from "../../runtime/persistence";
import { saveRunToSupabase } from "../../runtime/sync";
import { marketTape, recomputePrices, readPrice } from "../../runtime/tm";

interface ShopItem {
  id: string;
  name: string;
  description: string;
  karmaPrice: number;
  coinPrice: number;
  emoji: string;
}

const SHOP_ITEMS: ShopItem[] = [
  {
    id: "hay_bale",
    name: "Premium Hay Bale",
    description: "High-quality feed for horses and donkeys. Improves herd health.",
    karmaPrice: 5,
    coinPrice: 15,
    emoji: "🌾"
  },
  {
    id: "grain_mix",
    name: "Grain Mix",
    description: "Nutritious blend for sheep and emus. Keeps them happy.",
    karmaPrice: 8,
    coinPrice: 20,
    emoji: "🌽"
  },
  {
    id: "mineral_block",
    name: "Mineral Block",
    description: "Essential minerals for all creatures. Boosts overall health.",
    karmaPrice: 10,
    coinPrice: 25,
    emoji: "🧂"
  },
  {
    id: "treats",
    name: "Animal Treats",
    description: "Special treats to improve creature morale and alignment.",
    karmaPrice: 3,
    coinPrice: 10,
    emoji: "🍎"
  },
  {
    id: "medicine_kit",
    name: "Medicine Kit",
    description: "First aid for sick animals. Restores herd health significantly.",
    karmaPrice: 15,
    coinPrice: 40,
    emoji: "💊"
  },
  {
    id: "bedding",
    name: "Fresh Bedding",
    description: "Clean straw bedding for comfort. Small health boost.",
    karmaPrice: 4,
    coinPrice: 12,
    emoji: "🛏️"
  }
];

export class BarnShopScene extends Phaser.Scene {
  private info!: HTMLElement;
  private selectedIndex = 0;
  private rows: { id: string; baseKarma: number; baseCoins: number; text: Phaser.GameObjects.Text; bg: Phaser.GameObjects.Rectangle }[] = [];

  constructor() {
    super("BarnShopScene");
  }

  create() {
    this.cameras.main.setBackgroundColor("#3a2817");
    this.info = document.getElementById("hud")!;

    // Barn interior background
    this.add.rectangle(480, 270, 960, 540, 0x4a3522);
    
    // Wooden beams
    for (let i = 0; i < 5; i++) {
      this.add.rectangle(200 + i * 200, 270, 20, 540, 0x654321);
    }

    // Title with barn aesthetic
    this.add.text(40, 30, "🏚️ BARN SHOP — Dynamic Market Prices", {
      fontFamily: "monospace",
      fontSize: "20px",
      color: "#f0e68c",
      fontStyle: "bold"
    });

    this.add.text(40, 70, "Prices adjust with supply/demand • Updates every 5s", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#cde3ff"
    });

    // Build item list once
    this.renderList();

    // Dynamic price updates
    this.time.addEvent({ 
      delay: 5000, 
      loop: true, 
      callback: async () => {
        await recomputePrices();
        this.renderPrices();
      }
    });

    // Instructions
    this.add.text(40, 500, "↑↓ Navigate | SPACE: Purchase | ESC: Exit", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#8ef5a2"
    });

    // Keyboard controls
    this.input.keyboard!.on("keydown-UP", () => this.changeSelection(-1));
    this.input.keyboard!.on("keydown-DOWN", () => this.changeSelection(1));
    this.input.keyboard!.on("keydown-SPACE", () => this.purchaseItem());
    this.input.keyboard!.on("keydown-ESC", () => this.scene.start("OverworldScene"));

    this.updateHUD();
  }

  private changeSelection(delta: number) {
    this.selectedIndex = (this.selectedIndex + delta + SHOP_ITEMS.length) % SHOP_ITEMS.length;
    this.renderSelection();
  }

  private renderList() {
    const startY = 120;
    this.rows = [];
    SHOP_ITEMS.forEach((item, idx) => {
      const y = startY + idx * 60;
      const isSelected = idx === this.selectedIndex;
      
      const bg = this.add.rectangle(480, y, 880, 50, isSelected ? 0x5a4a3a : 0x3a2a1a)
        .setStrokeStyle(2, isSelected ? 0xf0e68c : 0x654321);

      const text = this.add.text(60, y - 20, "", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: isSelected ? "#f0e68c" : "#cde3ff"
      });

      this.rows.push({ 
        id: item.id, 
        baseKarma: item.karmaPrice, 
        baseCoins: item.coinPrice, 
        text,
        bg
      });
    });
    this.renderPrices(); // First paint
  }

  private renderPrices() {
    this.rows.forEach((r, idx) => {
      const item = SHOP_ITEMS[idx];
      const m = readPrice(r.id);
      const k = Math.max(1, Math.round(r.baseKarma * (m / 10)));
      const c = Math.max(1, Math.round(r.baseCoins * (m / 10)));
      r.text.setText(`${item.emoji} ${item.name} — ${item.description}\n💰 ${k} Karma, ${c} Coins (market: ${m})`);
    });
  }

  private renderSelection() {
    this.rows.forEach((r, idx) => {
      const isSelected = idx === this.selectedIndex;
      r.bg.setFillStyle(isSelected ? 0x5a4a3a : 0x3a2a1a);
      r.bg.setStrokeStyle(2, isSelected ? 0xf0e68c : 0x654321);
      r.text.setColor(isSelected ? "#f0e68c" : "#cde3ff");
    });
    this.updateHUD();
  }

  private async purchaseItem() {
    const item = SHOP_ITEMS[this.selectedIndex];
    const gs = engine.getGameState();
    
    // Get dynamic prices
    const dynamicPrice = readPrice(item.id);
    const adjustedKarma = Math.max(1, Math.round(item.karmaPrice * (dynamicPrice / 10)));
    const adjustedCoins = Math.max(1, Math.round(item.coinPrice * (dynamicPrice / 10)));

    // Check if player has enough currency
    if (gs.player.karma < adjustedKarma) {
      this.updateHUD(`❌ Not enough Karma! Need ${adjustedKarma}, have ${gs.player.karma}`);
      return;
    }

    if (gs.player.coins < adjustedCoins) {
      this.updateHUD(`❌ Not enough Coins! Need ${adjustedCoins}, have ${gs.player.coins}`);
      return;
    }

    // Deduct costs
    engine.earnKarma(-adjustedKarma, `shop_${item.id}`);
    engine.earnCoins(-adjustedCoins, `shop_${item.id}`);

    // Apply benefits based on item type
    let benefit = "";
    switch (item.id) {
      case "hay_bale":
      case "grain_mix":
        engine.setHerdHealth(Math.min(100, gs.herdHealth + 10));
        benefit = "+10 Herd Health";
        break;
      case "mineral_block":
        engine.setHerdHealth(Math.min(100, gs.herdHealth + 15));
        benefit = "+15 Herd Health";
        break;
      case "treats":
        engine.updateAlignment("Good");
        benefit = "Improved Alignment";
        break;
      case "medicine_kit":
        engine.setHerdHealth(Math.min(100, gs.herdHealth + 25));
        benefit = "+25 Herd Health";
        break;
      case "bedding":
        engine.setHerdHealth(Math.min(100, gs.herdHealth + 5));
        benefit = "+5 Herd Health";
        break;
    }

    // Record purchase
    engine.recordAction({ type: "shop_purchase", item: item.id, cost: { karma: item.karmaPrice, coins: item.coinPrice } });

    // Save progress
    const snap = engine.snapshot();
    saveRunLocal(snap);
    try { await saveRunToSupabase(snap); } catch {}

    // Show success message
    this.updateHUD(`✅ Purchased ${item.name}! ${benefit}`);
    
    // Flash effect
    this.cameras.main.flash(200, 139, 245, 162);
  }

  private updateHUD(msg: string = "") {
    const gs = engine.getGameState();
    const item = SHOP_ITEMS[this.selectedIndex];

    const lines = [
      `💰 Your Resources: ${gs.player.karma} Karma, ${gs.player.coins} Coins`,
      `🌾 Herd Health: ${gs.herdHealth}%`,
      "",
      `📦 Selected: ${item.emoji} ${item.name}`,
      `💵 Price: ${item.karmaPrice} Karma + ${item.coinPrice} Coins`,
      "",
      msg || "SPACE to purchase, ↑↓ to browse, ESC to exit"
    ];

    this.info.textContent = lines.filter(Boolean).join("\n");
  }
}
