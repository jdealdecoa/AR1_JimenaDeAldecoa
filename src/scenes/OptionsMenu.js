// src/scenes/OptionsMenu.js

export class OptionsMenu extends Phaser.Scene {
  constructor() {
    super({ key: "OptionsMenu" });
  }

  /**
   * data.from puede ser:
   *  - "main"  → venimos del MainMenuScene
   *  - "pause" → venimos del PauseMenu (Level1 está pausado)
   */
  init(data) {
    this.from = data?.from || "main";
  }

  create() {
    if (this.game.audioManager) {
      this.game.audioManager.stopMusic();
      this.game.audioManager.playMusic(this, 'inicio', { loop: true, volume: 0.5 });
    }

    const cam = this.cameras.main;
    const centerX = cam.centerX;
    const centerY = cam.centerY;

    cam.setBackgroundColor("#000090");

    // ---------- TÍTULO ----------
    this.add
      .text(centerX, centerY - 200, "OPTIONS", {
        fontSize: "48px",
        fontFamily: "Arial",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    // ---------- SLIDER DE VOLUMEN ----------
    const trackWidth = 400;
    const trackHeight = 8;
    const trackY = centerY;
    const minX = centerX - trackWidth / 2;
    const maxX = centerX + trackWidth / 2;

    // Barra gris (pista)
    const track = this.add
      .rectangle(centerX, trackY, trackWidth, trackHeight, 0x555555)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    // Volumen inicial
    let initialVolume = this.registry.get("volume");
    if (typeof initialVolume !== "number") {
      initialVolume =
        typeof this.sound.volume === "number" ? this.sound.volume : 1;
    }

    // Texto del valor de volumen
    const volumeText = this.add
      .text(centerX, trackY - 40, "", {
        fontSize: "24px",
        fontFamily: "Arial",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    // Handle (circulito)
    const handle = this.add
      .circle(
        Phaser.Math.Linear(minX, maxX, initialVolume),
        trackY,
        12,
        0xffcc00
      )
      .setInteractive({ useHandCursor: true });

    this.input.setDraggable(handle);

    const applyVolume = (vol) => {
      const clamped = Phaser.Math.Clamp(vol, 0, 1);
      const x = Phaser.Math.Linear(minX, maxX, clamped);

      handle.x = x;
      this.sound.volume = clamped;
      this.registry.set("volume", clamped);
      volumeText.setText(`Volume: ${Math.round(clamped * 100)}%`);
    };

    // Inicializar slider
    applyVolume(initialVolume);

    // Click en la barra
    track.on("pointerdown", (pointer) => {
      const x = Phaser.Math.Clamp(pointer.x, minX, maxX);
      const t = (x - minX) / (maxX - minX);
      applyVolume(t);
    });

    // Click en el handle
    handle.on("pointerdown", (pointer) => {
      const x = Phaser.Math.Clamp(pointer.x, minX, maxX);
      const t = (x - minX) / (maxX - minX);
      applyVolume(t);
    });

    // Arrastrar handle
    this.input.on("drag", (pointer, gameObject, dragX) => {
      if (gameObject !== handle) return;
      const x = Phaser.Math.Clamp(dragX, minX, maxX);
      const t = (x - minX) / (maxX - minX);
      applyVolume(t);
    });

    // ---------- BOTÓN BACK ----------
    const backText = this.add
      .text(centerX, centerY + 200, "BACK", {
        fontSize: "32px",
        fontFamily: "Arial",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    backText.on("pointerover", () =>
      backText.setStyle({ color: "#000000ff" })
    );
    backText.on("pointerout", () =>
      backText.setStyle({ color: "#ffffff" })
    );

    const goBack = () => {
      if (this.from === "pause") {
        // Volvemos al PauseMenu SOBRE Level1 pausado
        this.scene.launch("PauseMenu");
        this.scene.bringToTop("PauseMenu");
        this.scene.stop(); // cerramos OptionsMenu
      } else {
        // Venimos del menú principal
        this.scene.start("MainMenuScene");
      }
    };

    backText.on("pointerdown", goBack);
    this.input.keyboard.on("keydown-ESC", goBack);
  }

  shutdown() {
    if (this.game.audioManager) {
      this.game.audioManager.stopMusic();
    }
  }
}

export default OptionsMenu;
