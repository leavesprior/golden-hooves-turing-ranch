import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { OverworldScene } from "./scenes/OverworldScene";
import { BattleScene } from "./scenes/BattleScene";
import { DialogueScene } from "./scenes/DialogueScene";
import { ClueScene } from "./scenes/ClueScene";
import { Level2OverworldScene } from "./scenes/Level2OverworldScene";
import { Level2TacticsScene } from "./scenes/Level2TacticsScene";
import { Level2RitualScene } from "./scenes/Level2RitualScene";

export function startGame(parentId: string) {
  new Phaser.Game({
    type: Phaser.AUTO,
    width: 960,
    height: 540,
    parent: parentId,
    backgroundColor: "#0b0f14",
    scene: [
      BootScene,
      OverworldScene, BattleScene, DialogueScene,
      ClueScene, Level2OverworldScene, Level2TacticsScene, Level2RitualScene
    ],
    pixelArt: true,
    physics: { default: "arcade", arcade: { debug: false } }
  });
}
