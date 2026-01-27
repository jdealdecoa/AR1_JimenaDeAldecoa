// src/scenes/IntroScene.js

export class IntroScene extends Phaser.Scene {
  constructor() {
    super({ key: 'IntroScene' });
  }

  preload() {
    this.load.video(
      'intro',
      'assets/video/intro.mp4',
      'loadeddata',
      false,
      true
    );
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor('#000');

    const video = this.add.video(width / 2, height / 2, 'intro');

    video.setScale(0.9);   // ajusta tamaño si quieres
    video.setMute(true);   // evita bloqueo de autoplay
    video.play();

    // CUANDO ACABA EL VIDEO → MAIN MENU
    video.once('complete', this.goToMenu, this);

    // TAMBIÉN SE PUEDE SALTAR
    this.input.once('pointerdown', this.goToMenu, this);
    this.input.keyboard.once('keydown', this.goToMenu, this);
  }

  goToMenu() {
    this.scene.start('MainMenuScene');
  }
}

export default IntroScene;
