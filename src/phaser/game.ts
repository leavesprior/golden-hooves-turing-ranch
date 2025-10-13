import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { OverworldScene } from "./scenes/OverworldScene";
import { BattleScene } from "./scenes/BattleScene";
import { DialogueScene } from "./scenes/DialogueScene";
import { ClueScene } from "./scenes/ClueScene";
import { QuestScene } from "./scenes/QuestScene";
import { BarnShopScene } from "./scenes/BarnShopScene";
import { Level2MapScene } from "./scenes/Level2MapScene";
import { Level2NodeScene } from "./scenes/Level2NodeScene";
import { Level2ArrestScene } from "./scenes/Level2ArrestScene";

export function startGame(parentId: string) {
  new Phaser.Game({
    type: Phaser.AUTO, width: 960, height: 540, parent: parentId, pixelArt: true,
    backgroundColor: "#0b0f14",
    scene: [
      BootScene,
      OverworldScene, BattleScene, DialogueScene, ClueScene, QuestScene, BarnShopScene,
      Level2MapScene, Level2NodeScene, Level2ArrestScene
    ],
    physics: { default: "arcade", arcade: { debug: false } }
  });
}
