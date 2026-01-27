import { BigBall } from './BigBall.js';
import { EVENTS } from '../../../../core/events.js';
import { BALL_COLORS } from '../BallConstants.js';

/**
 * StarClearBall - Bola especial que limpia todas las bolas de la pantalla
 * Tiene apariencia normal pero con efecto visual de estrella
 */
export class StarClearBall extends BigBall {
  constructor(scene, x, y, speedX, color = BALL_COLORS.ORANGE) {
    super(scene, x, y, speedX, color);
    
    // Marcar como bola especial limpiadora
    this.isStarClear = true;
    
    // Dibujar una estrella blanca en el medio usando un gráfico dinámico
    this.createStarGraphic(scene);
    
    // Efecto visual pulsante para indicar que es especial
    scene.tweens.add({
      targets: this,
      scale: { from: 2.0, to: 2.3 },
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Crear un gráfico de estrella blanca en el centro
   */
  createStarGraphic(scene) {
    // Crear gráfico dinámico para la estrella
    const graphics = scene.make.graphics({
      x: this.x,
      y: this.y,
      add: true
    });

    // Configurar para dibujar la estrella
    graphics.fillStyle(0xffffff, 1); // Blanco opaco
    
    // Dibujar una estrella de 5 puntas
    this.drawStar(graphics, 0, 0, 5, 6, 3);
    
    // Guardar referencia y configurar para que siga a la bola
    this.starGraphic = graphics;
    this.starGraphic.setDepth(this.depth + 1);
  }

  /**
   * Dibujar forma de estrella en graphics
   */
  drawStar(graphics, cx, cy, spikes, outerRadius, innerRadius) {
    const step = Math.PI / spikes;

    graphics.beginPath();
    graphics.moveTo(cx, cy - outerRadius);

    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = step * i - Math.PI / 2;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      graphics.lineTo(x, y);
    }

    graphics.closePath();
    graphics.fillPath();
  }

  /**
   * Override preUpdate para hacer que la estrella siga a la bola
   */
  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    
    // Hacer que el gráfico de la estrella siga a la bola
    if (this.starGraphic && this.starGraphic.active) {
      this.starGraphic.setPosition(this.x, this.y);
    }
  }

  /**
   * Override destroy para limpiar el gráfico
   */
  destroy(fromScene) {
    if (this.starGraphic) {
      this.starGraphic.destroy();
    }
    super.destroy(fromScene);
  }

  /**
   * Override takeDamage para implementar la limpieza de pantalla
   */
  async takeDamage() {
    // Mostrar puntaje flotante
    this.showFloatingScore();
    
    // Dar puntos bonus
    if (this.scene && this.scene.game && this.scene.game.events) {
      const bonusScore = 500; // Bonus especial por bola limpiadora
      this.scene.game.events.emit(EVENTS.game.SCORE_CHANGE, bonusScore);
    }

    // Reproducir audio pop
    if (this.scene && this.scene.sound) {
      this.scene.sound.play('burbuja_pop', { volume: 0.7 });
    }

    // Emit BALL_DESTROYED event ANTES de activateStarClear
    if (this.scene && this.scene.game && this.scene.game.events) {
      this.scene.game.events.emit(EVENTS.enemy.BALL_DESTROYED, this);
    }

    // Activar efecto de limpieza de pantalla (esto destruirá todas las bolas incluyendo esta)
    if (this.scene && this.scene.activateStarClear) {
      await this.scene.activateStarClear(this); // Pasar referencia a esta bola
    }

    // Destruir esta bola (por si acaso no se destruyó en activateStarClear)
    if (!this.isDestroyed) {
      if (this.scene && this.scene.ballsGroup && this.scene.ballsGroup.contains(this)) {
        this.scene.ballsGroup.remove(this, true, true);
      }
      this.destroy();
    }
  }
}
