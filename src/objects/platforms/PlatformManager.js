// src/objects/platforms/PlatformManager.js

import { PlatformStatic } from './PlatformStatic.js';
import { PlatformBreakable } from './PlatformBreakable.js';

export class PlatformManager {
  constructor(scene, map, layer) {
    this.scene = scene;
    this.map = map;
    this.layer = layer;

    this.platforms = [];
    this.staticPlatforms = [];
    this.breakablePlatforms = [];
  }

  createStaticPlatform(x, y, pattern, color = 0xFFFFFF) {
    const platform = new PlatformStatic(this.scene, {
      x, y, pattern, color,
      map: this.map,
      layer: this.layer
    });

    this.platforms.push(platform);
    this.staticPlatforms.push(platform);

    return platform;
  }

  // Robust platform creation: evita duplicados y tiles invisibles
  createBreakablePlatform(x, y, pattern, color = 0xFFFFFF, dropItem = null) {
    // Verifica que no hay plataforma previa en esos tiles
    const tilesToCheck = pattern.map((_, i) => this.layer.getTileAt(x + i, y));
    if (tilesToCheck.some(t => t && t.properties && t.properties.platform)) {
      console.warn('Ya existe una plataforma en estos tiles, se omite la creación.');
      return null;
    }
    const platform = new PlatformBreakable(this.scene, {
      x, y, pattern, color,
      map: this.map,
      layer: this.layer,
      dropItem
    });

    // ✅ Ensure tile->platform reference exists
    if (platform.tiles && platform.tiles.length) {
      platform.tiles.forEach(t => {
        if (!t) return;
        t.properties = t.properties || {};
        t.properties.platform = platform;
      });
    }

    this.platforms.push(platform);
    this.breakablePlatforms.push(platform);

    return platform;
  }

  /**
   * ✅ Needed by DropManager: returns all platforms created by this manager
   */
  getAllPlatforms() {
    return this.platforms;
  }

  update(time, delta) {
    this.platforms.forEach(platform => {
      if (!platform.isDestroyed && platform.update) {
        platform.update(time, delta);
      }
    });

    this.platforms = this.platforms.filter(p => !p.isDestroyed);
    this.breakablePlatforms = this.breakablePlatforms.filter(p => !p.isDestroyed);
    this.staticPlatforms = this.staticPlatforms.filter(p => !p.isDestroyed);
  }

  onWeaponHitPlatform(weapon, tile) {
    if (!tile || !tile.properties) return;

    const platform = tile.properties.platform;

    if (platform && platform.type === 'BREAKABLE' && !platform.isDestroyed) {
      platform.break(weapon);
    }
  }

  getBreakableTiles() {
    return this.breakablePlatforms.flatMap(p => p.tiles).filter(t => t);
  }

  createExamplePlatforms() {
    this.createStaticPlatform(10, 10, [0, 1, 1, 2], 0x808080);

    this.createBreakablePlatform(15, 12, [6], 0x00FFFF, {
      type: 'FRUITS',
      variant: 'LARGE'
    });

    this.createBreakablePlatform(8, 15, [0, 1, 2], 0xFF4444, null);
  }
}
