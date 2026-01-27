import { PlatformBase } from './PlatformBase.js';

/**
 * PlatformStatic - Static platform with wall-like behavior
 * 
 * Behaves exactly like walls:
 * - Immovable
 * - Full collision on all sides
 * - Cannot be destroyed
 */

export class PlatformStatic extends PlatformBase {
  /**
   * @param {Phaser.Scene} scene - The game scene
   * @param {object} config - Platform configuration (same as PlatformBase)
   */
  constructor(scene, config) {
    super(scene, config);
    
    this.type = 'STATIC';
    
    // Set collision properties on all tiles
    this.tiles.forEach(tile => {
      if (tile) {
        // Enable collision on all sides
        tile.setCollision(true, true, true, true);
      }
    });
  }

  /**
   * Static platforms cannot be destroyed
   */
  destroy() {
    // Static platforms are permanent - override to prevent destruction
    console.warn('Attempted to destroy static platform - ignoring');
  }
}
