import { GAME_SIZE } from '../core/constants.js';

export class ReadyScreen {
  constructor(scene) {
    this.scene = scene;
    this.readyText = null;
    this.isActive = false;
  }

  /**
   * Muestra la pantalla de READY parpadeante durante el tiempo especificado
   * @param {number} duration - Duración en milisegundos (default: 1500)
   * @returns {Promise} Promesa que se resuelve cuando termina la animación
   */
  show(duration = 1500) {
    return new Promise((resolve) => {
      // Pausar la escena
      this.scene.physics.pause();

      // Crear el texto "READY"
      this.readyText = this.scene.add.text(
        GAME_SIZE.WIDTH / 2,
        GAME_SIZE.HEIGHT / 2,
        'READY',
        {
          fontFamily: 'Arial',
          fontSize: '80px',
          fontStyle: 'bold',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 4,
          align: 'center'
        }
      ).setOrigin(0.5, 0.5);

      // Establecer profundidad para que esté encima de todo
      this.readyText.setDepth(1000);

      this.isActive = true;

      // Crear animación de parpadeo
      const blinkTweens = [];
      const blinkCount = 4; // Número de parpadeos
      const blinkInterval = duration / (blinkCount * 2);

      // Crear varios tweens de parpadeo
      for (let i = 0; i < blinkCount * 2; i++) {
        const delay = i * blinkInterval;
        const tween = this.scene.tweens.add({
          targets: this.readyText,
          alpha: i % 2 === 0 ? { from: 1, to: 0 } : { from: 0, to: 1 },
          duration: blinkInterval * 0.8,
          delay: delay,
          ease: 'Linear'
        });
        blinkTweens.push(tween);
      }

      // Cuando termine la duración, reanudar la escena y limpiar
      this.scene.time.delayedCall(duration, () => {
        // Eliminar el texto
        if (this.readyText) {
          this.readyText.destroy();
          this.readyText = null;
        }

        this.isActive = false;

        // Reanudar la física
        this.scene.physics.resume();

        resolve();
      });
    });
  }

  /**
   * Detiene y limpia la pantalla de READY
   */
  stop() {
    if (this.readyText) {
      this.readyText.destroy();
      this.readyText = null;
    }
    this.isActive = false;
    this.scene.physics.resume();
  }
}
