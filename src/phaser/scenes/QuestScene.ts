import Phaser from "phaser";
import { engine } from "../../runtime/engine";
import { getRandomQuest, Quest } from "../../runtime/quests";
import { skillCheck, getSkillModifier } from "../../runtime/dice";

export class QuestScene extends Phaser.Scene {
  private quest!: Quest;
  private info!: HTMLElement;
  private phase: "intro" | "attempt" | "result" = "intro";
  private rollResult?: { success: boolean; roll: number; total: number };

  constructor() { super("QuestScene"); }

  create() {
    this.cameras.main.setBackgroundColor("#1a2332");
    this.info = document.getElementById("hud")!;
    this.quest = getRandomQuest();

    // Title
    this.add.text(40, 30, this.quest.name, { 
      fontFamily: "monospace", 
      fontSize: "20px", 
      color: "#f0e68c" 
    });

    // Description
    this.add.text(40, 70, this.quest.description, { 
      fontFamily: "monospace", 
      fontSize: "14px", 
      color: "#cde3ff",
      wordWrap: { width: 880 }
    });

    // Quest info
    const skillName = this.quest.skillType.replace("_", " ").toUpperCase();
    this.add.text(40, 150, `Skill Check: ${skillName} DC ${this.quest.dc}`, {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#9ad1ff"
    });

    this.add.text(40, 180, `Rewards: ${this.quest.karmaReward} Karma, ${this.quest.coinReward} Coins`, {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#8ef5a2"
    });

    // Controls
    this.input.keyboard!.on("keydown-SPACE", () => this.attemptQuest());
    this.input.keyboard!.on("keydown-ESC", () => this.scene.start("OverworldScene"));

    this.updateHUD();
  }

  private updateHUD() {
    const gs = engine.getGameState();
    let msg = "";

    if (this.phase === "intro") {
      msg = `SPACE: Attempt Quest | ESC: Return to Ranch\nKarma: ${gs.player.karma} | Coins: ${gs.player.coins}`;
    } else if (this.phase === "result" && this.rollResult) {
      const { success, roll, total } = this.rollResult;
      msg = `Rolled: ${roll} + modifier = ${total} vs DC ${this.quest.dc}\n${success ? "SUCCESS!" : "FAILED."}\nSPACE: Try Again | ESC: Return`;
    }

    this.info.textContent = msg;
  }

  private attemptQuest() {
    if (this.phase === "intro") {
      this.phase = "attempt";
      const modifier = getSkillModifier(this.quest.skillType);
      this.rollResult = skillCheck(this.quest.dc, modifier);

      // Show dice roll animation
      const diceText = this.add.text(480, 300, `Rolling d20...`, {
        fontFamily: "monospace",
        fontSize: "24px",
        color: "#ffffff"
      }).setOrigin(0.5);

      this.time.delayedCall(500, () => {
        diceText.setText(`Rolled: ${this.rollResult!.roll}!`);
      });

      this.time.delayedCall(1500, () => {
        this.phase = "result";
        diceText.destroy();

        if (this.rollResult!.success) {
          // Award rewards
          engine.earnKarma(this.quest.karmaReward, `quest_${this.quest.id}`);
          engine.earnCoins(this.quest.coinReward, `quest_${this.quest.id}`);
          engine.completeActivity();

          this.add.text(480, 300, "QUEST COMPLETE!", {
            fontFamily: "monospace",
            fontSize: "28px",
            color: "#8ef5a2"
          }).setOrigin(0.5);

          this.add.text(480, 350, `+${this.quest.karmaReward} Karma, +${this.quest.coinReward} Coins`, {
            fontFamily: "monospace",
            fontSize: "16px",
            color: "#f0e68c"
          }).setOrigin(0.5);
        } else {
          this.add.text(480, 300, "Quest Failed!", {
            fontFamily: "monospace",
            fontSize: "28px",
            color: "#ff9aa2"
          }).setOrigin(0.5);

          this.add.text(480, 350, "Try again or return to ranch", {
            fontFamily: "monospace",
            fontSize: "16px",
            color: "#cde3ff"
          }).setOrigin(0.5);
        }

        this.updateHUD();
      });
    } else if (this.phase === "result") {
      // Reset for retry
      this.scene.restart();
    }
  }
}
