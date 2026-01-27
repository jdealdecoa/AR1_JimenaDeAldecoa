

export class BaseItem extends Phaser.Physics.Arcade.Sprite {
  /**
   * @param {Phaser.Scene} scene - The scene this item belongs to
   * @param {number} x - Initial X position
   * @param {number} y - Initial Y position
   * @param {string} texture - Texture key for the item sprite
   * @param {object} config - Configuration object
   * @param {string} config.itemType - Type identifier for this item
   * @param {number} [config.ttl=10000] - Time to live in milliseconds (0 = infinite)
   * @param {number} [config.gravity=600] - Gravity acceleration
   * @param {number} [config.bounce=0.5] - Bounce factor (0-1)
   * @param {number} [config.initialVelocityX=0] - Initial horizontal velocity
   * @param {number} [config.initialVelocityY=100] - Initial vertical velocity
   */
  constructor(scene, x, y, texture, config = {}) {
    super(scene, x, y, texture);
    
    scene.add.existing(this);
    scene.physics.world.enable(this);

    // Configuración con valores por defecto
    this.itemType = config.itemType || 'unknown';
    this.ttl = config.ttl !== undefined ? config.ttl : 0; // 0 = infinite (no TTL)
    this.originalTTL = this.ttl;
    
    // Gestión de estado
    this.active = true;
    this.consumed = false;
    
    // Configura física: caída suave y sin rebote
    this.body.setGravityY(config.gravity !== undefined ? config.gravity : 200);
    this.body.setBounce(0); // Sin rebote - se quedan estáticos
    this.body.setCollideWorldBounds(true);
    this.body.setAllowRotation(false); // Sin rotación física
    this.body.setAngularVelocity(0);
    this.body.setAngularAcceleration(0);
    
    // Asigna velocidad inicial
    const velX = config.initialVelocityX !== undefined ? config.initialVelocityX : 0;
    const velY = config.initialVelocityY !== undefined ? config.initialVelocityY : 100;
    this.body.setVelocity(velX, velY);
    
    // Escala grande y sprite fijo sin rotación
    this.setScale(2.5);
    this.setRotation(0);
    this.setAngularVelocity(0);
    this.rotation = 0;
    this.angle = 0;
    
    // Efectos visuales: brillo/pulso
    this.createVisualEffects();
    
    // Parpadeo de advertencia TTL (últimos 2 segundos)
    if (this.ttl > 0) {
      this.ttlBlinkTimer = null;
    }

    // Depth
    this.setDepth(50);
  }

  /**
   * Create visual feedback effects (pulse, glow)
   */
  createVisualEffects() {
    // Gentle floating pulse animation - desde escala 2.5 a 2.8
    this.scene.tweens.add({
      targets: this,
      scaleX: 2.8,
      scaleY: 2.8,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Called when item is picked up by hero.
   * Override in subclasses to implement specific effects.
   * This method should apply the item effect to the hero.
   * 
   * @param {Hero} hero - The hero picking up this item
   */
  onPickup(hero) {
    // Override in subclasses
    console.warn(`BaseItem.onPickup() not overridden for ${this.itemType}`);
  }

  /**
   * Check if this item collides with the hero and trigger pickup
   * @param {Hero} hero - The hero to check collision with
   */
  checkPickup(hero) {
    if (!this.active || this.consumed) return false;
    
    // Simple overlap check using Phaser's bounds
    const bounds = this.getBounds();
    const heroBounds = hero.getBounds();
    
    if (Phaser.Geom.Intersects.RectangleToRectangle(bounds, heroBounds)) {
      this.pickup(hero);
      return true;
    }
    
    return false;
  }

  /**
   * Handle item pickup
   * @param {Hero} hero - The hero picking up this item
   */
  pickup(hero) {
    if (this.consumed) return;
    
    this.consumed = true;
    this.active = false;
    
    // Call the specific item effect (to be overridden)
    this.onPickup(hero);
    
    // Play pickup animation/effect
    this.playPickupEffect();
    
    // Destroy the item after a short delay for animation
    this.scene.time.delayedCall(150, () => {
      this.destroy();
    });
  }

  /**
   * Play visual/audio feedback for item pickup
   */
  playPickupEffect() {
    // Quick scale-up and fade out
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 150,
      ease: 'Back.easeIn'
    });
    
    // Optional: play sound effect
    // this.scene.sound.play('item_pickup');
  }

  /**
   * Update method called each frame
   * Handles TTL countdown and despawn
   */
  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    
    if (!this.active || this.consumed) return;
    
    // Forzar rotación 0 siempre (evitar cualquier rotación)
    this.rotation = 0;
    this.angle = 0;
    
    // TTL DESHABILITADO - Los items NUNCA desaparecen automáticamente
    // Solo se destruyen cuando el jugador los recoge
    /*
    if (this.ttl > 0) {
      this.ttl -= delta;
      
      if (this.ttl <= 2000 && this.ttl > 0 && !this.ttlBlinkTimer) {
        this.startTTLBlink();
      }
      
      if (this.ttl <= 0) {
        this.despawn();
      }
    }
    */
  }

  /**
   * Start blinking effect when TTL is running out
   */
  startTTLBlink() {
    this.ttlBlinkTimer = this.scene.time.addEvent({
      delay: 150,
      callback: () => {
        this.setAlpha(this.alpha === 1 ? 0.3 : 1);
      },
      loop: true
    });
  }

  /**
   * Despawn the item (TTL expired)
   */
  despawn() {
    this.active = false;
    
    // Quick fade out
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        this.destroy();
      }
    });
  }

  /**
   * Clean up when destroying
   */
  destroy(fromScene) {
    if (this.ttlBlinkTimer) {
      this.ttlBlinkTimer.destroy();
      this.ttlBlinkTimer = null;
    }
    
    super.destroy(fromScene);
  }
}
