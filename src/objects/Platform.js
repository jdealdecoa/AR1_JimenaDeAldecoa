// src/objects/Platform.js

export class Platform {
  constructor(scene, tile) {
    this.scene = scene;
    this.tile = tile;

    this.x = tile.getCenterX();
    this.y = tile.getCenterY();

    // ✅ New: for DropManager assignment
    this.dropType = null;
  }

  setDropType(dropType) {
    this.dropType = dropType;
  }

  break(weapon = null) {
    if (this.tile && this.tile.tilemapLayer) {
      this.tile.tilemapLayer.removeTileAt(this.tile.x, this.tile.y);
    }

    // ✅ Drop on break (if assigned)
    if (this.dropType && this.scene.dropper) {
      this.scene.dropper.dropFrom(null, this.x, this.y, {
        itemType: this.dropType,
        guaranteed: true
      });
    }

    if (weapon && weapon.destroy) {
      weapon.destroy();
    }
  }
}

export default Platform;
