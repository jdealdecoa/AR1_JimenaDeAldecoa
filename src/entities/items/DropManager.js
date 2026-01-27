

export class DropManager {
  /**
   * @param {Phaser.Scene} scene
   * @param {Phaser.Tilemaps.Tilemap} map
   * @param {Dropper} dropper
   * @param {PlatformManager} platformManager
   * @param {Map<string, any>} platformObjects  
   */
  constructor(scene, map, dropper, platformManager, platformObjects = null) {
    this.scene = scene;
    this.map = map;
    this.dropper = dropper;
    this.platformManager = platformManager;
    this.platformObjects = platformObjects;
  }

  createDropsFromLayers() {
    this._createWorldDrops();
    this._assignPlatformDrops();
  }

  _createWorldDrops() {
    const layer = this.map.getObjectLayer('drops');
    if (!layer || !layer.objects) return;

    layer.objects.forEach(obj => {
      const dropId = this._readProp(obj, ['Drop', 'drop', 'DROP']);
      if (!dropId) return;

      // Spawnea el ítem garantizado en el mundo
      this.dropper.dropFrom(null, obj.x, obj.y, {
        itemType: dropId,
        guaranteed: true
      });
    });
  }

  _assignPlatformDrops() {
    const layer = this.map.getObjectLayer('drops_platforms');
    if (!layer || !layer.objects) return;

    const platforms = this._getAllPlatforms();
    if (!platforms.length) return;

    layer.objects.forEach(obj => {
      const dropId = this._readProp(obj, ['drop', 'Drop', 'DROP']);
      if (!dropId) return;

      const closest = this._findClosestPlatform(platforms, obj.x, obj.y);
      if (!closest) return;

      // Asigna dropType de forma flexible
      if (typeof closest.setDropType === 'function') {
        closest.setDropType(dropId);
      } else {
        closest.dropType = dropId;
      }

      // Opcional: debug
      // console.log(`[DropManager] Assigned drop "${dropId}" to platform`, closest);
    });
  }

  _readProp(obj, possibleNames = []) {
    if (!obj || !obj.properties) return null;

    for (const name of possibleNames) {
      const p = obj.properties.find(pp => pp.name === name);
      if (p && p.value !== undefined && p.value !== null && `${p.value}`.trim() !== '') {
        return `${p.value}`.trim();
      }
    }
    return null;
  }

  _getAllPlatforms() {
    const list = [];

    // Plataformas del PlatformManager (nuevo sistema)
    if (this.platformManager && typeof this.platformManager.getAllPlatforms === 'function') {
      const pm = this.platformManager.getAllPlatforms();
      if (Array.isArray(pm)) list.push(...pm);
    }

    // Plataformas legacy (si las usas)
    if (this.platformObjects) {
      const legacy = Array.from(this.platformObjects.values());
      list.push(...legacy);
    }

    // Filtra nulos/inactivos
    return list.filter(p => p && p.active !== false);
  }

  _findClosestPlatform(platforms, x, y) {
    let closest = null;
    let minDist2 = Infinity;

    for (const p of platforms) {
      if (!p) continue;


      let px;
      let py;

      if (typeof p.getCenterPosition === 'function') {
        const c = p.getCenterPosition();
        px = c.x;
        py = c.y;
      } else if (typeof p.getCenter === 'function') {
        const c = p.getCenter();
        px = c.x;
        py = c.y;
      } else if (p.body && p.body.center) {
        px = p.body.center.x;
        py = p.body.center.y;
      } else {
        // Fallback: si p.x/p.y son tiles (nuevo sistema), convertir a mundo
        px = p.x;
        py = p.y;
        if (p.map && typeof p.map.tileToWorldX === 'function' && typeof p.map.tileToWorldY === 'function') {
          // Heurística: si parecen coordenadas de tile (pequeñas), convertir
          if (px !== undefined && py !== undefined && px < 1000 && py < 1000) {
            px = p.map.tileToWorldX(p.x) + (p.map.tileWidth / 2);
            py = p.map.tileToWorldY(p.y) + (p.map.tileHeight / 2);
          }
        }
      }

      if (px === undefined || py === undefined) continue;

      const dx = px - x;
      const dy = py - y;
      const d2 = dx * dx + dy * dy;

      if (d2 < minDist2) {
        minDist2 = d2;
        closest = p;
      }
    }

    return closest;
  }
}
