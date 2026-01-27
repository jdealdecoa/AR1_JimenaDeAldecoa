/**
 * WallManager - Manages walls, floor, and ceiling for all levels
 * 
 * Handles:
 * - Creating separate floor, ceiling, and wall layers from tilemap
 * - Setting up collision properties
 * - Adding colliders with hero, balls, items, etc.
 */

export class WallManager {
  /**
   * @param {Phaser.Scene} scene - The game scene
   * @param {Phaser.Tilemaps.Tilemap} map - The tilemap
   * @param {Object} config - Configuration object
   * @param {string} config.floorLayer - Name of the floor layer (default: "layer_floor")
   * @param {string} config.ceilingLayer - Name of the ceiling layer (default: "layer_ceiling")
   * @param {string} config.wallsLayer - Name of the walls layer (default: "layer_walls")
   * @param {string} config.tilesetName - Name of the tileset
   */
  constructor(scene, map, config = {}) {
    this.scene = scene;
    this.map = map;
    
    const {
      floorLayer = "layer_floor",
      ceilingLayer = "layer_ceiling", 
      wallsLayer = "layer_walls",
      tilesetName
    } = config;
    
    // Create floor layer
    this.floorLayer = map.createLayer(floorLayer, tilesetName, 0, 0);
    if (this.floorLayer) {
      this.floorLayer.setCollisionByExclusion([-1]);
      console.log(`WallManager: Floor layer "${floorLayer}" created with collision`);
    }
    
    // Create ceiling layer
    this.ceilingLayer = map.createLayer(ceilingLayer, tilesetName, 0, 0);
    if (this.ceilingLayer) {
      this.ceilingLayer.setCollisionByExclusion([-1]);
      console.log(`WallManager: Ceiling layer "${ceilingLayer}" created with collision`);
    }
    
    // Create walls layer (optional - may not exist in all levels)
    this.wallsLayer = map.createLayer(wallsLayer, tilesetName, 0, 0);
    if (this.wallsLayer) {
      this.wallsLayer.setCollisionByExclusion([-1]);
      console.log(`WallManager: Walls layer "${wallsLayer}" created with collision`);
    }
  }

  /**
   * Setup colliders for the hero
   * @param {Hero} hero - The hero sprite
   */
  addHeroCollider(hero) {
    if (!hero) return;
    if (this.floorLayer) this.scene.physics.add.collider(hero, this.floorLayer);
    if (this.ceilingLayer) this.scene.physics.add.collider(hero, this.ceilingLayer);
    if (this.wallsLayer) this.scene.physics.add.collider(hero, this.wallsLayer);
  }

  /**
   * Setup colliders for a group (e.g., balls, items)
   * @param {Phaser.GameObjects.Group} group - The physics group
   * @param {Function} callback - Optional callback function on collision
   * @param {object} context - Context for the callback
   */
  addGroupCollider(group, callback = null, context = null) {
    if (!group) return;
    if (this.floorLayer) this.scene.physics.add.collider(group, this.floorLayer, callback, null, context);
    if (this.ceilingLayer) this.scene.physics.add.collider(group, this.ceilingLayer, callback, null, context);
    if (this.wallsLayer) this.scene.physics.add.collider(group, this.wallsLayer, callback, null, context);
  }

  /**
   * Setup overlap check for weapons (bullets, harpoons) - only with ceiling
   * Weapons are destroyed when they hit ceiling
   * @param {Phaser.GameObjects.Group|Phaser.GameObjects.Sprite} weapons - Weapon or weapon group
   * @param {Function} callback - Callback to destroy weapon
   */
  addWeaponOverlap(weapons, callback) {
    if (!weapons || !callback) return;
    // Weapons only collide with ceiling (not floor)
    if (this.ceilingLayer) {
      this.scene.physics.add.collider(weapons, this.ceilingLayer, callback, null, this.scene);
    }
    // Optional: also collide with side walls if they exist
    if (this.wallsLayer) {
      this.scene.physics.add.collider(weapons, this.wallsLayer, callback, null, this.scene);
    }
  }

  /**
   * Get the floor layer
   * @returns {Phaser.Tilemaps.TilemapLayer}
   */
  getFloorLayer() {
    return this.floorLayer;
  }

  /**
   * Get the ceiling layer
   * @returns {Phaser.Tilemaps.TilemapLayer}
   */
  getCeilingLayer() {
    return this.ceilingLayer;
  }

  /**
   * Get the walls layer
   * @returns {Phaser.Tilemaps.TilemapLayer}
   */
  getWallsLayer() {
    return this.wallsLayer;
  }

  /**
   * Get the walls layer (backwards compatibility)
   * @returns {Phaser.Tilemaps.TilemapLayer}
   */
  getLayer() {
    return this.wallsLayer;
  }

  /**
   * Destroy the wall manager
   */
  destroy() {
    if (this.floorLayer) {
      this.floorLayer.destroy();
      this.floorLayer = null;
    }
    if (this.ceilingLayer) {
      this.ceilingLayer.destroy();
      this.ceilingLayer = null;
    }
    if (this.wallsLayer) {
      this.wallsLayer.destroy();
      this.wallsLayer = null;
    }
  }
}
