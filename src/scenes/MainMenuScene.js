// src/scenes/MainMenuScene.js

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  preload() {
    // Fondo del menú principal
    this.load.image(
      'mainMenuBg',
      'assets/sprites/ui/MainSceneSprite.jpg'
    );
    this.load.setPath('assets/audio');
    this.load.audio('inicio', 'inicio.mp3');
  }

  create() {
    const cam = this.cameras.main;
    const centerX = cam.centerX;
    const centerY = cam.centerY;

    // Fondo negro por si la imagen no cubre todo
    cam.setBackgroundColor('#000000');

    // ===== FONDO =====
    const bg = this.add.image(centerX, centerY, 'mainMenuBg');

    // Ajustar el fondo manteniendo proporción
    const scaleX = cam.width / bg.width;
    const scaleY = cam.height / bg.height;
    const scale = Math.min(scaleX, scaleY);

    bg.setScale(scale);
    bg.setDepth(0);

    if (this.game.audioManager) {
      this.game.audioManager.stopMusic();
      this.game.audioManager.playMusic(this, 'inicio', { loop: true, volume: 0.5 });
    }

    // ===== BOTÓN JUGAR =====
    const playText = this.add.text(centerX, centerY + 360, 'JUGAR', {
      fontSize: '32px',
      fill: '#ffffff',
      fontFamily: 'Arial'
    })
      .setOrigin(0.5)
      .setDepth(1)
      .setInteractive({ useHandCursor: true });

    playText.on('pointerover', () =>
      playText.setStyle({ fill: '#f39c12' })
    );
    playText.on('pointerout', () =>
      playText.setStyle({ fill: '#ffffff' })
    );
    playText.on('pointerdown', () => {
      this.scene.start('SelectModeScene');
    });

    // ===== BOTÓN OPTIONS =====
    const optionsText = this.add.text(centerX - 200, centerY + 360, 'OPTIONS', {
      fontSize: '32px',
      fill: '#ffffff',
      fontFamily: 'Arial'
    })
      .setOrigin(0.5)
      .setDepth(1)
      .setInteractive({ useHandCursor: true });

    optionsText.on('pointerover', () =>
      optionsText.setStyle({ fill: '#f39c12' })
    );
    optionsText.on('pointerout', () =>
      optionsText.setStyle({ fill: '#ffffff' })
    );
    optionsText.on('pointerdown', () => {
      this.scene.start('OptionsMenu', { from: 'main' });
    });

    // ===== BOTÓN EXIT =====
    const exitText = this.add.text(centerX + 180, centerY + 360, 'EXIT', {
      fontSize: '32px',
      fill: '#ffffff',
      fontFamily: 'Arial'
    })
      .setOrigin(0.5)
      .setDepth(1)
      .setInteractive({ useHandCursor: true });

    exitText.on('pointerover', () =>
      exitText.setStyle({ fill: '#f39c12' })
    );
    exitText.on('pointerout', () =>
      exitText.setStyle({ fill: '#ffffff' })
    );
    exitText.on('pointerdown', () => {
      this.game.destroy(true);
    });
  }

  update(time, delta) {}

  shutdown() {
    if (this.game.audioManager) {
      this.game.audioManager.stopMusic();
    }
  }
}

export default MainMenuScene;
