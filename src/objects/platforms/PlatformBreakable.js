// src/objects/platforms/PlatformBreakable.js

import { PlatformBase } from './PlatformBase.js';

/**
 * PlatformBreakable - Breakable platform
 *
 * Features:
 * - Breaks when hit by weapons
 * - Optional item drop on destruction
 * - Supports dropType string assigned by DropManager (from tiled "drops_platforms")
 */
export class PlatformBreakable extends PlatformBase {
  /**
   * @param {Phaser.Scene} scene - The game scene
   * @param {object} config - Platform configuration
   * @param {object|null} config.dropItem - Legacy drop config { type: 'FRUITS', variant: 'LARGE' } or null
   */
  constructor(scene, config) {
    super(scene, config);

    this.type = 'BREAKABLE';

    // Legacy/optional structured drop config
    this.dropItem = config.dropItem || null;

    // ✅ New: string drop id from tiled (e.g. "shield", "time_freeze", "machine_gun", ...)
    this.dropType = null;

    // Set collision properties on all tiles
    this.tiles.forEach(tile => {
      if (tile) {
        tile.setCollision(true, true, true, true);

        // Mark as breakable for collision detection
        tile.properties = tile.properties || {};
        tile.properties.breakable = true;

        // ✅ Important: store platform reference in tile properties (your PlatformBase usually does this,
        // but we ensure it here too in case)
        tile.properties.platform = this;

        // Apply fixed color tint
        tile.tint = this.color;
      }
    });
  }

  /**
   * Optional helper used by DropManager
   * @param {string} dropType - e.g. "shield", "time_freeze", "double_harpoon"
   */
  setDropType(dropType) {
    this.dropType = dropType;
  }

  /**
   * Break the platform
   * @param {object} weapon - The weapon that hit the platform (optional)
   */
  break(weapon = null) {
    if (this.isDestroyed) return;

    const center = this.getCenterPosition();

    // Visual effect
    this.createBreakEffect(center.x, center.y);

    // ✅ Drop logic:
    // 1) If tiled assigned dropType -> drop that
    // 2) else if dropItem configured (legacy) -> drop that
    this.spawnDrop(center.x, center.y);

    // Destroy weapon if provided
    if (weapon && weapon.destroy && weapon.active) {
      weapon.destroy();
    }

    // Eliminar colisión de todos los tiles antes de destruir
    this.tiles.forEach(tile => {
      if (tile && tile.tilemapLayer) {
        tile.tilemapLayer.removeTileAt(tile.x, tile.y);
        tile.setCollision(false, false, false, false);
        // Elimina referencia a la plataforma
        if (tile.properties) {
          delete tile.properties.platform;
        }
      }
    });
    // Refresca la colisión del layer completo
    if (this.scene.platformsBreakable) {
      this.scene.platformsBreakable.setCollisionByExclusion([-1, 0]);
    }
    // Elimina referencia del array de plataformas
    if (this.scene.breakablePlatforms) {
      this.scene.breakablePlatforms = this.scene.breakablePlatforms.filter(p => p !== this);
    }

    // Destroy platform tiles / base cleanup
    super.destroy();

    // Play platform break sound
    if (this.scene && this.scene.sound) {
      this.scene.sound.play('rectangulo_pop', { volume: 0.7 });
    }

    console.log('Breakable platform destroyed at', center);
  }

  /**
   * Create visual break effect
   */
  createBreakEffect(x, y) {
    const particles = this.scene.add.particles(x, y, 'bonus', {
      frame: 0,
      speed: { min: 50, max: 150 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 600,
      quantity: 8,
      angle: { min: 0, max: 360 },
      rotate: 0,
      tint: this.color,
      blendMode: 'ADD'
    });

    this.scene.time.delayedCall(700, () => {
      particles.destroy();
    });

    this.tiles.forEach(tile => {
      if (!tile) return;

      this.scene.tweens.add({
        targets: tile,
        alpha: 0,
        duration: 200,
        ease: 'Power2'
      });
    });
  }

  /**
   * Spawn item drop at position.
   * Uses:
   * - this.dropType (string from tiled) OR
   * - this.dropItem (legacy structured config)
   */
  spawnDrop(x, y) {
    if (!this.scene.dropper) return;

    // 1) Prefer dropType assigned by DropManager
    if (this.dropType) {
      this.scene.dropper.dropFrom(null, x, y, {
        itemType: this.dropType, // e.g. "shield" -> Dropper maps it
        guaranteed: true
      });
      return;
    }

    // 2) Legacy structured dropItem
    if (this.dropItem && this.dropItem.type) {
      this.scene.dropper.dropFrom(null, x, y, {
        itemType: this.dropItem.type,    // e.g. 'FRUITS', 'POWER_UP_SHIELD'
        variant: this.dropItem.variant,  // optional
        guaranteed: true
      });
    }
  }

  update(time, delta) {
    if (this.isDestroyed) return;
    this.shimmerTime += delta * 0.001;
  }
}
