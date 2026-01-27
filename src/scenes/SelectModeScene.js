// src/scenes/SelectModeScene.js

export class SelectModeScene extends Phaser.Scene {
  constructor() {
    super({ key: "SelectModeScene" });
  }

  preload() {
    this.load.image(
      "selectModeBg",
      "assets/sprites/ui/SelectModeSceneSprite.png"
    );
    this.load.setPath('assets/audio');
    this.load.audio('inicio', 'inicio.mp3');
  }

  create() {
    const cam = this.cameras.main;
    const centerX = cam.centerX;
    const centerY = cam.centerY;

    // Fondo negro por si la imagen no cubre todo
    cam.setBackgroundColor("#000000");

    // ===== Fondo imagen =====
    const bg = this.add.image(centerX, centerY, "selectModeBg").setDepth(0);

    // Escalar manteniendo proporción (sin deformar)
    const scaleX = cam.width / bg.width;
    const scaleY = cam.height / bg.height;
    const scale = Math.min(scaleX, scaleY);
    bg.setScale(scale);

    if (this.game.audioManager) {
      this.game.audioManager.stopMusic();
      this.game.audioManager.playMusic(this, 'inicio', { loop: true, volume: 0.5 });
    }

    // ===== ZONAS CLICABLES encima de los recuadros =====
    // Ajusta estos valores si tu imagen no coincide perfecto.
    const boxW = 410;
    const boxH = 290;

    const panicX = centerX - 325; // izquierda (Panic)
    const tourX = centerX + 325;  // derecha (Tour)
    const boxY = centerY - 145;    // un pelín arriba (como en la screenshot)

    // borde de hover para dar feedback
    const panicHover = this.add
      .rectangle(panicX, boxY, boxW, boxH)
      .setStrokeStyle(4, 0x00ffff)
      .setAlpha(0)
      .setDepth(1);

    const tourHover = this.add
      .rectangle(tourX, boxY, boxW, boxH)
      .setStrokeStyle(4, 0x00ffff)
      .setAlpha(0)
      .setDepth(1);

    // ZONA PANIC
    const panicZone = this.add
      .zone(panicX, boxY, boxW, boxH)
      .setOrigin(0.5)
      .setDepth(2)
      .setInteractive({ useHandCursor: true });

    panicZone.on("pointerover", () => {
      panicHover.setAlpha(1);
    });
    panicZone.on("pointerout", () => {
      panicHover.setAlpha(0);
    });
    panicZone.on("pointerdown", () => {
      this.scene.start("PanicLevel", { mode: "panic" });
    });

    // ZONA TOUR
    const tourZone = this.add
      .zone(tourX, boxY, boxW, boxH)
      .setOrigin(0.5)
      .setDepth(2)
      .setInteractive({ useHandCursor: true });

    tourZone.on("pointerover", () => {
      tourHover.setAlpha(1);
    });
    tourZone.on("pointerout", () => {
      tourHover.setAlpha(0);
    });
    tourZone.on("pointerdown", () => {
      this.scene.start("Level1", { mode: "tour" });
    });

    // ESC para volver al menú principal
    this.input.keyboard.on("keydown-ESC", () => {
      this.scene.start("MainMenuScene");
    });
  }

  shutdown() {
    if (this.game.audioManager) {
      this.game.audioManager.stopMusic();
    }
  }
}

export default SelectModeScene;
