// src/entities/weapons/FixedHarpoon.js

import { WEAPON } from '../../core/constants.js';

export class FixedHarpoon extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture = 'arponFijo') {
    // Lo spawneamos DEBAJO del mundo físico
    const worldHeight = scene.physics.world.bounds.height;
    const spawnY = worldHeight + 800;
    super(scene, x, spawnY, texture);

    this.scene = scene;

    // Añadir a la escena + física
    scene.add.existing(this);
    this.scene.physics.world.enable(this);

    // NO colisionar con los límites del mundo (puede estar fuera mientras sube)
    this.body.setCollideWorldBounds(false);

    // PROFUNDIDAD: por encima del fondo (-2) y por debajo de todo lo demás (0)
    this.setDepth(-1);
    this.setOrigin(0.5, 1);
    this.setScale(4, 5);

    // Sin gravedad, no lo mueve nada salvo nuestra velocidad
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);

    // Collider fijo que coincide con el sprite
    const bodyWidth  = this.displayWidth * 0.4;
    const bodyHeight = this.displayHeight - 740;
    this.body.setSize(bodyWidth, bodyHeight, true);

    // Velocidad constante hacia arriba
    this.body.setVelocityY(-WEAPON.HARPOON_SPEED);

    // Estado del arpón fijo
    this.isStuck = false;
    this.stuckTimer = null;
    this.tintTween = null;
    this.STUCK_DURATION = 3000; // 3 segundos pegado al techo
    this.stuckStartTime = 0;
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);

    // Si ya está pegado, actualizar el tint progresivo
    if (this.isStuck) {
      this.updateStuckTint(time);
      return;
    }

    // Cuando la punta llega al techo (y <= 0), se pega
    if (this.getTopCenter().y <= 0) {
      this.stickToTop();
    }
  }

  updateStuckTint(time) {
    // Calcular progreso del tiempo pegado (0 = inicio, 1 = fin)
    const elapsed = time - this.stuckStartTime;
    const progress = Math.min(elapsed / this.STUCK_DURATION, 1);

    // Interpolar color de blanco (0xFFFFFF) a amarillo (0xFFFF00)
    // En RGB: blanco = (255, 255, 255), amarillo = (255, 255, 0)
    // Solo necesitamos reducir el componente azul de 255 a 0
    const blue = Math.floor(255 * (1 - progress));
    const tintColor = (255 << 16) | (255 << 8) | blue; // RGB format
    
    this.setTint(tintColor);
  }

  stickToTop() {
    // Marcar como pegado
    this.isStuck = true;
    this.stuckStartTime = this.scene.time.now;

    // Detener movimiento
    this.body.setVelocity(0, 0);

    // No cambiar la posición - se queda donde colisionó

    // Configurar timer para destruirse después de unos segundos
    this.stuckTimer = this.scene.time.delayedCall(this.STUCK_DURATION, () => {
      this.destroy();
    }, [], this);
  }

  // Método llamado cuando una bola toca el arpón
  onBallHit() {
    this.destroy();
  }

  destroy() {
    // Limpiar el timer si existe
    if (this.stuckTimer) {
      this.stuckTimer.remove();
      this.stuckTimer = null;
    }
    
    // Limpiar el tween si existe
    if (this.tintTween) {
      this.tintTween.remove();
      this.tintTween = null;
    }
    
    super.destroy();
  }

  // Método llamado cuando colisiona con una pared
  onWallCollision() {
    if (!this.isStuck) {
      this.stickToTop();
    }
  }
}

export default FixedHarpoon;
