// src/objects/platforms/PlatformBase.js
//
// Base class for platforms built from Tilemap tiles.
// Used by PlatformStatic / PlatformBreakable via PlatformManager.
//
// Important: Platforms may be created even if the original tiles were cleared
// (many levels call layer.fill(-1)). In that case, we recreate the tiles using
// the provided pattern (array of tile indexes).

export class PlatformBase {
  /**
   * @param {Phaser.Scene} scene
   * @param {object} config
   * @param {number} config.x - tile X (not world)
   * @param {number} config.y - tile Y (not world)
   * @param {number[]} config.pattern - array of tile indexes (horizontal)
   * @param {number} [config.color=0xFFFFFF]
   * @param {Phaser.Tilemaps.Tilemap} config.map
   * @param {Phaser.Tilemaps.TilemapLayer} config.layer
   * @param {any} [config.dropItem=null] - optional drop item config
   */
  constructor(scene, config) {
    this.scene = scene;

    if (!config || typeof config !== 'object') {
      throw new Error('PlatformBase: config is required');
    }

    const { x, y, pattern, color = 0xFFFFFF, map, layer, dropItem = null } = config;

    if (!map || !layer) {
      throw new Error('PlatformBase: map and layer are required');
    }
    if (!Array.isArray(pattern) || pattern.length === 0) {
      throw new Error('PlatformBase: pattern must be a non-empty array of tile indexes');
    }

    this.map = map;
    this.layer = layer;

    // tile coords
    this.x = x;
    this.y = y;

    this.pattern = pattern.slice();
    this.color = color;

    // Drops
    this.dropItem = dropItem;
    this.dropType = null;

    // Tile references
    this.tiles = [];

    this._createOrUpdateTiles();
  }

  _createOrUpdateTiles() {
    this.tiles.length = 0;

    for (let i = 0; i < this.pattern.length; i++) {
      const tileX = this.x + i;
      const tileY = this.y;

      let tile = this.layer.getTileAt(tileX, tileY);

      // If tile is missing (e.g. layer was cleared), recreate it.
      if (!tile) {
        tile = this.layer.putTileAt(this.pattern[i], tileX, tileY, true);
      } else if (tile.index !== this.pattern[i]) {
        // Ensure the correct tile index
        this.layer.putTileAt(this.pattern[i], tileX, tileY, true);
        tile = this.layer.getTileAt(tileX, tileY);
      }

      if (!tile) continue;

      // Visual tint (works in Phaser 3.60+; harmless if ignored)
      try {
        tile.tint = this.color;
        tile.tintFill = true;
      } catch (e) {
        // ignore if Phaser version doesn't support tile tint
      }

      tile.properties = tile.properties || {};
      tile.properties.platform = this;

      this.tiles.push(tile);
    }
  }

  /**
   * Assign a dropType string (used by DropManager).
   */
  setDropType(dropType) {
    this.dropType = dropType;
  }

  /**
   * Remove the platform tiles from the layer.
   */
  /**
 * Returns the approximate world-center position of this platform.
 * Works whether the tiles are original or recreated.
 * @returns {{x:number, y:number}}
 */
getCenterPosition() {
  // Prefer real tile data if available
  const firstTile =
    (this.tiles && this.tiles.length > 0 && this.tiles[0]) ||
    (this.layer ? this.layer.getTileAt(this.x, this.y) : null);

  const lastTile =
    (this.tiles && this.tiles.length > 0 && this.tiles[this.tiles.length - 1]) ||
    (this.layer ? this.layer.getTileAt(this.x + this.pattern.length - 1, this.y) : null);

  const layerX = this.layer?.x || 0;
  const layerY = this.layer?.y || 0;

  const tileW = firstTile?.width || this.map?.tileWidth || 32;
  const tileH = firstTile?.height || this.map?.tileHeight || 32;

  // Tile pixelX/Y are layer-local; add layer offset for world coords
  const left = (firstTile?.pixelX ?? (this.x * tileW)) + layerX;
  const right = (lastTile?.pixelX ?? ((this.x + this.pattern.length - 1) * tileW)) + layerX + tileW;
  const top = (firstTile?.pixelY ?? (this.y * tileH)) + layerY;

  return {
    x: (left + right) / 2,
    y: top + tileH / 2,
  };
}

destroy() {
    if (!this.layer) return;

    for (let i = 0; i < this.pattern.length; i++) {
      const tileX = this.x + i;
      const tileY = this.y;
      this.layer.removeTileAt(tileX, tileY, true, true);
    }

    this.tiles.length = 0;
    this.layer = null;
    this.map = null;
  }
}
