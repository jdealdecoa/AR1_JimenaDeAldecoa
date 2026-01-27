// src/entities/enemies/balls/BallManager.js

import { HugeBall } from './normal/HugeBall.js';
import { BigBall } from './normal/BigBall.js';
import { MidBall } from './normal/MidBall.js';
import { SmallBall } from './normal/SmallBall.js';
import { TinyBall } from './normal/TinyBall.js';

import { HexBigBall } from './hexagonal/HexBigBall.js';
import { HexMidBall } from './hexagonal/HexMidBall.js';
import { HexSmallBall } from './hexagonal/HexSmallBall.js';

import { BALL_COLORS } from './BallConstants.js';
import { EVENTS } from '../../../core/events.js';

export class BallManager {
  constructor(scene, map, ballsGroup) {
    this.scene = scene;
    this.map = map;
    this.ballsGroup = ballsGroup;
  }

  createFromObjectLayer(layerName = 'balls') {
    const layer = this.map.getObjectLayer(layerName);
    console.log(`[BallManager] createFromObjectLayer called for layer: '${layerName}'`);
    if (!layer) {
      console.warn(`[BallManager] No object layer found with name '${layerName}'`);
      return;
    }
    if (!layer.objects || !Array.isArray(layer.objects) || layer.objects.length === 0) {
      console.warn(`[BallManager] Object layer '${layerName}' has no objects!`, layer);
      return;
    }
    console.log(`[BallManager] Objects in layer '${layerName}':`, layer.objects);

    layer.objects.forEach(obj => {
      console.log('[BallManager] Processing object:', obj);
        // Detecta el tipo de bola
      let type = null;
      if (obj.properties) {
        type = obj.properties.find(p => p.name === 'type')?.value;
      }
      if (!type && obj.type) type = obj.type;
      if (!type && obj.name) type = obj.name;
      if (!type) {
        console.warn('[BallManager] Object has no type:', obj);
        return;
      }

      let dirX = this._numProp(obj, 'dirX');
      if (dirX === undefined || dirX === null) dirX = this._numProp(obj, 'direction x');
      let speed = this._numProp(obj, 'initialSpeed');
      if (speed === undefined || speed === null) speed = this._numProp(obj, 'velocity');
      const color = this._parseColor(this._getProp(obj, 'color'));

      console.log(`[BallManager] Spawning ball: type=${type}, x=${obj.x}, y=${obj.y}, dirX=${dirX}, speed=${speed}, color=${color}`);
      const ball = this.spawnBall(
        type,
        obj.x,
        obj.y,
        dirX,
        speed,
        color
      );

      if (ball) {
        this.ballsGroup.add(ball);
        console.log('[BALL ADDED] (from Tiled)', ball, 'Current group:', this.ballsGroup.getChildren());
      } else {
        console.warn('[BallManager] Failed to spawn ball for object:', obj);
      }
    });
    console.log('[BALLS INIT FINAL] Group:', this.ballsGroup.getChildren());
  }

  spawnBall(type, x, y, dirX, initialSpeed, color) {
    const finalDirX = dirX ?? (Phaser.Math.Between(0, 1) === 0 ? 1 : -1);
    const finalSpeed = initialSpeed ?? undefined;
    const finalColor = color ?? this._randomBallColor();

    // Typo correction for Tiled mistakes
      let safeType = type?.toLowerCase();
    if (safeType === 'n_tinty') safeType = 'n_tiny';

    let ball;
    switch (safeType) {
      // Normal balls: x = direction x * velocity, y = 0
      case 'n_huge': ball = new HugeBall(this.scene, x, y, finalDirX * (finalSpeed ?? 180), finalColor, finalSpeed); break;
      case 'n_big': ball = new BigBall(this.scene, x, y, finalDirX * (finalSpeed ?? 180), finalColor, finalSpeed); break;
      case 'n_mid': ball = new MidBall(this.scene, x, y, finalDirX * (finalSpeed ?? 210), finalColor, finalSpeed); break;
      case 'n_small': ball = new SmallBall(this.scene, x, y, finalDirX * (finalSpeed ?? 240), finalColor, finalSpeed); break;
      case 'n_tiny': ball = new TinyBall(this.scene, x, y, finalDirX * (finalSpeed ?? 270), finalColor, finalSpeed); break;

      // Hexagonal balls: x = direction * velocity, y = -1 * velocity
      case 'h_big': ball = new HexBigBall(this.scene, x, y, finalDirX * (finalSpeed ?? 180), -1 * (finalSpeed ?? 180), finalColor, finalSpeed); break;
      case 'h_mid': ball = new HexMidBall(this.scene, x, y, finalDirX * (finalSpeed ?? 210), -1 * (finalSpeed ?? 210), finalColor, finalSpeed); break;
      case 'h_small': ball = new HexSmallBall(this.scene, x, y, finalDirX * (finalSpeed ?? 240), -1 * (finalSpeed ?? 240), finalColor, finalSpeed); break;
      default: ball = null;
    }
    // Emit BALL_CREATED event
      if (ball && this.scene && this.scene.game && this.scene.game.events) {
      this.scene.game.events.emit(EVENTS.enemy.BALL_CREATED, ball);
    }
    return ball;
  }

  _getProp(obj, name) {
    return obj.properties?.find(p => p.name === name)?.value ?? null;
  }

  _numProp(obj, name) {
    const v = Number(this._getProp(obj, name));
    return Number.isFinite(v) ? v : null;
  }

  _parseColor(value) {
    if (!value || value === 'random') return null;
    return typeof value === 'string' ? Number(value.replace('#', '0x')) : value;
  }

  _randomBallColor() {
    const colors = Object.values(BALL_COLORS);
    return colors[Math.floor(Math.random() * colors.length)];
  }
}

export default BallManager;
