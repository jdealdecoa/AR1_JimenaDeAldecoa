export class AudioManager {
  constructor(game) {
    this.game = game;
    this.currentMusic = null;
  }

  playMusic(scene, key, config = { loop: true, volume: 0.5 }) {
    this.stopMusic();
    if (scene.sound) {
      this.currentMusic = scene.sound.add(key, config);
      this.currentMusic.play();
    }
  }

  stopMusic() {
    if (this.currentMusic && this.currentMusic.isPlaying) {
      this.currentMusic.stop();
      this.currentMusic = null;
    }
  }

  playEffect(scene, key, config = { volume: 1 }) {
    if (scene.sound) {
      scene.sound.play(key, config);
    }
  }
}


window.AudioManager = AudioManager;
