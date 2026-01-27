import { EVENTS } from '../../../core/events.js';

/**
 * BaseCrocodile - Ground patrolling enemy with animated sprite
 *
 * Spritesheet: 590x127 (5 frames of 118x127 each)
 * - Frames 0-3: Walking animation
 * - Frame 4: Stunned/dead pose
 */

export class BaseCrocodile extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, speed = 80, scoreValue = 200) {
    super(scene, x, y, texture);

    scene.add.existing(this);
    scene.physics.world.enable(this);

    this.baseSpeed = speed;
    this.scoreValue = scoreValue;
    this.direction = 1; // 1 = right, -1 = left

    // Crocodile states
    this.state = 'PATROLLING';
    this.isDead = false;

    // Patrol behavior
    this.patrolStartTime = scene.time.now;
    this.minPatrolTime = 10000;
    this.hasPatrolledEnough = false;
    this.isAtLowestLevel = false;

    // Edge detection
    this.edgeCheckDistance = 16;

    // Ladder tracking
    this.currentLadder = null;
    this.ladderCheckCooldown = 0;

    // Stun tracking
    this.stunTime = 0;
    this.stunDuration = 0;

    // Flying tracking
    this.hasDroppedItem = false;

    // NEW: flying/explosion gating
    this._hasLeftGroundSinceLaunch = false;
    this._launchStartTime = 0;

    // Configure sprite
    this.setScale(1);

    // Create animations
    this.createAnimation(texture);

    // Play initial animation
    const animKey = `${texture}_walk`;
    if (this.scene.anims.exists(animKey)) {
      this.play(animKey);
    }

    // Physics - ground based enemy
    this.body.setAllowGravity(true);
    this.body.setGravityY(600);
    this.body.setBounce(0, 0);
    this.body.setCollideWorldBounds(true);
    this.body.onWorldBounds = true;

    this.body.immovable = false;
    this.body.moves = true;
    this.body.setDrag(500, 0);
    this.body.setMaxVelocity(200, 800);

    // Hitbox
    const hitboxWidth = this.width * 0.7;
    const hitboxHeight = this.height * 0.8;
    this.body.setSize(hitboxWidth, hitboxHeight);
    this.body.setOffset(
      (this.width - hitboxWidth) / 2,
      (this.height - hitboxHeight) / 2
    );

    // Enable ground collision
    this.body.checkCollision.down = true;
    this.body.checkCollision.up = false;
    this.body.checkCollision.left = true;
    this.body.checkCollision.right = true;

    // Initial velocity
    this.body.setVelocityX(this.baseSpeed * this.direction);

    // Flip sprite based on direction (sprite faces LEFT by default)
    this.setFlipX(this.direction > 0);

    // Listen for world bounds
    this.body.world.on('worldbounds', this.onWorldBoundsCollision, this);
  }

  /**
   * Create walk animation (frames 0-3)
   */
  createAnimation(texture) {
    const animKey = `${texture}_walk`;

    if (!this.scene.anims.exists(animKey)) {
      this.scene.anims.create({
        key: animKey,
        frames: this.scene.anims.generateFrameNumbers(texture, { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1
      });
    }
  }

  onWorldBoundsCollision(body) {
    if (body.gameObject !== this) return;
    if (this.state !== 'PATROLLING') return;

    if (this.isAtLowestLevel && this.hasPatrolledEnough) {
      if (body.blocked.left || body.blocked.right) {
        console.log('Crocodile exiting at lowest level');
        this.destroy();
      }
    } else {
      if (body.blocked.left || body.blocked.right) {
        this.reverseDirection();
      }
    }
  }

  checkGroundAhead() {
    if (!this.scene || !this.scene.physics || !this.body) return true;

    const checkX = this.x + (this.edgeCheckDistance * this.direction);
    const checkY = this.y + this.height / 2 + 10;

    const tile = this.scene.walls?.getTileAtWorldXY(checkX, checkY);

    return tile !== null;
  }

  checkForLadder() {
    if (!this.scene || !this.scene.ladders || this.ladderCheckCooldown > 0) {
      return null;
    }

    const tile = this.scene.ladders.getTileAtWorldXY(this.x, this.y);

    if (tile && tile.index !== -1) {
      this.ladderCheckCooldown = 1000;
      return tile;
    }

    return null;
  }

  checkIfAtLowestLevel() {
    if (!this.scene || !this.scene.physics) return false;

    const worldHeight = this.scene.physics.world.bounds.height;
    const distanceFromBottom = worldHeight - this.y;

    return distanceFromBottom < 150;
  }

  reverseDirection() {
    this.direction *= -1;
    this.setFlipX(this.direction > 0);
    console.log(`Crocodile reversed direction to ${this.direction > 0 ? 'right' : 'left'}`);
  }

  updatePatrolling(delta) {
    if (!this.body || this.isDead) return;

    const onGround = this.body.blocked.down || this.body.touching.down;

    if (!onGround) return;

    if (this.ladderCheckCooldown > 0) {
      this.ladderCheckCooldown -= delta;
    }

    this.isAtLowestLevel = this.checkIfAtLowestLevel();

    if (this.isAtLowestLevel) {
      const patrolElapsed = this.scene.time.now - this.patrolStartTime;
      if (patrolElapsed >= this.minPatrolTime) {
        this.hasPatrolledEnough = true;
      }
    }

    const ladder = this.checkForLadder();
    if (ladder && !this.isAtLowestLevel) {
      console.log('Crocodile found ladder, descending');
      this.state = 'DESCENDING_LADDER';
      this.currentLadder = ladder;
      this.body.setVelocityX(0);
      this.body.setVelocityY(100);
      return;
    }

    const hasGroundAhead = this.checkGroundAhead();
    if (!hasGroundAhead) {
      console.log('Crocodile detected edge, reversing');
      this.reverseDirection();
    }

    if (this.body.blocked.left || this.body.blocked.right) {
      this.reverseDirection();
    }

    this.body.setVelocityX(this.baseSpeed * this.direction);
  }

  updateDescending(delta) {
    if (!this.body || this.isDead) return;

    const onLadder = this.scene.ladders?.getTileAtWorldXY(this.x, this.y);

    if (!onLadder || onLadder.index === -1) {
      console.log('Crocodile reached bottom of ladder');
      this.state = 'PATROLLING';
      this.patrolStartTime = this.scene.time.now;
      this.body.setVelocityY(0);
      return;
    }

    if (this.body.blocked.down || this.body.touching.down) {
      console.log('Crocodile reached ground');
      this.state = 'PATROLLING';
      this.patrolStartTime = this.scene.time.now;
      this.body.setVelocityY(0);
      return;
    }

    this.body.setVelocityX(0);
    this.body.setVelocityY(100);
  }

  updateStunned(delta) {
    // Stay still, wait for player collision
    this.body.setVelocityX(0);
    this.body.setVelocityY(0);
  }

  updateFlying(delta) {
    if (!this.body) return;

    const onGround = this.body.blocked.down || this.body.touching.down;

    // IMPORTANT:
    // Al lanzar, Arcade puede seguir marcando "down" durante 1 frame.
    // Solo permitimos explotar cuando ya haya dejado el suelo al menos una vez.
    if (!this._hasLeftGroundSinceLaunch) {
      if (!onGround) {
        this._hasLeftGroundSinceLaunch = true;
      }
      return;
    }

    // Ya estuvo en el aire, ahora sí: si toca suelo -> explota
    if (onGround) {
      this.explode();
    }
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);

    if (!this.scene || !this.body || this.isDead) return;

    switch (this.state) {
      case 'PATROLLING':
        this.updatePatrolling(delta);
        break;
      case 'DESCENDING_LADDER':
        this.updateDescending(delta);
        break;
      case 'STUNNED':
        this.updateStunned(delta);
        break;
      case 'FLYING':
        this.updateFlying(delta);
        break;
    }
  }

  /**
   * Crocodile hit by weapon - becomes STUNNED (immobile, frame 4)
   * Does NOT die yet, waits for player collision
   */
  takeDamage() {
    if (this.isDead || this.state === 'STUNNED' || this.state === 'FLYING') return;

    console.log('Crocodile stunned! (waiting for player collision)');

    // Change to stunned state
    this.state = 'STUNNED';
    this.stunTime = this.scene.time.now;

    // Stop ALL movement
    this.body.setVelocityX(0);
    this.body.setVelocityY(0);

    // Stop animation and show frame 4 (stunned pose)
    this.anims.stop();
    this.setFrame(4); // Frame 4 = stunned sprite

    // Show stun indicator
    this.showStunIndicator();

    // Play pop sound when crocodile is hit
    if (this.scene && this.scene.sound) {
      this.scene.sound.play('burbuja_pop', { volume: 0.7 });
    }
  }

  /**
   * Show stun stars/indicator
   */
  showStunIndicator() {
    if (!this.scene || !this.scene.add) return;

    const stunText = this.scene.add.text(this.x, this.y - 40, '⭐⭐⭐', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#FFFF00'
    });

    stunText.setOrigin(0.5, 0.5);
    stunText.setDepth(100);

    this.scene.tweens.add({
      targets: stunText,
      y: stunText.y - 20,
      alpha: 0,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => {
        stunText.destroy();
      }
    });
  }

  /**
   * Player collides with stunned crocodile - launch it flying and THEN it dies
   */
  launchFlying(playerX) {
    if (this.state !== 'STUNNED') return;
    if (this.isDead || this.state === 'FLYING') return;

    console.log('Crocodile launched flying by player!');

    // NOW award points
    if (this.scene && this.scene.game && this.scene.game.events) {
      this.scene.game.events.emit(EVENTS.game.SCORE_CHANGE, this.scoreValue);
    }

    // Show score
    this.showFloatingScore();

    // NOW drop item
    if (!this.hasDroppedItem && this.scene.dropper) {
      this.scene.dropper.dropFrom(this, this.x, this.y);
      this.hasDroppedItem = true;
    }

    // Change to flying state
    this.state = 'FLYING';

    // Calculate launch direction (away from player)
    const launchDirection = this.x > playerX ? 1 : -1;

    // === TUNING DE VUELO (más alto y más lejos) ===
    const LAUNCH = {
      VX: 360,       // más distancia
      VY: -520,      // más altura
      GRAVITY_Y: 380 // más flotante durante vuelo
    };

    // Reiniciar gating anti-explosión inmediata
    this._hasLeftGroundSinceLaunch = false;
    this._launchStartTime = this.scene?.time?.now ?? 0;

    // Ajustes físicos para vuelo
    this.body.setDrag(0, 0);
    this.body.setGravityY(LAUNCH.GRAVITY_Y);
    this.body.setMaxVelocity(600, 1400);

    // Lanzamiento
    this.body.setVelocityX(launchDirection * LAUNCH.VX);
    this.body.setVelocityY(LAUNCH.VY);

    // Pequeño empujón para despegar del suelo (evita touching.down 1 frame)
    this.y -= 3;

    // Keep frame 4 while flying
    this.setFrame(4);

    // Spin while flying
    this.scene.tweens.add({
      targets: this,
      angle: launchDirection > 0 ? 360 : -360,
      duration: 500,
      ease: 'Linear',
      repeat: -1
    });
  }

  /**
   * Show floating score
   */
  showFloatingScore() {
    if (!this.scene || !this.scene.add || !this.scene.tweens) return;

    const scoreText = this.scene.add.text(this.x, this.y, `+${this.scoreValue}`, {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#00FF00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    });

    scoreText.setOrigin(0.5, 0.5);
    scoreText.setDepth(100);

    this.scene.tweens.add({
      targets: scoreText,
      y: scoreText.y - 50,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => {
        scoreText.destroy();
      }
    });
  }

  /**
   * Explode when hitting ground after flying
   */
  explode() {
    if (this.isDead) return;

    this.isDead = true;
    this.state = 'DEAD';

    console.log('Crocodile exploded!');

    this.createExplosion();

    if (this.scene && this.scene.time) {
      this.scene.time.delayedCall(100, () => {
        this.destroy();
      });
    } else {
      this.destroy();
    }
  }

  /**
   * Create explosion visual effect
   */
  createExplosion() {
    if (!this.scene || !this.scene.add || !this.scene.tweens) return;

    const explosion = this.scene.add.circle(this.x, this.y, this.width, 0xff8800, 1);
    explosion.setDepth(50);

    this.scene.tweens.add({
      targets: explosion,
      scaleX: 3,
      scaleY: 3,
      alpha: 0,
      duration: 400,
      ease: 'Power2',
      onComplete: () => explosion.destroy()
    });

    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i;
      const particle = this.scene.add.circle(
        this.x,
        this.y,
        4,
        0xffaa00,
        1
      );
      particle.setDepth(50);

      this.scene.tweens.add({
        targets: particle,
        x: particle.x + Math.cos(angle) * 40,
        y: particle.y + Math.sin(angle) * 40,
        alpha: 0,
        duration: 400,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
    }
  }

  destroy(fromScene) {
    if (this.body && this.body.world) {
      this.body.world.off('worldbounds', this.onWorldBoundsCollision, this);
    }

    super.destroy(fromScene);
  }
}
