// src/entities/items/Dropper.js

import { Fruits } from './Fruits.js';
import { PowerUpLife } from './powerups/PowerUpLife.js';
import { PowerUpShield } from './powerups/PowerUpShield.js';
import { PowerUpWeapon } from './powerups/PowerUpWeapon.js';
import { WeaponTempDouble } from './powerups/WeaponTempDouble.js';
import { WeaponTempMachine } from './powerups/WeaponTempMachine.js';
import { WeaponTempFixed } from './powerups/WeaponTempFixed.js';
import { PowerUpBomb } from './powerups/PowerUpBomb.js';
import { PowerUpTimeFreeze } from './powerups/PowerUpTimeFreeze.js';
import { PowerUpTimeSlow } from './powerups/PowerUpTimeSlow.js';

// Tabla de botín por defecto
export const DEFAULT_LOOT_TABLE = [
  { type: 'FRUITS', weight: 40, variant: 'SMALL' },
  { type: 'FRUITS', weight: 25, variant: 'MEDIUM' },
  { type: 'FRUITS', weight: 15, variant: 'LARGE' },
  { type: 'FRUITS', weight: 5,  variant: 'SPECIAL' },

  { type: 'WEAPON_TEMP_DOUBLE',  weight: 7 },
  { type: 'WEAPON_TEMP_MACHINE', weight: 6 },
  { type: 'WEAPON_TEMP_FIXED',   weight: 5 },

  { type: 'POWER_UP_SHIELD', weight: 6 },
  { type: 'POWER_UP_BOMB',   weight: 4 },
  { type: 'TIME_FREEZE',     weight: 3 },
  { type: 'TIME_SLOW',       weight: 3 },
  { type: 'POWER_UP_LIFE',   weight: 1 },
];

export const DROPPER_CONFIG = {
  MAX_ITEMS_ON_SCREEN: 8,
  DROP_CHANCE: 0.4,
  INITIAL_VELOCITY_X_RANGE: [-100, 100],
  INITIAL_VELOCITY_Y: -150,
};

// Mapeo desde strings del Tiled a ids internos
const TILED_DROP_MAP = {
  // powerups
  shield: 'POWER_UP_SHIELD',
  life: 'POWER_UP_LIFE',
  bomb: 'POWER_UP_BOMB',
  time_freeze: 'TIME_FREEZE',
  time_slow: 'TIME_SLOW',

  // weapons temporales
  double_harpoon: 'WEAPON_TEMP_DOUBLE',
  machine_gun: 'WEAPON_TEMP_MACHINE',
  fix_harpoon: 'WEAPON_TEMP_FIXED',

  // si alguna vez lo usas:
  weapon: 'POWER_UP_WEAPON',
  power_up_weapon: 'POWER_UP_WEAPON',
};

// Normaliza y convierte el tipo del mapa a interno
function normalizeItemType(rawType) {
  if (!rawType) return null;

  const t = String(rawType).trim();

  // Si ya es un tipo interno conocido, lo devolvemos tal cual
  const alreadyInternal = [
    'FRUITS',
    'POWER_UP_LIFE',
    'POWER_UP_SHIELD',
    'POWER_UP_BOMB',
    'POWER_UP_WEAPON',
    'WEAPON_TEMP_DOUBLE',
    'WEAPON_TEMP_MACHINE',
    'WEAPON_TEMP_FIXED',
    'TIME_FREEZE',
    'TIME_SLOW',
  ];
  if (alreadyInternal.includes(t)) return t;

  // Si viene de tiled, pasamos a minúsculas y mapeamos
  const key = t.toLowerCase();
  return TILED_DROP_MAP[key] || t; // fallback
}

export class Dropper {
  constructor(scene, config = {}) {
    this.scene = scene;

    this.lootTable = config.lootTable || DEFAULT_LOOT_TABLE;
    this.maxItems = config.maxItems !== undefined ? config.maxItems : DROPPER_CONFIG.MAX_ITEMS_ON_SCREEN;
    this.dropChance = config.dropChance !== undefined ? config.dropChance : DROPPER_CONFIG.DROP_CHANCE;

    this.activeItems = scene.physics.add.group({
      collideWorldBounds: true,
      bounceX: 0,
      bounceY: 0
    });

    this.totalWeight = this.lootTable.reduce((sum, entry) => sum + entry.weight, 0);

  }

  dropFrom(entity, x, y, options = {}) {
    if (!options.guaranteed && Math.random() > this.dropChance) {
      return null;
    }

    if (this.activeItems.getLength() >= this.maxItems) {
      return null;
    }

    let itemType = options.itemType;
    let variant = options.variant;

    if (!itemType) {
      const selection = this.selectRandomItem();
      itemType = selection.type;
      variant = selection.variant;
    }

    // ✅ acepta strings del Tiled y los convierte a internos
    itemType = normalizeItemType(itemType);

    const item = this.createItem(itemType, x, y, variant);

    if (item) {
      const velX = options.velocityX !== undefined
        ? options.velocityX
        : Phaser.Math.Between(
            DROPPER_CONFIG.INITIAL_VELOCITY_X_RANGE[0],
            DROPPER_CONFIG.INITIAL_VELOCITY_X_RANGE[1]
          );

      const velY = options.velocityY !== undefined
        ? options.velocityY
        : DROPPER_CONFIG.INITIAL_VELOCITY_Y;

      item.body.setVelocity(velX, velY);
      this.activeItems.add(item);

      item.once('destroy', () => {
        this.activeItems.remove(item, true);
      });

    }

    return item;
  }

  selectRandomItem() {
    const roll = Math.random() * this.totalWeight;
    let cumulative = 0;

    for (const entry of this.lootTable) {
      cumulative += entry.weight;
      if (roll <= cumulative) return entry;
    }

    return this.lootTable[0];
  }

  createItem(itemType, x, y, variant) {
    switch (itemType) {
      case 'FRUITS':
        return new Fruits(this.scene, x, y, variant || 'MEDIUM');

      case 'POWER_UP_LIFE':
        return new PowerUpLife(this.scene, x, y);

      case 'POWER_UP_SHIELD':
        return new PowerUpShield(this.scene, x, y);

      case 'POWER_UP_WEAPON':
        return new PowerUpWeapon(this.scene, x, y);

      case 'WEAPON_TEMP_DOUBLE':
        return new WeaponTempDouble(this.scene, x, y);

      case 'WEAPON_TEMP_MACHINE':
        return new WeaponTempMachine(this.scene, x, y);

      case 'WEAPON_TEMP_FIXED':
        return new WeaponTempFixed(this.scene, x, y);

      case 'POWER_UP_BOMB':
        return new PowerUpBomb(this.scene, x, y);

      case 'TIME_FREEZE':
        return new PowerUpTimeFreeze(this.scene, x, y);

      case 'TIME_SLOW':
        return new PowerUpTimeSlow(this.scene, x, y);

      default:
        console.warn(`Unknown item type: ${itemType}`);
        return null;
    }
  }

  dropSpecific(itemType, x, y, variant) {
    return this.dropFrom(null, x, y, {
      itemType,
      variant,
      guaranteed: true
    });
  }

  update(hero) {
    this.activeItems.getChildren().forEach(item => {
      if (item && item.active) item.checkPickup(hero);
    });
  }

  clearAll() {
    this.activeItems.clear(true, true);
  }

  getActiveItemCount() {
    return this.activeItems.getLength();
  }

  setLootTable(lootTable) {
    this.lootTable = lootTable;
    this.totalWeight = this.lootTable.reduce((sum, entry) => sum + entry.weight, 0);
  }
}
