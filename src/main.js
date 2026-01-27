//cargamos el Intellisense
/// <reference path="./type/phaser.d.ts"/>

// IMPORTS “side-effect” para registrar globals en window:
import "./core/config.js";
import "./core/AudioManager.js";

// Menús / escenas (todas estas son export default)
import IntroScene from "./scenes/IntroScene.js";
import MainMenuScene from "./scenes/MainMenuScene.js";
import SelectModeScene from "./scenes/SelectModeScene.js";
import OptionsMenu from "./scenes/OptionsMenu.js";
import PauseMenu from "./scenes/PauseMenu.js";

// Niveles (default)
import Level1 from "./scenes/Level1.js";
import Level2 from "./scenes/Level2.js";
import Level3 from "./scenes/Level3.js";
import Level4 from "./scenes/Level4.js";
import Level5 from "./scenes/Level5.js";
import Level6 from "./scenes/Level6.js";
import Level7 from "./scenes/Level7.js";
import Level8 from "./scenes/Level8.js";
import Level9 from "./scenes/Level9.js";
import Level10 from "./scenes/Level10.js";

// PanicLevel es named export
import { PanicLevel } from "./scenes/PanicLevel.js";

// 👇 buildConfig viene de window.buildConfig (porque config.js no exporta)
const game = new Phaser.Game(
  window.buildConfig({
    scenes: [
      IntroScene,
      MainMenuScene,
      SelectModeScene,
      OptionsMenu,
      PauseMenu,
      Level1,
      Level2,
      Level3,
      Level4,
      Level5,
      Level6,
      Level7,
      Level8,
      Level9,
      Level10,
      PanicLevel,
    ],
  })
);

// 👇 AudioManager viene de window.AudioManager (porque AudioManager.js no exporta)
game.audioManager = new window.AudioManager(game);
